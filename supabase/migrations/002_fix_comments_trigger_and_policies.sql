-- Migration: Fix comments INSERT policy (USING → WITH CHECK)
-- ROOT CAUSE:
-- The INSERT policy was using: USING (auth.jwt() ->> 'sub') = user_id::text
-- USING clause checks OLD row state BEFORE the BEFORE INSERT trigger fires.
-- Since OLD row has user_id=NULL, (NULL = 'xxx') always false → 403 Forbidden.
-- FIX: Change INSERT policy to use WITH CHECK (validates NEW row after trigger).
--
-- Also fix: auth.jwt() returns text (not jsonb), so use ::jsonb cast before ->>
-- Fix: ->> cannot be chained directly; use -> (returns jsonb) then ->> (returns text)

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS set_comment_user_id ON comments;
DROP FUNCTION IF EXISTS set_comment_user_id();

CREATE OR REPLACE FUNCTION set_comment_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_comment_user_id
  BEFORE INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION set_comment_user_id();

-- INSERT policy: WITH CHECK validates NEW row (after trigger sets user_id)
DROP POLICY IF EXISTS authenticated_insert_comments ON comments;
CREATE POLICY authenticated_insert_comments ON comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

-- UPDATE policy: admin (tw2818) or blog author can pin/unpin
DROP POLICY IF EXISTS admin_update_comments ON comments;
CREATE POLICY admin_update_comments ON comments
  FOR UPDATE TO authenticated
  USING (
    (auth.jwt()::jsonb -> 'raw_user_meta_data' ->> 'user_name') = 'tw2818'
    OR auth.uid() = user_id
    OR auth.uid() IN (SELECT user_id FROM blogs WHERE blogs.id = comments.blog_id)
  )
  WITH CHECK (true);

-- DELETE policy
DROP POLICY IF EXISTS admin_delete_comments ON comments;
DROP POLICY IF EXISTS owner_delete_comments ON comments;

CREATE POLICY admin_delete_comments ON comments
  FOR DELETE TO authenticated
  USING ((auth.jwt()::jsonb -> 'raw_user_meta_data' ->> 'user_name') = 'tw2818');

CREATE POLICY owner_delete_comments ON comments
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT user_id FROM blogs WHERE blogs.id = comments.blog_id)
  );
