-- RPC function for Admin page Users tab
-- Returns all profiles ordered by creation date ( SECURITY DEFINER bypasses RLS )
CREATE OR REPLACE FUNCTION get_users_admin()
RETURNS TABLE(
  id uuid,
  email text,
  nickname text,
  github text,
  avatar_url text,
  bio text,
  bilibili text,
  twitter text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.nickname, p.github, p.avatar_url, p.bio, p.bilibili, p.twitter, p.created_at, p.updated_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$;
