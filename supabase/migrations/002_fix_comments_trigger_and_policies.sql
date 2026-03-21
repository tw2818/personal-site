-- Migration: Fix comments INSERT - remove broken SECURITY DEFINER trigger
-- ROOT CAUSE of previous approach:
-- The trigger used SECURITY DEFINER, but auth.uid() returns NULL when called
-- inside a SECURITY DEFINER function (JWT context not properly propagated).
-- Result: trigger sets user_id=NULL, policy checks auth.uid()=NULL → FAIL.
--
-- NEW APPROACH:
-- 1. Frontend extracts user_id from JWT sub claim and sends it explicitly
-- 2. Trigger removed (not needed - frontend provides user_id)
-- 3. Policy checks: user is authenticated AND user_id matches their JWT sub
--    (this prevents users from impersonating others)

-- Remove the broken trigger and function
DROP TRIGGER IF EXISTS set_comment_user_id ON comments;
DROP FUNCTION IF EXISTS set_comment_user_id();

-- INSERT policy: allows authenticated users to insert comments
-- Frontend sends user_id (from JWT sub), policy verifies it matches auth.uid()
DROP POLICY IF EXISTS authenticated_insert_comments ON comments;
CREATE POLICY authenticated_insert_comments ON comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- UPDATE policy: admin (tw2818) or blog author can pin/unpin
-- Keep using auth.jwt()::jsonb for admin check (GitHub user_name)
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
