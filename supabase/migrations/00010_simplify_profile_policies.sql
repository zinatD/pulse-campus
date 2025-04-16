-- Remove the recursive policies and simplify access rules

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view profiles" ON profiles;
DROP POLICY IF EXISTS "Debug: allow select on profiles" ON profiles;

-- Create a very simple policy for selection - everyone can read profiles
CREATE POLICY "Anyone can select profiles" ON profiles
  FOR SELECT USING (true);

-- Only allow users to update their own profiles
CREATE POLICY "Users can update own profiles" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Only allow insert with matching auth ID
CREATE POLICY "Users can insert own profiles" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a direct view to get role information without recursion
CREATE OR REPLACE VIEW user_roles AS
SELECT 
  p.id,
  p.email,
  p.username,
  p.role_id,
  r.name as role_name
FROM 
  profiles p
JOIN 
  roles r ON p.role_id = r.id;

-- Create a function to get user role safely
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
