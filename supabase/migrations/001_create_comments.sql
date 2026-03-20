-- Migration: Create comments table for blog posts
-- Run this in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
  user_id UUID,
  nickname TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Public read (anyone can view comments)
CREATE POLICY "public_read_comments" ON comments FOR SELECT TO anon USING (true);

-- Authenticated users can insert comments
CREATE POLICY "authenticated_insert_comments" ON comments FOR INSERT TO authenticated WITH CHECK (true);

-- Admin (github=tw2818) can delete any comment
CREATE POLICY "admin_delete_comments" ON comments FOR DELETE TO authenticated 
  USING (auth.jwt() ->> 'raw_user_meta_data' ->> 'user_name' = 'tw2818');

-- Blog author can delete comments on their own blogs
CREATE POLICY "owner_delete_comments" ON comments FOR DELETE TO authenticated 
  USING (auth.uid() IN (SELECT user_id FROM blogs WHERE blogs.id = comments.blog_id));

-- Admin and author can update (pin/unpin) comments
CREATE POLICY "admin_update_comments" ON comments FOR UPDATE TO authenticated 
  USING (auth.jwt() ->> 'raw_user_meta_data' ->> 'user_name' = 'tw2818' 
         OR auth.uid() IN (SELECT user_id FROM blogs WHERE blogs.id = comments.blog_id))
  WITH CHECK (true);

-- Enable realtime for comments (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
