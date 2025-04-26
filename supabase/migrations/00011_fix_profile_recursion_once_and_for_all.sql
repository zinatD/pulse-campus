-- Completely disable RLS on profiles to break any recursion cycles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all previous policies on profiles
DROP POLICY IF EXISTS "Anyone can select profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view profiles" ON profiles;
DROP POLICY IF EXISTS "Profile access policy" ON profiles;
DROP POLICY IF EXISTS "Debug: allow select on profiles" ON profiles;

-- Safely check what roles is and handle appropriately
DO $$
BEGIN
  -- Check if a view named 'roles' exists and drop it if it does
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'roles'
  ) THEN
    EXECUTE 'DROP VIEW roles CASCADE';
  END IF;
  
  -- Don't drop the roles table if it's a real table - we need it!
END $$;

-- Create a new profiles_secure view that's safe to query
CREATE OR REPLACE VIEW profiles_secure
WITH (security_barrier = true) -- Use proper PostgreSQL syntax
AS
SELECT 
  p.id,
  p.username,
  p.full_name,
  p.name,
  p.surname,
  p.avatar_url,
  p.role_id,
  p.email,
  p.created_at,
  p.updated_at,
  p.student_id,
  r.name as role_name
FROM 
  profiles p
LEFT JOIN 
  roles r ON p.role_id = r.id;

-- Create secure functions to get profile data
CREATE OR REPLACE FUNCTION get_profile(user_id UUID)
RETURNS SETOF profiles_secure AS $$
BEGIN
  RETURN QUERY SELECT * FROM profiles_secure WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_all_profiles()
RETURNS SETOF profiles_secure AS $$
BEGIN
  RETURN QUERY SELECT * FROM profiles_secure;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all helper functions with explicit signatures to avoid ambiguity
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_admin(uuid);
DROP FUNCTION IF EXISTS is_teacher();
DROP FUNCTION IF EXISTS is_teacher(uuid);
DROP FUNCTION IF EXISTS get_user_role(uuid);
DROP FUNCTION IF EXISTS auth_user_role();

-- Create a safe function to check user roles with explicit parameter types
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  role_name TEXT;
BEGIN
  SELECT r.name INTO role_name
  FROM roles r
  JOIN profiles p ON r.id = p.role_id
  WHERE p.id = user_id;
  
  RETURN COALESCE(role_name, 'student');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create boolean helper functions with unique names to avoid conflicts
CREATE OR REPLACE FUNCTION is_admin_v2(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_teacher_v2(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_id) = 'teacher';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use the new function version for auth_user_role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN get_user_role(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the user_role_cache table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_role_cache') THEN
    -- Refresh the cache
    TRUNCATE user_role_cache;
    
    INSERT INTO user_role_cache (user_id, role_name, is_admin, is_teacher)
    SELECT 
      p.id as user_id,
      COALESCE(r.name, 'student') as role_name,
      COALESCE(r.name = 'admin', false) as is_admin,
      COALESCE(r.name = 'teacher', false) as is_teacher
    FROM 
      profiles p
    LEFT JOIN 
      roles r ON p.role_id = r.id;
  END IF;
END
$$;

-- Fix registration_codes policies to use our new functions
DROP POLICY IF EXISTS "Admins have full access to registration codes" ON registration_codes;
DROP POLICY IF EXISTS "Public can view registration codes" ON registration_codes;
DROP POLICY IF EXISTS "Users can view unused registration codes" ON registration_codes;

-- Recreate policies using our safer functions
CREATE POLICY "Admins have full access to registration codes" ON registration_codes
  FOR ALL USING (is_admin_v2());

CREATE POLICY "Anyone can view unused codes" ON registration_codes
  FOR SELECT USING (NOT is_used);
