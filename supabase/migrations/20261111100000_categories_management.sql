-- ==============================================================================
-- Coinsight — Production Database Architecture
-- Migration 7: Categories Management, Archiving, Active Uniqueness & Integrity
-- File: supabase/migrations/20261111100000_categories_management.sql
-- ==============================================================================
-- Safety Guarantees:
-- 1. Preserves all existing category UUIDs (public.categories.id), transaction
--    references (public.transactions.category_id), budget references
--    (public.budgets.category_id), default categories, and RLS policies.
-- 2. Never deletes or archives default categories (is_default = TRUE).
-- 3. Aborts immediately with a descriptive exception if preflight checks detect
--    duplicate default categories, inactive default categories, or invalid names.
-- 4. Safely removes only uq_categories_user_type_normalized_name after verifying
--    whether it is a standalone index or constraint, without touching
--    uq_categories_id_user_type (which backs transaction and budget FKs).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ADD IS_ACTIVE COLUMN TO CATEGORIES TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.categories.is_active IS
'Indicates whether the category is active and selectable for new transactions. Archived categories remain FALSE to preserve historical references.';

-- ------------------------------------------------------------------------------
-- 2. PREFLIGHT DATA INTEGRITY & DUPLICATE DEFAULT CATEGORY CHECKS
-- ------------------------------------------------------------------------------
-- Verify existing rows before adding constraints or replacing the unique index.
-- Never silently archive or delete default categories.
DO $$
DECLARE
    v_dup_default RECORD;
    v_inactive_default RECORD;
    v_invalid_name RECORD;
BEGIN
    -- 2a. Abort if duplicate default categories exist for the same (user_id, type, lower(btrim(name)))
    SELECT
        user_id,
        type,
        lower(btrim(name)) AS normalized_name,
        COUNT(*) AS duplicate_count
    INTO v_dup_default
    FROM public.categories
    WHERE is_default = TRUE
    GROUP BY user_id, type, lower(btrim(name))
    HAVING COUNT(*) > 1
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION
            'Coinsight Migration Preflight Error: Detected % duplicate default categories for user_id=%, type="%", normalized_name="%". Migration aborted; default categories are never automatically archived or deleted.',
            v_dup_default.duplicate_count,
            v_dup_default.user_id,
            v_dup_default.type,
            v_dup_default.normalized_name
            USING ERRCODE = '23505';
    END IF;

    -- 2b. Abort if any default category is marked inactive (is_active = FALSE)
    SELECT
        id,
        user_id,
        name,
        type
    INTO v_inactive_default
    FROM public.categories
    WHERE is_default = TRUE
      AND is_active = FALSE
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION
            'Coinsight Migration Preflight Error: Default category "%" (id=%, user_id=%, type="%") has is_active=FALSE. Default categories must remain active.',
            v_inactive_default.name,
            v_inactive_default.id,
            v_inactive_default.user_id,
            v_inactive_default.type
            USING ERRCODE = '23514';
    END IF;

    -- 2c. Abort if any existing category violates the trimmed name length (1..60)
    SELECT
        id,
        user_id,
        name,
        COALESCE(char_length(btrim(name)), 0) AS trimmed_len
    INTO v_invalid_name
    FROM public.categories
    WHERE name IS NULL
       OR char_length(btrim(name)) < 1
       OR char_length(btrim(name)) > 60
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION
            'Coinsight Migration Preflight Error: Category id=% (user_id=%) has invalid trimmed name length (%). Category names must be between 1 and 60 characters after trimming.',
            v_invalid_name.id,
            v_invalid_name.user_id,
            v_invalid_name.trimmed_len
            USING ERRCODE = '23514';
    END IF;

    -- 2d. If duplicate active CUSTOM categories exist for the same (user_id, type, lower(btrim(name)))
    -- (for example, a custom category duplicating a default or earlier custom category),
    -- archive only the redundant custom row (is_default = FALSE), never a default category.
    WITH ranked_active_categories AS (
        SELECT
            id,
            is_default,
            ROW_NUMBER() OVER (
                PARTITION BY user_id, type, lower(btrim(name))
                ORDER BY is_default DESC, created_at ASC, id ASC
            ) AS rn
        FROM public.categories
        WHERE is_active = TRUE
    )
    UPDATE public.categories c
    SET is_active = FALSE
    FROM ranked_active_categories r
    WHERE c.id = r.id
      AND r.rn > 1
      AND c.is_default = FALSE;
END $$;

-- ------------------------------------------------------------------------------
-- 3. CATEGORY INTEGRITY CONSTRAINTS
-- ------------------------------------------------------------------------------
-- Ensure default system categories always remain active
ALTER TABLE public.categories
    DROP CONSTRAINT IF EXISTS chk_categories_default_always_active;

ALTER TABLE public.categories
    ADD CONSTRAINT chk_categories_default_always_active
    CHECK (NOT is_default OR is_active = TRUE);

-- Enforce trimmed category name length (1 to 60 characters)
ALTER TABLE public.categories
    DROP CONSTRAINT IF EXISTS chk_categories_name_length;

ALTER TABLE public.categories
    ADD CONSTRAINT chk_categories_name_length
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 60);

-- ------------------------------------------------------------------------------
-- 4. SAFELY REPLACE FULL-TABLE UNIQUE INDEX WITH PARTIAL ACTIVE UNIQUE INDEX
-- ------------------------------------------------------------------------------
-- In 20261103100000_initial_schema.sql, uq_categories_user_type_normalized_name
-- was created as an independent expression index:
--   CREATE UNIQUE INDEX uq_categories_user_type_normalized_name
--       ON public.categories(user_id, type, lower(trim(name)));
-- Meanwhile, uq_categories_id_user_type is a table UNIQUE constraint on (id, user_id, type)
-- referenced by fk_transactions_category_ownership_type and fk_budgets_category_ownership.
-- The block below checks pg_catalog to remove uq_categories_user_type_normalized_name
-- safely whether it is a standalone index or a table constraint, while guaranteeing
-- no foreign-key-backing constraint is ever dropped.
DO $$
DECLARE
    v_con_oid OID;
    v_con_ind_oid OID;
    v_fk_dep_count INTEGER;
BEGIN
    SELECT c.oid, c.conindid
    INTO v_con_oid, v_con_ind_oid
    FROM pg_catalog.pg_constraint c
    WHERE c.conrelid = 'public.categories'::regclass
      AND c.conname = 'uq_categories_user_type_normalized_name';

    IF v_con_oid IS NOT NULL THEN
        -- Verify no foreign key references this constraint's index
        SELECT COUNT(*)
        INTO v_fk_dep_count
        FROM pg_catalog.pg_constraint fk
        WHERE fk.confrelid = 'public.categories'::regclass
          AND fk.conindid = v_con_ind_oid;

        IF v_fk_dep_count > 0 THEN
            RAISE EXCEPTION
                'Coinsight Migration Error: Constraint uq_categories_user_type_normalized_name is referenced by % foreign key(s) and cannot be dropped.',
                v_fk_dep_count
                USING ERRCODE = '2BP01';
        END IF;

        ALTER TABLE public.categories
            DROP CONSTRAINT uq_categories_user_type_normalized_name;
    ELSE
        -- Verify the standalone index does not back any other constraint on public.categories
        IF EXISTS (
            SELECT 1
            FROM pg_catalog.pg_class idx
            JOIN pg_catalog.pg_namespace ns ON ns.oid = idx.relnamespace
            JOIN pg_catalog.pg_constraint con ON con.conindid = idx.oid
            WHERE ns.nspname = 'public'
              AND idx.relname = 'uq_categories_user_type_normalized_name'
        ) THEN
            RAISE EXCEPTION
                'Coinsight Migration Error: Index uq_categories_user_type_normalized_name backs a table constraint and cannot be dropped directly.'
                USING ERRCODE = '2BP01';
        END IF;

        DROP INDEX IF EXISTS public.uq_categories_user_type_normalized_name;
    END IF;
END $$;

-- Partial unique index scoped strictly to active categories (is_active = TRUE).
-- Allows a user to archive a custom category and later create a new active category
-- with the same name, while preventing duplicate active names per (user_id, type).
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_active_user_type_normalized_name
    ON public.categories (user_id, type, lower(btrim(name)))
    WHERE is_active = TRUE;

-- Performance index for filtering categories by user, active status, and transaction type
CREATE INDEX IF NOT EXISTS idx_categories_user_active_type
    ON public.categories (user_id, is_active, type);

-- ------------------------------------------------------------------------------
-- 5. UPDATE DEFAULT CATEGORIES INITIALIZER FOR PARTIAL UNIQUE INDEX
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.init_default_categories()
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    current_uid UUID;
BEGIN
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required: init_default_categories must be called by an authenticated user.'
            USING ERRCODE = '42501';
    END IF;

    -- Standard Default Income Categories
    INSERT INTO public.categories (user_id, name, type, icon, color, is_default, is_active)
    VALUES
        (current_uid, 'Salary', 'income', 'Briefcase', '#42D6C5', TRUE, TRUE),
        (current_uid, 'Freelance', 'income', 'Laptop', '#38BDF8', TRUE, TRUE),
        (current_uid, 'Business', 'income', 'Building2', '#818CF8', TRUE, TRUE),
        (current_uid, 'Investments', 'income', 'TrendingUp', '#34D399', TRUE, TRUE),
        (current_uid, 'Gifts', 'income', 'Gift', '#F472B6', TRUE, TRUE),
        (current_uid, 'Refunds', 'income', 'RotateCcw', '#A78BFA', TRUE, TRUE),
        (current_uid, 'Other Income', 'income', 'PlusCircle', '#94A3B8', TRUE, TRUE)
    ON CONFLICT (user_id, type, lower(btrim(name))) WHERE is_active = TRUE DO NOTHING;

    -- Standard Default Expense Categories
    INSERT INTO public.categories (user_id, name, type, icon, color, is_default, is_active)
    VALUES
        (current_uid, 'Food & Dining', 'expense', 'Utensils', '#F87171', TRUE, TRUE),
        (current_uid, 'Transportation', 'expense', 'Car', '#FB923C', TRUE, TRUE),
        (current_uid, 'Shopping', 'expense', 'ShoppingBag', '#FBBF24', TRUE, TRUE),
        (current_uid, 'Housing', 'expense', 'Home', '#60A5FA', TRUE, TRUE),
        (current_uid, 'Utilities', 'expense', 'Zap', '#F59E0B', TRUE, TRUE),
        (current_uid, 'Healthcare', 'expense', 'HeartPulse', '#EC4899', TRUE, TRUE),
        (current_uid, 'Education', 'expense', 'GraduationCap', '#6366F1', TRUE, TRUE),
        (current_uid, 'Entertainment', 'expense', 'Film', '#A855F7', TRUE, TRUE),
        (current_uid, 'Travel', 'expense', 'Plane', '#14B8A6', TRUE, TRUE),
        (current_uid, 'Personal Care', 'expense', 'Sparkles', '#E879F9', TRUE, TRUE),
        (current_uid, 'Subscriptions', 'expense', 'CalendarSync', '#8B5CF6', TRUE, TRUE),
        (current_uid, 'Other Expenses', 'expense', 'MinusCircle', '#64748B', TRUE, TRUE)
    ON CONFLICT (user_id, type, lower(btrim(name))) WHERE is_active = TRUE DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.init_default_categories() IS
'Idempotent category seeder for authenticated users compatible with active partial unique index.';

REVOKE EXECUTE ON FUNCTION public.init_default_categories() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.init_default_categories() FROM anon;
GRANT EXECUTE ON FUNCTION public.init_default_categories() TO authenticated;

-- ------------------------------------------------------------------------------
-- 6. PROTECT DEFAULT CATEGORIES & IMMUTABLE CATEGORY TYPE WHEN REFERENCED
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_category_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- Allow cascade deletion when the owning auth.users record is being removed
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = OLD.user_id) THEN
            RETURN OLD;
        END IF;

        -- Default categories cannot be deleted
        IF OLD.is_default THEN
            RAISE EXCEPTION 'Coinsight Error: Default category "%" cannot be deleted.', OLD.name
                USING ERRCODE = '23514';
        END IF;

        -- Prevent deleting custom categories that have historical transactions
        -- (guards against fk_transactions_category_ownership_type ON DELETE SET NULL wiping history)
        IF EXISTS (
            SELECT 1 FROM public.transactions
            WHERE category_id = OLD.id
            LIMIT 1
        ) THEN
            RAISE EXCEPTION 'Coinsight Error: Category "%" has linked transactions and cannot be deleted. Archive it instead to preserve financial history.', OLD.name
                USING ERRCODE = '23503';
        END IF;

        -- Prevent deleting custom categories that have linked budgets
        -- (fails fast before deferred fk_budgets_category_ownership check at commit)
        IF EXISTS (
            SELECT 1 FROM public.budgets
            WHERE category_id = OLD.id
            LIMIT 1
        ) THEN
            RAISE EXCEPTION 'Coinsight Error: Category "%" has linked budgets and cannot be deleted. Archive it instead to preserve budget history.', OLD.name
                USING ERRCODE = '23503';
        END IF;

        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Normalize whitespace on category name
        IF NEW.name IS NOT NULL THEN
            NEW.name := btrim(NEW.name);
        END IF;

        -- Prevent altering category primary key or user ownership
        IF (OLD.id IS DISTINCT FROM NEW.id) OR (OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
            RAISE EXCEPTION 'Coinsight Error: Category identifier and user ownership are immutable.'
                USING ERRCODE = '23514';
        END IF;

        -- Prevent altering is_default flag
        IF OLD.is_default IS DISTINCT FROM NEW.is_default THEN
            RAISE EXCEPTION 'Coinsight Error: Cannot alter default designation of category "%".', OLD.name
                USING ERRCODE = '23514';
        END IF;

        -- Default categories are completely immutable (cannot be renamed, retyped, restyled, or archived)
        IF OLD.is_default THEN
            IF (OLD.name IS DISTINCT FROM NEW.name) OR
               (OLD.type IS DISTINCT FROM NEW.type) OR
               (OLD.icon IS DISTINCT FROM NEW.icon) OR
               (OLD.color IS DISTINCT FROM NEW.color) OR
               (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
                RAISE EXCEPTION 'Coinsight Error: Default category "%" cannot be renamed, retyped, modified, or archived.', OLD.name
                    USING ERRCODE = '23514';
            END IF;
        END IF;

        -- Prevent changing transaction type (expense <-> income) if transactions or budgets exist
        IF OLD.type IS DISTINCT FROM NEW.type THEN
            IF EXISTS (
                SELECT 1 FROM public.transactions
                WHERE category_id = OLD.id
                LIMIT 1
            ) THEN
                RAISE EXCEPTION 'Coinsight Error: Cannot change category type of "%" because transactions are already linked to it.', OLD.name
                    USING ERRCODE = '23514';
            END IF;

            IF EXISTS (
                SELECT 1 FROM public.budgets
                WHERE category_id = OLD.id
                LIMIT 1
            ) THEN
                RAISE EXCEPTION 'Coinsight Error: Cannot change category type of "%" because budgets are already linked to it.', OLD.name
                    USING ERRCODE = '23514';
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.name IS NOT NULL THEN
            NEW.name := btrim(NEW.name);
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_category_integrity() IS
'Protects default categories from modification/deletion and prevents deleting or changing category type once transactions or budgets exist.';

REVOKE EXECUTE ON FUNCTION public.enforce_category_integrity() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_category_integrity() FROM anon;

DROP TRIGGER IF EXISTS trg_categories_protect_integrity ON public.categories;
CREATE TRIGGER trg_categories_protect_integrity
    BEFORE INSERT OR UPDATE OR DELETE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_category_integrity();

-- ------------------------------------------------------------------------------
-- 7. CONCURRENCY-SAFE ENFORCEMENT PREVENTING NEW TRANSACTIONS ON ARCHIVED CATEGORIES
-- ------------------------------------------------------------------------------
-- Blocks assigning an archived category when creating a transaction or changing a transaction's category,
-- while allowing updates to other fields (amount, date, description, merchant, notes, account_id)
-- on historical transactions that already reference an archived category.
CREATE OR REPLACE FUNCTION public.enforce_transaction_category_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_is_active BOOLEAN;
    v_cat_type TEXT;
BEGIN
    IF NEW.category_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Lock the referenced category row to prevent concurrent archiving race conditions
    SELECT is_active, type INTO v_is_active, v_cat_type
    FROM public.categories
    WHERE id = NEW.category_id AND user_id = NEW.user_id
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Coinsight Error: Selected category % does not exist or does not belong to you.', NEW.category_id
            USING ERRCODE = '23503';
    END IF;

    IF v_cat_type <> NEW.type THEN
        RAISE EXCEPTION 'Coinsight Error: Category type (%) does not match transaction type (%).', v_cat_type, NEW.type
            USING ERRCODE = '23514';
    END IF;

    -- Reject archived category on INSERT, or on UPDATE when assigning a different category
    -- or altering user_id / transaction type. Editing non-category fields on historical
    -- transactions with an existing archived category remains permitted.
    IF (
        TG_OP = 'INSERT'
        OR NEW.category_id IS DISTINCT FROM OLD.category_id
        OR NEW.user_id IS DISTINCT FROM OLD.user_id
        OR NEW.type IS DISTINCT FROM OLD.type
    ) AND NOT v_is_active THEN
        RAISE EXCEPTION 'Coinsight Error: Cannot assign archived category % to a transaction.', NEW.category_id
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_transaction_category_active() IS
'Prevents assigning archived categories to new transactions while preserving historical archived categories on existing transactions.';

REVOKE EXECUTE ON FUNCTION public.enforce_transaction_category_active() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_transaction_category_active() FROM anon;

DROP TRIGGER IF EXISTS trg_transactions_enforce_category_active ON public.transactions;
CREATE TRIGGER trg_transactions_enforce_category_active
    BEFORE INSERT OR UPDATE OF category_id, type, user_id ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_transaction_category_active();

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
