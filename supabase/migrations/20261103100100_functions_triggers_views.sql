-- ==============================================================================
-- Coinsight — Production Database Architecture
-- Migration 2: Functions, Triggers, Views & Business Logic
-- File: supabase/migrations/20261103100100_functions_triggers_views.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. REUSABLE UPDATED_AT TIMESTAMP TRIGGER FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS 'Trigger function to automatically update the updated_at timestamp to now().';

-- Apply updated_at triggers to all core tables
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_accounts_updated_at ON public.accounts;
CREATE TRIGGER trg_accounts_updated_at
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_transfers_updated_at ON public.transfers;
CREATE TRIGGER trg_transfers_updated_at
    BEFORE UPDATE ON public.transfers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_budgets_updated_at ON public.budgets;
CREATE TRIGGER trg_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 2. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- ------------------------------------------------------------------------------
-- SECURITY DEFINER with fixed search_path = '' and fully qualified object names.
-- Note: No broad WHEN OTHERS exception handler. A failure to provision a profile
-- aborts the signup transaction to guarantee database consistency.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_full_name TEXT;
    user_avatar TEXT;
BEGIN
    -- Safely extract user metadata if provided during signup
    user_full_name := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')), '');
    user_avatar := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')), '');

    INSERT INTO public.profiles (
        id,
        full_name,
        avatar_url,
        currency,
        timezone,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_full_name,
        user_avatar,
        'INR',
        'Asia/Kolkata',
        now(),
        now()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automated profile provisioner triggered on auth.users insert.';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;

-- ------------------------------------------------------------------------------
-- 3. ACCOUNT CURRENCY IMMUTABILITY GUARD
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_account_currency_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.currency IS DISTINCT FROM NEW.currency THEN
        IF EXISTS (
            SELECT 1 FROM public.transactions
            WHERE account_id = OLD.id
            LIMIT 1
        ) THEN
            RAISE EXCEPTION 'Cannot change currency of account %: financial transactions already exist.', OLD.id
                USING ERRCODE = '23514';
        END IF;

        IF EXISTS (
            SELECT 1 FROM public.transfers
            WHERE from_account_id = OLD.id OR to_account_id = OLD.id
            LIMIT 1
        ) THEN
            RAISE EXCEPTION 'Cannot change currency of account %: transfer records already exist.', OLD.id
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_account_currency_mutation() IS 'Enforces currency immutability on accounts that have recorded transactions or transfers.';

DROP TRIGGER IF EXISTS trg_accounts_prevent_currency_change ON public.accounts;
CREATE TRIGGER trg_accounts_prevent_currency_change
    BEFORE UPDATE OF currency ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_account_currency_mutation();

-- ------------------------------------------------------------------------------
-- 4. TRANSFER SAME-CURRENCY VALIDATION TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_transfer_same_currency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_from_currency TEXT;
    v_to_currency TEXT;
BEGIN
    SELECT currency INTO v_from_currency
    FROM public.accounts
    WHERE id = NEW.from_account_id AND user_id = NEW.user_id;

    SELECT currency INTO v_to_currency
    FROM public.accounts
    WHERE id = NEW.to_account_id AND user_id = NEW.user_id;

    IF v_from_currency IS NULL OR v_to_currency IS NULL THEN
        RAISE EXCEPTION 'Transfer accounts must belong to the active user.'
            USING ERRCODE = '23503';
    END IF;

    IF v_from_currency <> v_to_currency THEN
        RAISE EXCEPTION 'Currency mismatch: Transfer from account (% currency: %) to account (% currency: %) is not permitted.',
            NEW.from_account_id, v_from_currency, NEW.to_account_id, v_to_currency
            USING ERRCODE = '23514';
    END IF;

    NEW.currency := v_from_currency;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_transfer_same_currency() IS 'Validates that both source and destination accounts in a transfer share the exact same currency.';

DROP TRIGGER IF EXISTS trg_transfers_currency_check ON public.transfers;
CREATE TRIGGER trg_transfers_currency_check
    BEFORE INSERT OR UPDATE OF from_account_id, to_account_id, currency, user_id ON public.transfers
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_transfer_same_currency();

-- ------------------------------------------------------------------------------
-- 5. DEFAULT CATEGORIES INITIALIZATION FUNCTION
-- ------------------------------------------------------------------------------
-- SECURITY INVOKER: Operates strictly within authenticated context and respects RLS.
-- Pinned search_path = '' and fully-qualified identifiers to prevent search path injection.
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
    INSERT INTO public.categories (user_id, name, type, icon, color, is_default)
    VALUES
        (current_uid, 'Salary', 'income', 'Briefcase', '#42D6C5', TRUE),
        (current_uid, 'Freelance', 'income', 'Laptop', '#38BDF8', TRUE),
        (current_uid, 'Business', 'income', 'Building2', '#818CF8', TRUE),
        (current_uid, 'Investments', 'income', 'TrendingUp', '#34D399', TRUE),
        (current_uid, 'Gifts', 'income', 'Gift', '#F472B6', TRUE),
        (current_uid, 'Refunds', 'income', 'RotateCcw', '#A78BFA', TRUE),
        (current_uid, 'Other Income', 'income', 'PlusCircle', '#94A3B8', TRUE)
    ON CONFLICT (user_id, type, lower(trim(name))) DO NOTHING;

    -- Standard Default Expense Categories
    INSERT INTO public.categories (user_id, name, type, icon, color, is_default)
    VALUES
        (current_uid, 'Food & Dining', 'expense', 'Utensils', '#F87171', TRUE),
        (current_uid, 'Transportation', 'expense', 'Car', '#FB923C', TRUE),
        (current_uid, 'Shopping', 'expense', 'ShoppingBag', '#FBBF24', TRUE),
        (current_uid, 'Housing', 'expense', 'Home', '#60A5FA', TRUE),
        (current_uid, 'Utilities', 'expense', 'Zap', '#F59E0B', TRUE),
        (current_uid, 'Healthcare', 'expense', 'HeartPulse', '#EC4899', TRUE),
        (current_uid, 'Education', 'expense', 'GraduationCap', '#6366F1', TRUE),
        (current_uid, 'Entertainment', 'expense', 'Film', '#A855F7', TRUE),
        (current_uid, 'Travel', 'expense', 'Plane', '#14B8A6', TRUE),
        (current_uid, 'Personal Care', 'expense', 'Sparkles', '#E879F9', TRUE),
        (current_uid, 'Subscriptions', 'expense', 'CalendarSync', '#8B5CF6', TRUE),
        (current_uid, 'Other Expenses', 'expense', 'MinusCircle', '#64748B', TRUE)
    ON CONFLICT (user_id, type, lower(trim(name))) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.init_default_categories() IS 'Idempotent category seeder for authenticated users with search_path pinned to empty string.';

REVOKE EXECUTE ON FUNCTION public.init_default_categories() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.init_default_categories() FROM anon;
GRANT EXECUTE ON FUNCTION public.init_default_categories() TO authenticated;

-- ------------------------------------------------------------------------------
-- 6. ACCOUNT BALANCES DATABASE VIEW
-- ------------------------------------------------------------------------------
-- Security Invoker View: Evaluates RLS policies using the credentials of the invoking user.
-- Formula: opening_balance + income - expenses - outgoing_transfers + incoming_transfers
-- Monetary arithmetic is computed in PostgreSQL NUMERIC and returned as TEXT to prevent
-- JavaScript double-precision floating point loss during PostgREST JSON serialization.
CREATE OR REPLACE VIEW public.account_balances
WITH (security_invoker = true)
AS
WITH tx_summary AS (
    SELECT
        account_id,
        user_id,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::NUMERIC AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::NUMERIC AS total_expense
    FROM public.transactions
    GROUP BY account_id, user_id
),
outgoing_summary AS (
    SELECT
        from_account_id AS account_id,
        user_id,
        COALESCE(SUM(amount), 0)::NUMERIC AS total_outgoing
    FROM public.transfers
    GROUP BY from_account_id, user_id
),
incoming_summary AS (
    SELECT
        to_account_id AS account_id,
        user_id,
        COALESCE(SUM(amount), 0)::NUMERIC AS total_incoming
    FROM public.transfers
    GROUP BY to_account_id, user_id
)
SELECT
    a.id AS account_id,
    a.user_id,
    a.name AS account_name,
    a.account_type,
    a.currency,
    a.is_active,
    a.opening_balance,
    (
        a.opening_balance::NUMERIC
        + COALESCE(t.total_income, 0)
        - COALESCE(t.total_expense, 0)
        - COALESCE(outg.total_outgoing, 0)
        + COALESCE(inc.total_incoming, 0)
    )::TEXT AS current_balance,
    COALESCE(t.total_income, 0)::TEXT AS total_income,
    COALESCE(t.total_expense, 0)::TEXT AS total_expense,
    COALESCE(outg.total_outgoing, 0)::TEXT AS total_outgoing_transfers,
    COALESCE(inc.total_incoming, 0)::TEXT AS total_incoming_transfers,
    a.created_at,
    a.updated_at
FROM public.accounts a
LEFT JOIN tx_summary t ON t.account_id = a.id AND t.user_id = a.user_id
LEFT JOIN outgoing_summary outg ON outg.account_id = a.id AND outg.user_id = a.user_id
LEFT JOIN incoming_summary inc ON inc.account_id = a.id AND inc.user_id = a.user_id;

COMMENT ON VIEW public.account_balances IS 'Calculated live account balances. Aggregate monetary totals returned as TEXT to prevent JavaScript precision loss.';
