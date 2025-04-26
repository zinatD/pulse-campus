-- Fix the infinite recursion in profiles policies

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to registration codes" ON registration_codes;
DROP POLICY IF EXISTS "Users can view unused registration codes" ON registration_codes;

-- Drop any existing helper views or functions
DROP VIEW IF EXISTS roles;
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_teacher();

-- Completely disable RLS on profiles temporarily to break recursion cycle
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create a direct mapping table that won't trigger RLS checks
CREATE TABLE IF NOT EXISTS user_role_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_teacher BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Populate the cache table directly, bypassing RLS
INSERT INTO user_role_cache (user_id, role_name, is_admin, is_teacher)
SELECT 
  p.id as user_id,
  r.name as role_name,
  r.name = 'admin' as is_admin,
  r.name = 'teacher' as is_teacher
FROM 
  profiles p
  JOIN roles r ON p.role_id = r.id
ON CONFLICT (user_id) 
DO UPDATE SET 
  role_name = EXCLUDED.role_name,
  is_admin = EXCLUDED.is_admin,
  is_teacher = EXCLUDED.is_teacher,
  last_updated = CURRENT_TIMESTAMP;

-- Create functions that use the cache table
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  -- First check JWT claims if available
  IF auth.jwt() ->> 'role' = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check the cache table which has no RLS
  RETURN EXISTS (
    SELECT 1 FROM user_role_cache
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_teacher() RETURNS BOOLEAN AS $$
BEGIN
  -- Check the cache table which has no RLS
  RETURN EXISTS (
    SELECT 1 FROM user_role_cache
    WHERE user_id = auth.uid() AND is_teacher = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update the cache when profiles are modified
CREATE OR REPLACE FUNCTION update_user_role_cache() RETURNS TRIGGER AS $$
BEGIN
  -- If role_id changed
  IF TG_OP = 'UPDATE' AND OLD.role_id <> NEW.role_id THEN
    INSERT INTO user_role_cache (user_id, role_name, is_admin, is_teacher)
    SELECT 
      NEW.id,
      r.name,
      r.name = 'admin',
      r.name = 'teacher'
    FROM roles r
    WHERE r.id = NEW.role_id
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role_name = EXCLUDED.role_name,
      is_admin = EXCLUDED.is_admin,
      is_teacher = EXCLUDED.is_teacher,
      last_updated = CURRENT_TIMESTAMP;
  -- If inserting new profile
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO user_role_cache (user_id, role_name, is_admin, is_teacher)
    SELECT 
      NEW.id,
      r.name,
      r.name = 'admin',
      r.name = 'teacher'
    FROM roles r
    WHERE r.id = NEW.role_id
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role_name = EXCLUDED.role_name,
      is_admin = EXCLUDED.is_admin,
      is_teacher = EXCLUDED.is_teacher,
      last_updated = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS profile_role_update ON profiles;
CREATE TRIGGER profile_role_update
AFTER INSERT OR UPDATE OF role_id ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_role_cache();

-- Re-enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Now re-create simplified policies using our cache-based functions
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins have full access to profiles" ON profiles
  USING (is_admin());

CREATE POLICY "Teachers can view student profiles" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_teacher());

-- Create non-recursive policies for registration_codes
CREATE POLICY "Admins have full access to registration codes" ON registration_codes
  USING (is_admin());

CREATE POLICY "Users can view unused registration codes" ON registration_codes
  FOR SELECT USING (NOT is_used);
