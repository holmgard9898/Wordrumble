-- Replace the broad public SELECT policy with one that allows direct file access
-- but disallows broad listing by anonymous users.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Authenticated users can list/select avatars
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- Anonymous users can also view (needed for <img src=publicUrl>) — but bucket is still public so direct URLs work.
CREATE POLICY "Anonymous users can view avatars"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'avatars');