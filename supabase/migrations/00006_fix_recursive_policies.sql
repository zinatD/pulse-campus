-- Fix the infinite recursion in profiles policies

-- First drop all policies for profiles to eliminate recursive dependencies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON profiles;

-- Re-create policies with non-recursive logic

-- Allow public access to read profile information by using auth.uid() directly
-- without recursively checking profiles table
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Create a helper function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  -- First check JWT claims if available
  IF auth.jwt() ->> 'role' = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Then check through a direct join avoiding recursion
  RETURN EXISTS (
    SELECT 1 
    FROM roles r
    JOIN profiles p ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Similarly create a helper function for teachers
CREATE OR REPLACE FUNCTION is_teacher() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM roles r
    JOIN profiles p ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'teacher'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin access using the helper function
CREATE POLICY "Admins have full access to profiles" ON profiles
  USING (is_admin());

-- Teachers can view student profiles
CREATE POLICY "Teachers can view student profiles" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_teacher());

-- Fix the registration_codes policy to prevent recursion
DROP POLICY IF EXISTS "Admins have full access to registration codes" ON registration_codes;
DROP POLICY IF EXISTS "Users can view unused registration codes" ON registration_codes;

-- Create a non-recursive policy for registration codes
CREATE POLICY "Admins have full access to registration codes" ON registration_codes
  USING (is_admin());

-- For security, add a view-only policy for non-admin users
CREATE POLICY "Users can view unused registration codes" ON registration_codes
  FOR SELECT USING (NOT is_used);
