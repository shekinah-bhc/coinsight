-- ==============================================================================
-- Coinsight — Production Database Architecture
-- Migration 6: Accounts Management, Concurrency Safeguards & Net Worth
-- File: supabase/migrations/20261103100500_accounts_management.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ADD INSTITUTION AND NOTES COLUMNS TO ACCOUNTS TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.accounts
    ADD COLUMN IF NOT EXISTS institution TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- Synchronize institution with institution_name if legacy rows exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'accounts' AND column_name = 'institution_name'
    ) THEN
        UPDATE public.accounts
        SET institution = institution_name
        WHERE institution IS NULL AND institution_name IS NOT NULL;
    END IF;
END $$;

COMMENT ON COLUMN public.accounts.institution IS 'Financial institution or bank name (e.g. HDFC Bank, SBI, Zerodha).';
COMMENT ON COLUMN public.accounts.notes IS 'Optional user notes regarding this account.';

-- ------------------------------------------------------------------------------
-- 2. PARTIAL UNIQUE INDEX FOR ACTIVE ACCOUNT NAMES
-- ------------------------------------------------------------------------------
-- Ensures active account names are unique per user, case-insensitively and after trimming whitespace.
-- Archived accounts are excluded from the uniqueness constraint.
CREATE UNIQUE INDEX IF NOT EXISTS accounts_unique_active_name
    ON public.accounts (user_id, lower(btrim(name)))
    WHERE is_active;

-- ------------------------------------------------------------------------------
-- 3. CONCURRENCY-SAFE IMMUTABILITY TRIGGER FOR ACCOUNTS WITH ACTIVITY
-- ------------------------------------------------------------------------------
-- Once an account has transactions or appears in transfers, its opening_balance,
-- currency, and account_type become completely immutable.
CREATE OR REPLACE FUNCTION public.prevent_account_immutable_field_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF (OLD.opening_balance IS DISTINCT FROM NEW.opening_balance) OR
       (OLD.currency IS DISTINCT FROM NEW.currency) OR
       (OLD.account_type IS DISTINCT FROM NEW.account_type) THEN

        -- Verify if financial transactions exist
        IF EXISTS (
            SELECT 1 FROM public.transactions
            WHERE account_id = OLD.id
            LIMIT 1
        ) THEN
            RAISE EXCEPTION 'Coinsight Error: Cannot modify opening balance, currency, or account type of account % because transactions exist.', OLD.id
                USING ERRCODE = '23514';
        END IF;

        -- Verify if transfer history exists (either source or destination)
        IF EXISTS (
            SELECT 1 FROM public.transfers
            WHERE from_account_id = OLD.id OR to_account_id = OLD.id
            LIMIT 1
        ) THEN
            RAISE EXCEPTION 'Coinsight Error: Cannot modify opening balance, currency, or account type of account % because transfer records exist.', OLD.id
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_account_immutable_field_mutation() IS
'Enforces immutability of opening_balance, currency, and account_type once any financial activity exists.';

-- Replace earlier currency-only trigger with full immutability check
DROP TRIGGER IF EXISTS trg_accounts_prevent_currency_change ON public.accounts;
DROP TRIGGER IF EXISTS trg_accounts_prevent_immutable_mutation ON public.accounts;

CREATE TRIGGER trg_accounts_prevent_immutable_mutation
    BEFORE UPDATE OF opening_balance, currency, account_type ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_account_immutable_field_mutation();

-- ------------------------------------------------------------------------------
-- 4. CONCURRENCY-SAFE ENFORCEMENT PREVENTING TRANSACTIONS ON ARCHIVED ACCOUNTS
-- ------------------------------------------------------------------------------
-- Acquires a FOR SHARE lock on the referenced account to eliminate race conditions
-- between simultaneous account archiving and transaction recording.
CREATE OR REPLACE FUNCTION public.enforce_transaction_account_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_is_active BOOLEAN;
BEGIN
    -- Concurrency safeguard: acquire FOR SHARE lock on the account
    SELECT is_active INTO v_is_active
    FROM public.accounts
    WHERE id = NEW.account_id
    FOR SHARE;

    IF v_is_active IS NULL THEN
        RAISE EXCEPTION 'Coinsight Error: Account % does not exist.', NEW.account_id
            USING ERRCODE = '23503';
    END IF;

    IF NOT v_is_active THEN
        RAISE EXCEPTION 'Coinsight Error: Cannot record transaction against archived account %.', NEW.account_id
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_transaction_account_active() IS
'Blocks transaction creation against archived accounts with concurrency-safe FOR SHARE locking.';

DROP TRIGGER IF EXISTS trg_transactions_enforce_account_active ON public.transactions;
CREATE TRIGGER trg_transactions_enforce_account_active
    BEFORE INSERT OR UPDATE OF account_id ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_transaction_account_active();

-- ------------------------------------------------------------------------------
-- 5. CONCURRENCY-SAFE ENFORCEMENT PREVENTING TRANSFERS ON ARCHIVED ACCOUNTS
-- ------------------------------------------------------------------------------
-- Acquires FOR SHARE locks on both from_account and to_account to prevent race conditions.
CREATE OR REPLACE FUNCTION public.enforce_transfer_accounts_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_from_active BOOLEAN;
    v_to_active BOOLEAN;
BEGIN
    -- Check and lock source account
    SELECT is_active INTO v_from_active
    FROM public.accounts
    WHERE id = NEW.from_account_id
    FOR SHARE;

    IF v_from_active IS NULL THEN
        RAISE EXCEPTION 'Coinsight Error: Source account % does not exist.', NEW.from_account_id
            USING ERRCODE = '23503';
    END IF;

    IF NOT v_from_active THEN
        RAISE EXCEPTION 'Coinsight Error: Cannot initiate transfer from archived account %.', NEW.from_account_id
            USING ERRCODE = '23514';
    END IF;

    -- Check and lock destination account
    SELECT is_active INTO v_to_active
    FROM public.accounts
    WHERE id = NEW.to_account_id
    FOR SHARE;

    IF v_to_active IS NULL THEN
        RAISE EXCEPTION 'Coinsight Error: Destination account % does not exist.', NEW.to_account_id
            USING ERRCODE = '23503';
    END IF;

    IF NOT v_to_active THEN
        RAISE EXCEPTION 'Coinsight Error: Cannot transfer to archived account %.', NEW.to_account_id
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_transfer_accounts_active() IS
'Blocks transfers involving archived source or destination accounts with concurrency-safe FOR SHARE locking.';

DROP TRIGGER IF EXISTS trg_transfers_enforce_accounts_active ON public.transfers;
CREATE TRIGGER trg_transfers_enforce_accounts_active
    BEFORE INSERT OR UPDATE OF from_account_id, to_account_id ON public.transfers
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_transfer_accounts_active();

-- ------------------------------------------------------------------------------
-- 6. EXTEND ACCOUNT BALANCES VIEW
-- ------------------------------------------------------------------------------
-- Drop views first to prevent PostgreSQL error 42P16 (cannot change name of view column)
DROP VIEW IF EXISTS public.net_worth_summary CASCADE;
DROP VIEW IF EXISTS public.account_balances CASCADE;

-- Recreate account_balances view with institution, notes, credit_limit, has_activity, and transaction_count
-- Formula: Opening balance + Income - Expenses + Incoming transfers - Outgoing transfers
CREATE VIEW public.account_balances
WITH (security_invoker = true)
AS
WITH tx_summary AS (
    SELECT
        account_id,
        user_id,
        COUNT(*)::BIGINT AS tx_count,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::NUMERIC AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::NUMERIC AS total_expense
    FROM public.transactions
    GROUP BY account_id, user_id
),
outgoing_summary AS (
    SELECT
        from_account_id AS account_id,
        user_id,
        COUNT(*)::BIGINT AS out_count,
        COALESCE(SUM(amount), 0)::NUMERIC AS total_outgoing
    FROM public.transfers
    GROUP BY from_account_id, user_id
),
incoming_summary AS (
    SELECT
        to_account_id AS account_id,
        user_id,
        COUNT(*)::BIGINT AS in_count,
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
        + COALESCE(inc.total_incoming, 0)
        - COALESCE(outg.total_outgoing, 0)
    )::TEXT AS current_balance,
    COALESCE(t.total_income, 0)::TEXT AS total_income,
    COALESCE(t.total_expense, 0)::TEXT AS total_expense,
    COALESCE(outg.total_outgoing, 0)::TEXT AS total_outgoing_transfers,
    COALESCE(inc.total_incoming, 0)::TEXT AS total_incoming_transfers,
    COALESCE(a.institution, a.institution_name) AS institution,
    a.notes,
    a.credit_limit,
    (
        COALESCE(t.tx_count, 0) +
        COALESCE(outg.out_count, 0) +
        COALESCE(inc.in_count, 0) > 0
    ) AS has_activity,
    COALESCE(t.tx_count, 0) AS transaction_count,
    a.created_at,
    a.updated_at
FROM public.accounts a
LEFT JOIN tx_summary t ON t.account_id = a.id AND t.user_id = a.user_id
LEFT JOIN outgoing_summary outg ON outg.account_id = a.id AND outg.user_id = a.user_id
LEFT JOIN incoming_summary inc ON inc.account_id = a.id AND inc.user_id = a.user_id;

COMMENT ON VIEW public.account_balances IS 
'Single source of truth for live account balances. Aggregate monetary totals returned as TEXT to prevent JavaScript precision loss.';

REVOKE ALL ON TABLE public.account_balances FROM anon;
GRANT SELECT ON TABLE public.account_balances TO authenticated;

-- ------------------------------------------------------------------------------
-- 7. NET WORTH SUMMARY VIEW
-- ------------------------------------------------------------------------------
-- Calculates Assets, Liabilities and Net Worth strictly in SQL using signed balance logic:
-- - Assets = sum of positive active balances
-- - Liabilities = absolute sum of negative active balances
-- - Net worth = Assets - Liabilities
-- - Archived accounts are excluded.
-- Operates via security_invoker to respect RLS under the authenticated user session.
CREATE VIEW public.net_worth_summary
WITH (security_invoker = true)
AS
SELECT
    p.id AS user_id,
    COALESCE(SUM(CASE WHEN ab.current_balance::NUMERIC > 0 THEN ab.current_balance::NUMERIC ELSE 0 END), 0)::TEXT AS total_assets,
    COALESCE(SUM(CASE WHEN ab.current_balance::NUMERIC < 0 THEN ABS(ab.current_balance::NUMERIC) ELSE 0 END), 0)::TEXT AS total_liabilities,
    COALESCE(SUM(ab.current_balance::NUMERIC), 0)::TEXT AS net_worth,
    COALESCE(COUNT(ab.account_id), 0)::INTEGER AS active_accounts_count
FROM public.profiles p
LEFT JOIN public.account_balances ab ON ab.user_id = p.id AND ab.is_active = TRUE
GROUP BY p.id;

COMMENT ON VIEW public.net_worth_summary IS
'User net worth summary strictly computed in SQL. Assets = sum(positive), Liabilities = abs(sum(negative)), Net Worth = Assets - Liabilities.';

-- Permissions
REVOKE ALL ON TABLE public.net_worth_summary FROM anon;
GRANT SELECT ON TABLE public.net_worth_summary TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

