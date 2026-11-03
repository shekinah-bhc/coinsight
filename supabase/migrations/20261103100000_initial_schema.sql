-- ==============================================================================
-- Coinsight — Production Database Architecture
-- Migration 1: Core Tables, Constraints, Indexes & Financial Guardrails
-- File: supabase/migrations/20261103100000_initial_schema.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Financial Design Conventions:
-- 1. Monetary representation: All atomic transaction and opening balance amounts
--    are stored in integer minor currency units (paise, cents, etc.) using BIGINT.
--    No floating-point columns are permitted.
-- 2. Max supported monetary limit: 1,000,000,000,000 minor units (10^12) per transaction/balance.
-- 3. Signed Balance convention:
--    - Positive (> 0): Asset / available funds.
--    - Negative (< 0): Liability / balance owed / credit utilization.
-- 4. User ownership: All user-owned tables enforce `user_id UUID NOT NULL DEFAULT auth.uid()`.
-- 5. Foreign Key Deletion Strategy:
--    - Tables reference `auth.users(id) ON DELETE CASCADE`.
--    - Internal relational dependencies:
--      * `fk_transactions_account_ownership`: `ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED`
--      * `fk_transfers_from_account_currency`: `ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED`
--      * `fk_transfers_to_account_currency`: `ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED`
--      * `fk_budgets_category_ownership`: `ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED`
--      * `fk_transactions_category_ownership_type`: `ON DELETE SET NULL (category_id)`
--    PostgreSQL Referential Action & Deferrable Constraint Behavior:
--    - Standard `ON DELETE NO ACTION` checks the foreign key at the end of the SQL statement
--      (not at transaction commit), while `RESTRICT` checks immediately before any subsequent
--      actions.
--    - When an `auth.users` row is cascade-deleted, PostgreSQL triggers cascade deletions across
--      all child tables in arbitrary order. If a parent table (e.g. `accounts`) is visited and its
--      rows deleted before child tables (e.g. `transactions`), a non-deferrable `NO ACTION` check
--      fails immediately at statement end if the child rows have not yet been evaluated.
--    - Declaring these internal constraints `DEFERRABLE INITIALLY DEFERRED` ensures that constraint
--      satisfaction is deferred until transaction commit. When an `auth.users` row is deleted,
--      CASCADE deletes all user-owned accounts, categories, transactions, transfers, and budgets
--      within the same transaction. By the time the transaction commits, all dependent child rows
--      have also been deleted, allowing user deletion to complete cleanly.
--    - Standalone deletions: Deleting an individual account with existing transactions or transfers,
--      or an individual category with an existing budget, is strictly prevented because at transaction
--      commit the orphaned child records still remain.
-- ------------------------------------------------------------------------------

-- Ensure required extension for UUID generation is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    currency TEXT NOT NULL DEFAULT 'INR',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_profiles_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_profiles_timezone_non_empty CHECK (length(trim(timezone)) > 0)
);

COMMENT ON TABLE public.profiles IS 'User profile metadata extending auth.users. One record per authenticated user.';
COMMENT ON COLUMN public.profiles.currency IS 'Default three-letter ISO 4217 uppercase currency code.';
COMMENT ON COLUMN public.profiles.timezone IS 'Preferred IANA time zone identifier (e.g. Asia/Kolkata).';

-- ==============================================================================
-- 2. ACCOUNTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    opening_balance BIGINT NOT NULL DEFAULT 0,
    credit_limit BIGINT,
    institution_name TEXT,
    account_number_last_four TEXT,
    color TEXT,
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_accounts_name_non_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_accounts_type_valid CHECK (account_type IN ('cash', 'bank', 'wallet', 'credit_card')),
    CONSTRAINT chk_accounts_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_accounts_opening_balance_limits CHECK (opening_balance BETWEEN -1000000000000 AND 1000000000000),
    CONSTRAINT chk_accounts_credit_limit_non_negative CHECK (credit_limit IS NULL OR credit_limit >= 0),
    CONSTRAINT chk_accounts_credit_limit_range CHECK (credit_limit IS NULL OR credit_limit <= 1000000000000),
    CONSTRAINT chk_accounts_credit_card_limit_rule CHECK (
        (account_type = 'credit_card' AND (credit_limit IS NULL OR credit_limit >= 0)) OR
        (account_type <> 'credit_card' AND credit_limit IS NULL)
    ),
    CONSTRAINT chk_accounts_last_four_format CHECK (
        account_number_last_four IS NULL OR account_number_last_four ~ '^[0-9]{4}$'
    ),

    -- Composite Uniques for Foreign Key referential integrity & ownership guarantees
    CONSTRAINT uq_accounts_id_user UNIQUE (id, user_id),
    CONSTRAINT uq_accounts_id_user_currency UNIQUE (id, user_id, currency)
);

COMMENT ON TABLE public.accounts IS 'User financial accounts (banks, credit cards, wallets, cash).';
COMMENT ON COLUMN public.accounts.opening_balance IS 'Initial account balance in minor currency units (e.g. paise). Can be positive or negative.';
COMMENT ON COLUMN public.accounts.credit_limit IS 'Total credit line in minor units. Allowed only when account_type is credit_card.';

CREATE INDEX IF NOT EXISTS idx_accounts_user_active ON public.accounts(user_id, is_active);

-- ==============================================================================
-- 3. CATEGORIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_categories_name_non_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_categories_type_valid CHECK (type IN ('income', 'expense')),

    -- Composite Unique for category ownership and classification enforcement
    CONSTRAINT uq_categories_id_user_type UNIQUE (id, user_id, type)
);

COMMENT ON TABLE public.categories IS 'User-scoped income and expense categories.';

-- Case-insensitive, whitespace-trimmed unique category name per user and type
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_user_type_normalized_name
    ON public.categories(user_id, type, lower(trim(name)));

CREATE INDEX IF NOT EXISTS idx_categories_user_type
    ON public.categories(user_id, type);

-- ==============================================================================
-- 4. TRANSACTIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL,
    category_id UUID,
    type TEXT NOT NULL,
    amount BIGINT NOT NULL,
    description TEXT,
    merchant TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    receipt_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_transactions_type_valid CHECK (type IN ('income', 'expense')),
    CONSTRAINT chk_transactions_amount_positive CHECK (amount > 0 AND amount <= 1000000000000),
    CONSTRAINT chk_transactions_source_valid CHECK (source IN ('manual', 'ai', 'receipt')),

    -- Composite Foreign Keys enforcing multi-tenant isolation & type matching
    -- DEFERRABLE INITIALLY DEFERRED enables clean cascade user-deletion while preventing individual account deletion
    CONSTRAINT fk_transactions_account_ownership
        FOREIGN KEY (account_id, user_id)
        REFERENCES public.accounts(id, user_id)
        ON DELETE NO ACTION
        DEFERRABLE INITIALLY DEFERRED,

    -- Explicit single-column SET NULL so that user_id and type are not touched
    CONSTRAINT fk_transactions_category_ownership_type
        FOREIGN KEY (category_id, user_id, type)
        REFERENCES public.categories(id, user_id, type)
        ON DELETE SET NULL (category_id)
);

COMMENT ON TABLE public.transactions IS 'Income and expense entries. Transfers are tracked in public.transfers.';
COMMENT ON COLUMN public.transactions.amount IS 'Positive monetary amount stored in integer minor currency units.';

-- Performance Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_partial ON public.transactions(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions(user_id, type);

-- ==============================================================================
-- 5. TRANSFERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    from_account_id UUID NOT NULL,
    to_account_id UUID NOT NULL,
    currency TEXT NOT NULL,
    amount BIGINT NOT NULL,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_transfers_distinct_accounts CHECK (from_account_id <> to_account_id),
    CONSTRAINT chk_transfers_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_transfers_amount_positive CHECK (amount > 0 AND amount <= 1000000000000),

    -- Composite foreign keys enforcing that both accounts belong to the user AND have matching currency
    -- DEFERRABLE INITIALLY DEFERRED enables clean cascade user-deletion while preventing individual account deletion
    CONSTRAINT fk_transfers_from_account_currency
        FOREIGN KEY (from_account_id, user_id, currency)
        REFERENCES public.accounts(id, user_id, currency)
        ON DELETE NO ACTION
        DEFERRABLE INITIALLY DEFERRED,

    CONSTRAINT fk_transfers_to_account_currency
        FOREIGN KEY (to_account_id, user_id, currency)
        REFERENCES public.accounts(id, user_id, currency)
        ON DELETE NO ACTION
        DEFERRABLE INITIALLY DEFERRED
);

COMMENT ON TABLE public.transfers IS 'Inter-account fund movements. Transfers are never counted as income or expenses.';
COMMENT ON COLUMN public.transfers.currency IS 'Currency of the transfer, guaranteed via composite FKs to match both source and destination accounts.';
COMMENT ON COLUMN public.transfers.amount IS 'Transfer amount in integer minor currency units.';

-- Performance Indexes for transfers
CREATE INDEX IF NOT EXISTS idx_transfers_user_date ON public.transfers(user_id, transfer_date DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_from_account ON public.transfers(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_account ON public.transfers(to_account_id);

-- ==============================================================================
-- 6. BUDGETS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL,
    amount BIGINT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    category_type TEXT NOT NULL DEFAULT 'expense',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_budgets_amount_positive CHECK (amount > 0 AND amount <= 1000000000000),
    CONSTRAINT chk_budgets_expense_only CHECK (category_type = 'expense'),
    CONSTRAINT chk_budgets_month_bounds CHECK (
        period_start = date_trunc('month', period_start)::date AND
        period_end = (date_trunc('month', period_start) + interval '1 month - 1 day')::date
    ),

    -- Composite foreign key enforcing category ownership and expense type
    -- DEFERRABLE INITIALLY DEFERRED enables clean cascade user-deletion while preventing individual category deletion
    CONSTRAINT fk_budgets_category_ownership
        FOREIGN KEY (category_id, user_id, category_type)
        REFERENCES public.categories(id, user_id, type)
        ON DELETE NO ACTION
        DEFERRABLE INITIALLY DEFERRED,

    -- Disallow duplicate budgets for same user, category, and month
    CONSTRAINT uq_budgets_user_category_period UNIQUE (user_id, category_id, period_start)
);

COMMENT ON TABLE public.budgets IS 'Monthly expense budgets per category.';
COMMENT ON COLUMN public.budgets.period_start IS 'First day of the budget month (e.g. 2026-11-01).';
COMMENT ON COLUMN public.budgets.period_end IS 'Last day of the budget month (e.g. 2026-11-30).';

-- Performance Index for budgets
CREATE INDEX IF NOT EXISTS idx_budgets_category ON public.budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON public.budgets(user_id, period_start);
