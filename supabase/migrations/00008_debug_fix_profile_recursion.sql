-- Debug and fix the persistent recursion issue with profiles

-- First, let's find what values are valid for the enum
-- Check the enum values in the db
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        RAISE NOTICE 'Enum user_role exists';
    ELSE
        -- Create the enum if it doesn't exist yet
        CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
        RAISE NOTICE 'Created enum user_role';
    END IF;
END $$;

-- First, let's look at all policies on the profiles table
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Then completely disable RLS on profiles to break any recursion cycles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Ensure our user_role_cache table is properly set up
DROP TABLE IF EXISTS user_role_cache CASCADE;
CREATE TABLE user_role_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name user_role NOT NULL,  -- Updated to use the enum type
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_teacher BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a function to rebuild the cache - this avoids RLS by being run with elevated privileges
CREATE OR REPLACE FUNCTION rebuild_user_role_cache() RETURNS VOID AS $$
BEGIN
  -- Clear the current cache
  DELETE FROM user_role_cache;
  
  -- Populate with a direct query that avoids RLS
  -- Use 'student' as default for the enum
  INSERT INTO user_role_cache (user_id, role_name, is_admin, is_teacher)
  SELECT 
    p.id as user_id,
    COALESCE(r.name::user_role, 'student'::user_role) as role_name,
    COALESCE(r.name = 'admin', false) as is_admin,
    COALESCE(r.name = 'teacher', false) as is_teacher
  FROM 
    profiles p
    LEFT JOIN roles r ON p.role_id = r.id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rebuild the cache now
SELECT rebuild_user_role_cache();

-- Recreate the helper functions using the cache
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  -- First check JWT claims if available
  IF auth.jwt() ->> 'role' = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Direct lookup, not involving RLS
  SELECT is_admin INTO result
  FROM user_role_cache
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(result, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_teacher() RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  -- Direct lookup, not involving RLS
  SELECT is_teacher INTO result
  FROM user_role_cache
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(result, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON profiles;

-- Re-enable RLS with simplified policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a master maintenance function for profile access
-- This completely avoids recursion by handling all policy logic in one place
CREATE OR REPLACE FUNCTION can_access_profile(profile_id UUID, access_type TEXT) RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID := auth.uid();
  is_user_admin BOOLEAN;
  is_user_teacher BOOLEAN;
BEGIN
  -- Quick exit for system operations (migrations, etc.)
  IF current_user_id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Direct equality check - users can always access their own profile
  IF profile_id = current_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check admin/teacher status from cache (no recursion)
  SELECT is_admin, is_teacher INTO is_user_admin, is_user_teacher
  FROM user_role_cache
  WHERE user_id = current_user_id;
  
  is_user_admin := COALESCE(is_user_admin, FALSE);
  is_user_teacher := COALESCE(is_user_teacher, FALSE);
  
  -- Admin can do anything
  IF is_user_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Teacher can view any profile
  IF is_user_teacher AND access_type = 'select' THEN
    RETURN TRUE;
  END IF;
  
  -- Default deny
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simplified policies that use our master function
CREATE POLICY "Profile access policy" ON profiles
  USING (can_access_profile(id, 'select'))
  WITH CHECK (can_access_profile(id, 'update'));

-- Create a trigger to update cache when profiles change
CREATE OR REPLACE FUNCTION update_role_cache_on_profile_change() RETURNS TRIGGER AS $$
BEGIN
  -- Only run when role_id changes
  IF (TG_OP = 'UPDATE' AND NEW.role_id IS DISTINCT FROM OLD.role_id) OR TG_OP = 'INSERT' THEN
    -- Update the cache for this user
    DELETE FROM user_role_cache WHERE user_id = NEW.id;
    
    INSERT INTO user_role_cache (user_id, role_name, is_admin, is_teacher)
    SELECT 
      NEW.id,
      COALESCE(r.name::user_role, 'student'::user_role),
      COALESCE(r.name = 'admin', false),
      COALESCE(r.name = 'teacher', false)
    FROM roles r
    WHERE r.id = NEW.role_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add the trigger
DROP TRIGGER IF EXISTS profile_role_update ON profiles;
CREATE TRIGGER profile_role_update
AFTER INSERT OR UPDATE OF role_id ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_role_cache_on_profile_change();

-- Schedule regular cache rebuilds to avoid staleness
-- This ensures the cache stays in sync with the actual data
CREATE OR REPLACE FUNCTION create_role_cache_maintenance_job() RETURNS VOID AS $$
BEGIN
  -- Use pg_cron if available
  -- This is commented out and would need to be enabled if pg_cron extension is available
  -- SELECT cron.schedule('0 * * * *', 'SELECT rebuild_user_role_cache()');
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Call it as a one-time setup
SELECT create_role_cache_maintenance_job();
