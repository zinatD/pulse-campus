-- Update profiles table to add separate name and surname fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS surname TEXT,
ADD COLUMN IF NOT EXISTS student_id TEXT;

-- Create a table for role registration verification codes
CREATE TABLE IF NOT EXISTS registration_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  role_id INTEGER REFERENCES roles(id) NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

-- Insert some sample registration codes for admin and teacher roles
INSERT INTO registration_codes (code, role_id, is_used) VALUES
  ('ADMIN-SECRET-2024', 1, false), -- Admin code
  ('TEACHER-SECRET-2024', 2, false); -- Teacher code

-- Set up Row Level Security for registration codes
ALTER TABLE registration_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can view, insert, update registration codes
CREATE POLICY "Admins have full access to registration codes" ON registration_codes
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      JOIN roles r ON p.role_id = r.id 
      WHERE p.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Function to populate name and surname from full_name for existing profiles
CREATE OR REPLACE FUNCTION populate_name_surname() RETURNS void AS $$
DECLARE
  profile_record RECORD;
  name_parts TEXT[];
BEGIN
  FOR profile_record IN SELECT id, full_name FROM profiles WHERE full_name IS NOT NULL AND name IS NULL LOOP
    name_parts := string_to_array(profile_record.full_name, ' ');
    
    IF array_length(name_parts, 1) >= 2 THEN
      -- First element as first name
      UPDATE profiles SET name = name_parts[1] WHERE id = profile_record.id;
      
      -- Last element as surname (if more than one name part)
      UPDATE profiles SET surname = name_parts[array_length(name_parts, 1)] 
      WHERE id = profile_record.id;
    ELSE
      -- If only one name part, use it as the name
      UPDATE profiles SET name = profile_record.full_name WHERE id = profile_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute function to populate name and surname fields
SELECT populate_name_surname();
