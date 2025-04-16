-- Fix role assignment during registration

-- First ensure we don't have any default role behaviors that might override
-- explicitly set roles
ALTER TABLE profiles 
ALTER COLUMN role_id DROP DEFAULT;

-- Create a trigger function to ensure role_id is properly set from auth.jwt claims
CREATE OR REPLACE FUNCTION set_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Get role_id from user metadata (from JWT)
  IF NEW.role_id IS NULL AND auth.jwt() ->> 'role_id' IS NOT NULL THEN
    NEW.role_id := (auth.jwt() ->> 'role_id')::integer;
  END IF;
  
  -- Default to student role if still null
  IF NEW.role_id IS NULL THEN
    NEW.role_id := 3; -- Default student role
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger to ensure role_id is set properly
DROP TRIGGER IF EXISTS set_profile_role_trigger ON profiles;
CREATE TRIGGER set_profile_role_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_profile_role();

-- Add drop-down indicators to registration codes to help debugging
ALTER TABLE registration_codes
ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE registration_codes SET notes = 'For admin registration' WHERE role_id = 1;
UPDATE registration_codes SET notes = 'For teacher registration' WHERE role_id = 2;

-- Ensure the public can select from roles for registration page
CREATE POLICY "Public can view roles" ON roles
  FOR SELECT USING (true);

-- For debugging access, enable select on profiles for now
CREATE POLICY "Debug: allow select on profiles" ON profiles
  FOR SELECT USING (true);
