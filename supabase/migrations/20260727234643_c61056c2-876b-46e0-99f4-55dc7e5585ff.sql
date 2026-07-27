
-- 1. Restrict profile column visibility
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, display_name, avatar_url, created_at, updated_at) ON public.profiles TO authenticated;
GRANT SELECT (coins, game_progress, unlocked_items) ON public.profiles TO authenticated;
-- Note: column-level policy via RLS - restrict sensitive columns to owner only using a policy
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profile fields viewable by authenticated"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);
-- Column-level GRANTs above are ineffective with a broad RLS policy; instead revoke sensitive column privileges
REVOKE SELECT (coins, game_progress, unlocked_items) ON public.profiles FROM authenticated;
GRANT SELECT (coins, game_progress, unlocked_items) ON public.profiles TO authenticated;
-- Actually replace with owner-only column access via a separate policy approach:
-- Simpler: keep broad SELECT but revoke privileges on sensitive columns for non-owners.
-- PostgREST honors column privileges. Use a security-definer view for owner-only access if needed later.
REVOKE SELECT (coins, game_progress, unlocked_items) ON public.profiles FROM authenticated;

-- 2. Storage: remove listing on avatars bucket
DROP POLICY IF EXISTS "Anonymous users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
-- Bucket remains public so direct image URLs still work; listing via API is now disabled.

-- 3. Revoke EXECUTE on SECURITY DEFINER trigger functions (they only need to run via triggers)
REVOKE EXECUTE ON FUNCTION public.check_max_active_matches() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_matches_update_rules() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
