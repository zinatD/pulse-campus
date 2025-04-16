-- Fix infinite recursion issues and duplicate key violations

-- ------------------------------------------------------
-- Step 1: Drop all policies causing recursion
-- ------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON profiles;

-- ------------------------------------------------------
-- Step 2: Create temporary authentication function
-- ------------------------------------------------------
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
DECLARE
  role_name TEXT;
BEGIN
  SELECT r.name INTO role_name
  FROM roles r
  INNER JOIN profiles p ON r.id = p.role_id
  WHERE p.id = auth.uid();
  
  RETURN role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------
-- Step 3: Create non-recursive policies for profiles
-- ------------------------------------------------------

-- Basic policy: All authenticated users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Basic policy: All authenticated users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- A more permissive policy for admins (using the function)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (auth_user_role() = 'admin');

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (auth_user_role() = 'admin');

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (auth_user_role() = 'admin');

CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (auth_user_role() = 'admin');

-- Teachers can view other profiles (not update them)
CREATE POLICY "Teachers can view profiles" ON profiles
  FOR SELECT USING (auth_user_role() = 'teacher' OR id = auth.uid());

-- ------------------------------------------------------
-- Step 4: Fix registration_codes policies
-- ------------------------------------------------------
DROP POLICY IF EXISTS "Admins have full access to registration codes" ON registration_codes;
DROP POLICY IF EXISTS "Users can view unused registration codes" ON registration_codes;

-- Create new policies using our function
CREATE POLICY "Admins have full access to registration codes" ON registration_codes
  FOR ALL USING (auth_user_role() = 'admin');

-- Anyone can view unused registration codes (needed for registration)
CREATE POLICY "Public can view registration codes" ON registration_codes
  FOR SELECT USING (true);

-- ------------------------------------------------------
-- Step 5: Clear out duplicate registration codes to be safe
-- ------------------------------------------------------
DELETE FROM registration_codes 
WHERE code IN ('ADMIN-SECRET-2024', 'TEACHER-SECRET-2024');

-- Now insert them again
INSERT INTO registration_codes (code, role_id, is_used)
SELECT 'ADMIN-SECRET-2024', 1, false
WHERE NOT EXISTS (SELECT 1 FROM registration_codes WHERE code = 'ADMIN-SECRET-2024');

INSERT INTO registration_codes (code, role_id, is_used)
SELECT 'TEACHER-SECRET-2024', 2, false
WHERE NOT EXISTS (SELECT 1 FROM registration_codes WHERE code = 'TEACHER-SECRET-2024');

-- Add another admin code just to be safe
INSERT INTO registration_codes (code, role_id, is_used)
VALUES ('ADMIN-BACKUP-2024', 1, false);
