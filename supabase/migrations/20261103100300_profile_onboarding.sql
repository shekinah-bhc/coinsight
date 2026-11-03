-- ==============================================================================
-- Coinsight — Production Database Architecture
-- Migration 4: Profile Onboarding Extension & User Financial Goals
-- File: supabase/migrations/20261103100300_profile_onboarding.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTEND PROFILES TABLE WITH ONBOARDING FIELDS
-- ------------------------------------------------------------------------------
-- Add country code (ISO 3166-1 alpha-2, default 'IN')
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'IN';

-- Add monthly income range classification
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS monthly_income_range TEXT;

-- Add salary credit day (day of month 1-31)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS salary_credit_day SMALLINT;

-- Add onboarding completion flags
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add onboarding step tracker (1: Personal Info, 2: Financial Preferences, 3: Financial Goals)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS onboarding_step SMALLINT NOT NULL DEFAULT 1;

-- Add constraints for data integrity
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_country_code'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT chk_profiles_country_code
            CHECK (country_code IS NULL OR length(country_code) = 2);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_monthly_income_range'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT chk_profiles_monthly_income_range
            CHECK (monthly_income_range IS NULL OR monthly_income_range IN (
                'below_20k',
                '20k_40k',
                '40k_60k',
                '60k_100k',
                'above_100k',
                'prefer_not_to_say'
            ));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_salary_credit_day'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT chk_profiles_salary_credit_day
            CHECK (salary_credit_day IS NULL OR (salary_credit_day >= 1 AND salary_credit_day <= 31));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_onboarding_step'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT chk_profiles_onboarding_step
            CHECK (onboarding_step BETWEEN 1 AND 3);
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. CREATE USER FINANCIAL GOALS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_financial_goals_user_goal UNIQUE (user_id, goal_key),
    CONSTRAINT chk_user_financial_goals_goal_key CHECK (goal_key IN (
        'track_expenses',
        'build_savings',
        'control_spending',
        'manage_subscriptions',
        'understand_spending',
        'track_debt',
        'plan_budgets'
    ))
);

-- Index user_id for fast retrieval
CREATE INDEX IF NOT EXISTS idx_user_financial_goals_user_id
    ON public.user_financial_goals (user_id);

-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY & PRIVILEGES FOR USER FINANCIAL GOALS
-- ------------------------------------------------------------------------------
ALTER TABLE public.user_financial_goals ENABLE ROW LEVEL SECURITY;

-- Revoke anon access
REVOKE ALL ON TABLE public.user_financial_goals FROM anon;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_financial_goals TO authenticated;

-- RLS policies
DROP POLICY IF EXISTS "user_financial_goals_select_own" ON public.user_financial_goals;
CREATE POLICY "user_financial_goals_select_own"
    ON public.user_financial_goals
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user_financial_goals_insert_own" ON public.user_financial_goals;
CREATE POLICY "user_financial_goals_insert_own"
    ON public.user_financial_goals
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user_financial_goals_delete_own" ON public.user_financial_goals;
CREATE POLICY "user_financial_goals_delete_own"
    ON public.user_financial_goals
    FOR DELETE
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';


