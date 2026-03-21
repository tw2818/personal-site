-- Migration: Fix tags table RLS policies
-- The tags table was created via Supabase Dashboard without proper INSERT policy
-- for authenticated users. This migration ensures authenticated users can create tags.
--
-- Note: The existing tags INSERT already works when both apikey AND Authorization
-- headers are provided. This migration just explicitly creates the policy for clarity.

-- Ensure the tags table has an INSERT policy for authenticated users
-- If a policy already exists, this will fail silently (IF NOT EXISTS style not available for policies)
-- We use DO block to check and create if needed

DO $$
BEGIN
  -- Check if any INSERT policy exists for authenticated on tags
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tags' 
    AND policyname = 'authenticated_insert_tags'
    AND cmd = 'INSERT'
  ) THEN
    CREATE POLICY authenticated_insert_tags ON tags
    FOR INSERT TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- Also ensure SELECT policy for authenticated users to read all tags
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tags' 
    AND policyname = 'public_read_tags'
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY public_read_tags ON tags
    FOR SELECT TO anon
    USING (true);
  END IF;
END $$;
