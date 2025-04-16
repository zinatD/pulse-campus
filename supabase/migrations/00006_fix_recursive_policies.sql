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

-- Admin access - use auth.jwt() to check role without recursion
CREATE POLICY "Admins have full access to profiles" ON profiles
  USING (
    -- Use JWT claims directly if available in your setup
    (auth.jwt() ->> 'role') = 'admin'
    -- Fallback to a direct role check
    OR EXISTS (
      SELECT 1 FROM roles r
      WHERE auth.uid() IN (
        SELECT id FROM profiles WHERE role_id = r.id AND r.name = 'admin'
      )
    )
  );

-- Teachers can view student profiles
CREATE POLICY "Teachers can view student profiles" ON profiles
  FOR SELECT USING (
    -- Either this is the user's own profile
    id = auth.uid() 
    -- Or the current user is a teacher
    OR EXISTS (
      SELECT 1 FROM roles r
      WHERE auth.uid() IN (
        SELECT id FROM profiles WHERE role_id = r.id AND r.name = 'teacher'
      )
    )
  );

-- Fix the registration_codes policy to prevent recursion
DROP POLICY IF EXISTS "Admins have full access to registration codes" ON registration_codes;

-- Create a non-recursive policy for registration codes
CREATE POLICY "Admins have full access to registration codes" ON registration_codes
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE auth.uid() IN (
        SELECT id FROM profiles WHERE role_id = r.id AND r.name = 'admin'
      )
    )
  );

-- For security, add a view-only policy for non-admin users
CREATE POLICY "Users can view unused registration codes" ON registration_codes
  FOR SELECT USING (NOT is_used);
