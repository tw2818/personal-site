-- Migration: Fix comments INSERT policy (USING → WITH CHECK)
-- 
-- ROOT CAUSE:
-- The INSERT policy was using: USING (auth.jwt() ->> 'sub') = user_id::text
-- This USING clause checks the OLD row state BEFORE the BEFORE INSERT trigger fires.
-- Since the OLD row has user_id=NULL, the check (NULL = 'xxx') fails → 403 Forbidden.
--
-- FIX:
-- Change INSERT policy to use WITH CHECK (not USING).
-- WITH CHECK validates the NEW row state AFTER the BEFORE INSERT trigger runs,
-- so user_id is already set to auth.jwt() ->> 'sub' and the policy passes.
--
-- The trigger also casts sub to UUID: NEW.user_id = (auth.jwt() ->> 'sub')::uuid
-- This ensures type consistency between the JWT sub and the user_id column.

-- Drop and recreate trigger function
DROP TRIGGER IF EXISTS set_comment_user_id ON comments;
DROP FUNCTION IF EXISTS set_comment_user_id();

CREATE OR REPLACE FUNCTION set_comment_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Cast sub to UUID (Supabase Auth JWT sub is always a UUID)
  NEW.user_id = (auth.jwt() ->> 'sub')::uuid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (BEFORE INSERT, for each row)
CREATE TRIGGER set_comment_user_id
  BEFORE INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION set_comment_user_id();

-- Drop old INSERT policy (which used USING)
DROP POLICY IF EXISTS authenticated_insert_comments ON comments;

-- Create INSERT policy with WITH CHECK (validates NEW row after trigger)
-- The trigger sets user_id, so we just verify the JWT has a valid sub claim
CREATE POLICY authenticated_insert_comments ON comments
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'sub') IS NOT NULL
    AND (auth.jwt() ->> 'sub')::text = user_id::text
  );

-- Recreate UPDATE policy (admin or blog author can pin/unpin)
DROP POLICY IF EXISTS admin_update_comments ON comments;
CREATE POLICY admin_update_comments ON comments
  FOR UPDATE TO authenticated
  USING (
    (auth.jwt() ->> 'raw_user_meta_data' ->> 'user_name') = 'tw2818'
    OR auth.uid() IN (SELECT user_id FROM blogs WHERE blogs.id = comments.blog_id)
  )
  WITH CHECK (true);

-- Recreate DELETE policies
DROP POLICY IF EXISTS admin_delete_comments ON comments;
DROP POLICY IF EXISTS owner_delete_comments ON comments;

CREATE POLICY admin_delete_comments ON comments
  FOR DELETE TO authenticated 
  USING ((auth.jwt() ->> 'raw_user_meta_data' ->> 'user_name') = 'tw2818');

CREATE POLICY owner_delete_comments ON comments
  FOR DELETE TO authenticated 
  USING (auth.uid() IN (SELECT user_id FROM blogs WHERE blogs.id = comments.blog_id));
