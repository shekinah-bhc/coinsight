-- ==============================================================================
-- Coinsight — Production Database Architecture
-- Migration 8: Budget Management Integrity, Active Category Guard & Indexes
-- File: supabase/migrations/20261111120000_budgets_management.sql
-- ==============================================================================
-- Safety Guarantees:
-- 1. Preserves all existing budget records (public.budgets), category records
--    (public.categories), transaction references, and RLS policies.
-- 2. Enforces concurrency-safe category validation when creating or updating
--    budgets: only expense categories owned by the user are allowed, and newly
--    assigned categories must be active (is_active = TRUE).
-- 3. Historical budgets whose categories were subsequently archived remain
--    intact and can still have their allocation amount updated or be deleted.
-- 4. Adds covering/composite indexes for fast monthly category spending
--    aggregation and monthly budget lookups.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PREFLIGHT INTEGRITY CHECK ON EXISTING BUDGETS
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_invalid_budget RECORD;
BEGIN
    -- Verify no existing budget references a non-expense category
    SELECT b.id, b.user_id, b.category_id, c.type AS actual_category_type
    INTO v_invalid_budget
    FROM public.budgets b
    JOIN public.categories c ON c.id = b.category_id
    WHERE c.type <> 'expense'
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION
            'Coinsight Migration Preflight Error: Budget id=% (user_id=%) references category id=% with non-expense type "%". Budgets are restricted to expense categories.',
            v_invalid_budget.id,
            v_invalid_budget.user_id,
            v_invalid_budget.category_id,
            v_invalid_budget.actual_category_type
            USING ERRCODE = '23514';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. CONCURRENCY-SAFE BUDGET INTEGRITY & ACTIVE CATEGORY TRIGGER
-- ------------------------------------------------------------------------------
-- Enforces on public.budgets:
-- - Immutable id and user_id on UPDATE.
-- - Automatic normalization of category_type = 'expense' and period_end = last day of period_start month.
-- - Concurrency-safe FOR SHARE lock on the referenced public.categories row.
-- - Rejects income categories (must be 'expense').
-- - Rejects archived categories (is_active = FALSE) on INSERT, or on UPDATE when
--   changing category_id to a different category. Updating the amount of an
--   existing budget whose category was later archived remains permitted.
CREATE OR REPLACE FUNCTION public.enforce_budget_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_cat_type TEXT;
    v_is_active BOOLEAN;
BEGIN
    -- Enforce expense-only category_type
    NEW.category_type := 'expense';

    -- Normalize period_start to first day of month and period_end to last day of month
    IF NEW.period_start IS NOT NULL THEN
        NEW.period_start := date_trunc('month', NEW.period_start)::date;
        NEW.period_end := (date_trunc('month', NEW.period_start) + interval '1 month - 1 day')::date;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF (OLD.id IS DISTINCT FROM NEW.id) OR (OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
            RAISE EXCEPTION 'Coinsight Error: Budget identifier and user ownership are immutable.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    -- Lock the referenced category row to prevent concurrent archiving or type mutation race conditions
    SELECT type, COALESCE(is_active, TRUE)
    INTO v_cat_type, v_is_active
    FROM public.categories
    WHERE id = NEW.category_id
      AND user_id = NEW.user_id
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Coinsight Error: Selected category % does not exist or does not belong to you.', NEW.category_id
            USING ERRCODE = '23503';
    END IF;

    IF v_cat_type <> 'expense' THEN
        RAISE EXCEPTION 'Coinsight Error: Budgets can only be created for expense categories (selected category is "%").', v_cat_type
            USING ERRCODE = '23514';
    END IF;

    -- Reject archived category on INSERT, or on UPDATE when switching to a different category
    IF (TG_OP = 'INSERT' OR NEW.category_id IS DISTINCT FROM OLD.category_id) AND NOT v_is_active THEN
        RAISE EXCEPTION 'Coinsight Error: Cannot create or reassign a budget to an archived category (%).', NEW.category_id
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_budget_integrity() IS
'Enforces expense-only active category assignment, month boundary normalization, and ownership immutability on public.budgets.';

REVOKE EXECUTE ON FUNCTION public.enforce_budget_integrity() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_budget_integrity() FROM anon;

DROP TRIGGER IF EXISTS trg_budgets_enforce_integrity ON public.budgets;
CREATE TRIGGER trg_budgets_enforce_integrity
    BEFORE INSERT OR UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_budget_integrity();

-- ------------------------------------------------------------------------------
-- 3. PERFORMANCE INDEXES FOR MONTHLY BUDGET & SPENDING AGGREGATION
-- ------------------------------------------------------------------------------
-- Covering partial index for monthly expense aggregation by user, date, and category.
-- Enables index-only scans when computing category spending within a month boundary.
CREATE INDEX IF NOT EXISTS idx_transactions_user_expense_date_category
    ON public.transactions (user_id, transaction_date, category_id)
    INCLUDE (amount)
    WHERE type = 'expense' AND category_id IS NOT NULL;

-- Composite index for looking up all category budgets for a user in a specific month
CREATE INDEX IF NOT EXISTS idx_budgets_user_period_category
    ON public.budgets (user_id, period_start, category_id);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

