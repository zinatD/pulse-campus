-- This migration completely rebuilds the profiles table with simpler policies
-- to avoid the recursive policy problems once and for all

-- Step 1: Create a backup of profiles data
CREATE TABLE IF NOT EXISTS profiles_backup AS
SELECT * FROM profiles;

-- Step 2: Save role names separately (we'll need this for restoration)
CREATE TEMPORARY TABLE profile_roles AS
SELECT p.id, r.name as role_name
FROM profiles p
JOIN roles r ON p.role_id = r.id;

-- Step 3: Drop constraints/triggers that might prevent dropping the table
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop foreign keys referencing profiles
    FOR r IN (SELECT con.conname, con.conrelid::regclass AS table_name
              FROM pg_constraint con
              JOIN pg_class rel ON rel.oid = con.conrelid
              JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
              WHERE con.contype = 'f'
              AND con.confrelid = 'profiles'::regclass
              AND nsp.nspname = 'public')
    LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || r.conname || ' CASCADE';
    END LOOP;
    
    -- Drop triggers on the profiles table
    FOR r IN (SELECT tgname
              FROM pg_trigger
              WHERE tgrelid = 'profiles'::regclass)
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON profiles CASCADE';
    END LOOP;
END $$;

-- Step 4: Drop old RLS policies, views, and functions
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
DROP VIEW IF EXISTS profiles_secure;
DROP FUNCTION IF EXISTS get_profile(UUID);
DROP FUNCTION IF EXISTS get_all_profiles();

-- Step 5: Drop the profiles table
DROP TABLE profiles CASCADE;

-- Step 6: Recreate profiles table with clean schema
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  name TEXT,
  surname TEXT,
  avatar_url TEXT,
  role_id INTEGER REFERENCES roles(id) DEFAULT 3, -- Default to student
  email TEXT,
  student_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 7: Restore data from backup
INSERT INTO profiles (
  id, username, full_name, name, surname, avatar_url, 
  role_id, email, student_id, created_at, updated_at
)
SELECT 
  id, username, full_name, name, surname, avatar_url, 
  role_id, email, student_id, created_at, updated_at
FROM profiles_backup;

-- Step 8: Create direct role-based functions
CREATE OR REPLACE FUNCTION is_profile_admin(profile_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
  profile_role_id INTEGER;
BEGIN
  SELECT role_id INTO profile_role_id FROM profiles WHERE id = profile_id;
  RETURN profile_role_id = 1;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_profile_teacher(profile_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
  profile_role_id INTEGER;
BEGIN
  SELECT role_id INTO profile_role_id FROM profiles WHERE id = profile_id;
  RETURN profile_role_id = 2;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Set up extremely simple RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Rule 1: Anyone can read all profiles
CREATE POLICY "Public read access for profiles"
  ON profiles FOR SELECT
  USING (true);

-- Rule 2: Users can update only their own profiles
CREATE POLICY "Users can update own profiles"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Rule 3: Only admins can delete profiles
CREATE POLICY "Only admins can delete profiles"
  ON profiles FOR DELETE
  USING (is_profile_admin(auth.uid()));

-- Rule 4: Insert restrictions (either admin or matching UID)
CREATE POLICY "Insert restrictions for profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR is_profile_admin(auth.uid()));

-- Step 10: Create a simple view for convenience
CREATE OR REPLACE VIEW profiles_with_roles AS
SELECT
  p.*,
  r.name AS role_name
FROM
  profiles p
LEFT JOIN
  roles r ON p.role_id = r.id;

-- Step 11: Clean up backup if everything went well
-- (Commented out for safety - uncomment once you verify the migration worked)
-- DROP TABLE profiles_backup;
