-- Fix the trigger function to correctly use role_id from user metadata

-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the function to check for role_id in raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_value INTEGER;
BEGIN
  -- Check if role_id exists in raw_user_meta_data
  IF NEW.raw_user_meta_data ? 'role_id' THEN
    role_value := (NEW.raw_user_meta_data->>'role_id')::INTEGER;
  ELSE
    role_value := 3; -- Default to student role if not specified
  END IF;
  
  -- Log for debugging
  INSERT INTO public.debug_logs (message, data)
  VALUES (
    'New user registration',
    json_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'raw_meta', NEW.raw_user_meta_data,
      'assigned_role', role_value
    )
  );
  
  -- Insert the profile with the correct role_id
  INSERT INTO public.profiles (
    id, 
    username, 
    email, 
    full_name,
    name,
    surname,
    student_id,
    role_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'surname',
    NEW.raw_user_meta_data->>'student_id',
    role_value
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the debug logs table for troubleshooting
CREATE TABLE IF NOT EXISTS debug_logs (
  id SERIAL PRIMARY KEY,
  message TEXT,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Re-create the trigger with the updated function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing profiles where role_id might be wrong
UPDATE profiles
SET role_id = (raw_user_meta_data->>'role_id')::INTEGER
FROM auth.users
WHERE 
  profiles.id = auth.users.id
  AND raw_user_meta_data ? 'role_id'
  AND (raw_user_meta_data->>'role_id')::INTEGER != profiles.role_id;

-- Log the update results
INSERT INTO debug_logs (message, data)
SELECT 
  'Updated existing profiles',
  json_build_object(
    'user_id', u.id,
    'email', u.email,
    'meta_role', (u.raw_user_meta_data->>'role_id')::INTEGER,
    'profile_role', p.role_id
  )
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.raw_user_meta_data ? 'role_id';
