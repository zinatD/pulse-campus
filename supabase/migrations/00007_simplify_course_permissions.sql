-- Migration to completely simplify course permissions

-- First, disable RLS on courses to allow us to work with it
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on courses - be more exhaustive with policy names
DROP POLICY IF EXISTS "Users can view courses they created" ON courses;
DROP POLICY IF EXISTS "Users can modify courses they created" ON courses;
DROP POLICY IF EXISTS "Admins have full access to courses" ON courses;
DROP POLICY IF EXISTS "Teachers can view all courses" ON courses;
DROP POLICY IF EXISTS "Anyone can view public courses" ON courses;

-- Add a new column to simplify permission checking
ALTER TABLE courses ADD COLUMN IF NOT EXISTS public BOOLEAN DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update existing courses to set created_by from instructor_id
UPDATE courses SET created_by = instructor_id WHERE created_by IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);

-- Re-enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create simplified course policies that don't depend on profiles
-- Everyone can read public courses
CREATE POLICY "Anyone can view public courses" ON courses
  FOR SELECT USING (public = true);

-- Course creators can view their own courses (public or private)
CREATE POLICY "Users can view courses they created" ON courses
  FOR SELECT USING (created_by = auth.uid());

-- Course creators can modify their own courses
CREATE POLICY "Users can modify courses they created" ON courses
  FOR ALL USING (created_by = auth.uid());

-- Create a simplified admin course check that doesn't use profiles
CREATE OR REPLACE FUNCTION can_admin_courses() RETURNS BOOLEAN AS $$
BEGIN
  -- Check direct JWT claim if available
  IF auth.jwt() ->> 'role' = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Simplest possible check against the user_role_cache table we created earlier
  -- This should be available from our previous migration
  RETURN EXISTS (
    SELECT 1 FROM user_role_cache
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policy for courses
CREATE POLICY "Admins have full access to courses" ON courses
  FOR ALL USING (can_admin_courses());
