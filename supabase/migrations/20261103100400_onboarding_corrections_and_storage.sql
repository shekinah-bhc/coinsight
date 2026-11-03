-- ==============================================================================
-- Coinsight — Production Database Architecture
-- Migration 5: Onboarding Corrections, Storage Bucket & Atomic RPC
-- File: supabase/migrations/20261103100400_onboarding_corrections_and_storage.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CONFIGURE AVATARS STORAGE BUCKET (PRIVATE BUCKET)
-- ------------------------------------------------------------------------------
-- Ensure avatars bucket exists and is private with 3MB file size limit and allowed image types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    FALSE,
    3145728, -- 3MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 3145728,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ------------------------------------------------------------------------------
-- 2. STORAGE ROW LEVEL SECURITY POLICIES FOR AVATARS
-- ------------------------------------------------------------------------------
-- Authenticated users can upload only into their own folder: {user_id}/{filename}
DROP POLICY IF EXISTS "avatars_storage_insert_own" ON storage.objects;
CREATE POLICY "avatars_storage_insert_own"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

-- Authenticated users can update only their own avatar files
DROP POLICY IF EXISTS "avatars_storage_update_own" ON storage.objects;
CREATE POLICY "avatars_storage_update_own"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    )
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

-- Authenticated users can delete only their own avatar files
DROP POLICY IF EXISTS "avatars_storage_delete_own" ON storage.objects;
CREATE POLICY "avatars_storage_delete_own"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

-- Authenticated users can read their own avatar files (enables signed URL creation and verification)
DROP POLICY IF EXISTS "avatars_storage_select_own" ON storage.objects;
CREATE POLICY "avatars_storage_select_own"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

-- ------------------------------------------------------------------------------
-- 3. ATOMIC ONBOARDING COMPLETION RPC FUNCTION
-- ------------------------------------------------------------------------------
-- Atomically synchronizes user financial goals and marks onboarding completed.
-- Operates exclusively for the authenticated user (auth.uid()).
-- Supports empty goal selections (allows 0 goals).
CREATE OR REPLACE FUNCTION public.complete_onboarding(p_goal_keys TEXT[] DEFAULT ARRAY[]::TEXT[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_uid UUID;
    valid_keys CONSTANT TEXT[] := ARRAY[
        'track_expenses',
        'build_savings',
        'control_spending',
        'manage_subscriptions',
        'understand_spending',
        'track_debt',
        'plan_budgets'
    ];
    goal_elem TEXT;
BEGIN
    -- 1. Verify caller authentication
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Coinsight Error: Unauthorized. Authentication required.';
    END IF;

    -- 2. Validate all provided goal keys (if any)
    IF p_goal_keys IS NOT NULL AND array_length(p_goal_keys, 1) > 0 THEN
        FOREACH goal_elem IN ARRAY p_goal_keys
        LOOP
            IF NOT (goal_elem = ANY(valid_keys)) THEN
                RAISE EXCEPTION 'Coinsight Error: Invalid financial goal key: %', goal_elem;
            END IF;
        END LOOP;
    END IF;

    -- 3. Delete deselected goals (or all goals if p_goal_keys is empty/null)
    IF p_goal_keys IS NULL OR array_length(p_goal_keys, 1) IS NULL THEN
        DELETE FROM public.user_financial_goals
        WHERE user_id = current_uid;
    ELSE
        DELETE FROM public.user_financial_goals
        WHERE user_id = current_uid
          AND NOT (goal_key = ANY(p_goal_keys));
    END IF;

    -- 4. Insert newly selected goals without duplicating existing rows
    IF p_goal_keys IS NOT NULL AND array_length(p_goal_keys, 1) > 0 THEN
        INSERT INTO public.user_financial_goals (user_id, goal_key)
        SELECT current_uid, unnest(p_goal_keys)
        ON CONFLICT (user_id, goal_key) DO NOTHING;
    END IF;

    -- 5. Mark profile completed only after goal sync succeeds
    UPDATE public.profiles
    SET onboarding_completed = TRUE,
        onboarding_completed_at = now(),
        onboarding_step = 3
    WHERE id = current_uid;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Coinsight Error: Profile not found for user %', current_uid;
    END IF;
END;
$$;

COMMENT ON FUNCTION public.complete_onboarding(TEXT[]) IS 
'Atomically synchronizes user financial goals and marks profile onboarding as complete. Safe for 0 or multiple goals.';

-- Restrict execution to authenticated users
REVOKE EXECUTE ON FUNCTION public.complete_onboarding(TEXT[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_onboarding(TEXT[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(TEXT[]) TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';


