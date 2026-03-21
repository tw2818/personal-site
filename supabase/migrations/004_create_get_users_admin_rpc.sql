-- RPC function for Admin page Users tab
-- SECURITY DEFINER bypasses RLS so we can read all profiles
-- But we verify the caller is the admin via their GitHub username in JWT metadata
DROP FUNCTION IF EXISTS get_users_admin();
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
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  caller_uid uuid;
  caller_jwt jsonb;
  caller_github text;
  admin_github text := 'tw2818';  -- Must match ADMIN_USER in config.ts
BEGIN
  -- Get the calling user's ID and JWT
  caller_uid := auth.uid();
  caller_jwt := auth.jwt();
  
  -- Extract GitHub username from JWT metadata
  caller_github := caller_jwt->>'user_name';
  
  -- Only the admin can access this function
  IF caller_github IS NULL OR caller_github != admin_github THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  
  -- Return all profiles
  RETURN QUERY
  SELECT p.id, p.email, p.nickname, p.github, p.avatar_url, p.bio, p.bilibili, p.twitter, p.created_at, p.updated_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$;
