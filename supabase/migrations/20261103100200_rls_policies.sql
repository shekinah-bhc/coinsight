-- ==============================================================================
-- Coinsight — Production Database Architecture
-- Migration 3: Row Level Security (RLS) Policies & Explicit Permissions
-- File: supabase/migrations/20261103100200_rls_policies.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY ON ALL SIX CORE TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. REVOKE UNNECESSARY PRIVILEGES & GRANT LEAST-PRIVILEGE ACCESS
-- ------------------------------------------------------------------------------
-- Revoke all permissions from anon on core financial tables
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.accounts FROM anon;
REVOKE ALL ON TABLE public.categories FROM anon;
REVOKE ALL ON TABLE public.transactions FROM anon;
REVOKE ALL ON TABLE public.transfers FROM anon;
REVOKE ALL ON TABLE public.budgets FROM anon;
REVOKE ALL ON TABLE public.account_balances FROM anon;

-- Grant required permissions to authenticated users
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transfers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.budgets TO authenticated;
GRANT SELECT ON TABLE public.account_balances TO authenticated;

-- ------------------------------------------------------------------------------
-- 3. PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Users can only view their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = (SELECT auth.uid()));

-- Users can only update their own profile, and cannot alter id
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = (SELECT auth.uid()))
    WITH CHECK (id = (SELECT auth.uid()));

-- No direct client insert or delete allowed on profiles (handled via auth.users triggers/cascades)

-- ------------------------------------------------------------------------------
-- 4. ACCOUNTS POLICIES
-- ------------------------------------------------------------------------------
-- Users can only view their own accounts
DROP POLICY IF EXISTS "accounts_select_own" ON public.accounts;
CREATE POLICY "accounts_select_own"
    ON public.accounts
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Users can only insert accounts owned by themselves
DROP POLICY IF EXISTS "accounts_insert_own" ON public.accounts;
CREATE POLICY "accounts_insert_own"
    ON public.accounts
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can only update their own accounts and cannot change ownership
DROP POLICY IF EXISTS "accounts_update_own" ON public.accounts;
CREATE POLICY "accounts_update_own"
    ON public.accounts
    FOR UPDATE
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Restrict delete: Accounts with existing transactions or transfers cannot be deleted
-- (Foreign keys fk_transactions_account_ownership and fk_transfers_* ON DELETE NO ACTION enforce this)
DROP POLICY IF EXISTS "accounts_delete_own" ON public.accounts;
CREATE POLICY "accounts_delete_own"
    ON public.accounts
    FOR DELETE
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- ------------------------------------------------------------------------------
-- 5. CATEGORIES POLICIES
-- ------------------------------------------------------------------------------
-- Users can only view their own categories
DROP POLICY IF EXISTS "categories_select_own" ON public.categories;
CREATE POLICY "categories_select_own"
    ON public.categories
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Users can only insert categories owned by themselves
DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
CREATE POLICY "categories_insert_own"
    ON public.categories
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can only update their own categories and cannot transfer ownership
DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
CREATE POLICY "categories_update_own"
    ON public.categories
    FOR UPDATE
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can delete their own categories (budget dependencies guarded by ON DELETE NO ACTION)
DROP POLICY IF EXISTS "categories_delete_own" ON public.categories;
CREATE POLICY "categories_delete_own"
    ON public.categories
    FOR DELETE
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- ------------------------------------------------------------------------------
-- 6. TRANSACTIONS POLICIES
-- ------------------------------------------------------------------------------
-- Users can only view their own transactions
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Users can only insert transactions for themselves
DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
CREATE POLICY "transactions_insert_own"
    ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can only update their own transactions and cannot transfer ownership
DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
CREATE POLICY "transactions_update_own"
    ON public.transactions
    FOR UPDATE
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can delete their own transactions
DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;
CREATE POLICY "transactions_delete_own"
    ON public.transactions
    FOR DELETE
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- ------------------------------------------------------------------------------
-- 7. TRANSFERS POLICIES
-- ------------------------------------------------------------------------------
-- Users can only view their own transfers
DROP POLICY IF EXISTS "transfers_select_own" ON public.transfers;
CREATE POLICY "transfers_select_own"
    ON public.transfers
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Users can only insert transfers for themselves
DROP POLICY IF EXISTS "transfers_insert_own" ON public.transfers;
CREATE POLICY "transfers_insert_own"
    ON public.transfers
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can only update their own transfers and cannot transfer ownership
DROP POLICY IF EXISTS "transfers_update_own" ON public.transfers;
CREATE POLICY "transfers_update_own"
    ON public.transfers
    FOR UPDATE
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can delete their own transfers
DROP POLICY IF EXISTS "transfers_delete_own" ON public.transfers;
CREATE POLICY "transfers_delete_own"
    ON public.transfers
    FOR DELETE
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- ------------------------------------------------------------------------------
-- 8. BUDGETS POLICIES
-- ------------------------------------------------------------------------------
-- Users can only view their own budgets
DROP POLICY IF EXISTS "budgets_select_own" ON public.budgets;
CREATE POLICY "budgets_select_own"
    ON public.budgets
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Users can only insert budgets for themselves
DROP POLICY IF EXISTS "budgets_insert_own" ON public.budgets;
CREATE POLICY "budgets_insert_own"
    ON public.budgets
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can only update their own budgets and cannot transfer ownership
DROP POLICY IF EXISTS "budgets_update_own" ON public.budgets;
CREATE POLICY "budgets_update_own"
    ON public.budgets
    FOR UPDATE
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can delete their own budgets
DROP POLICY IF EXISTS "budgets_delete_own" ON public.budgets;
CREATE POLICY "budgets_delete_own"
    ON public.budgets
    FOR DELETE
    TO authenticated
    USING (user_id = (SELECT auth.uid()));
