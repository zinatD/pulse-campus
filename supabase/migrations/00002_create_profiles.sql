-- Create profiles table that links to auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role_id INTEGER REFERENCES roles(id) DEFAULT 3, -- Default to student role (3)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
-- Admins can do anything
CREATE POLICY "Admins have full access to profiles" ON profiles
  USING (EXISTS (
    SELECT 1 FROM profiles p 
    JOIN roles r ON p.role_id = r.id 
    WHERE p.id = auth.uid() AND r.name = 'admin'
  ));

-- Teachers can view all profiles but only update students
CREATE POLICY "Teachers can view all profiles" ON profiles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles p 
    JOIN roles r ON p.role_id = r.id 
    WHERE p.id = auth.uid() AND r.name = 'teacher'
  ));

CREATE POLICY "Teachers can update student profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN roles r1 ON p1.role_id = r1.id
      WHERE p1.id = auth.uid() AND r1.name = 'teacher'
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles p2
      JOIN roles r2 ON p2.role_id = r2.id
      WHERE p2.id = profiles.id AND r2.name = 'student'
    )
  );

-- Students can only view and update their own profiles
CREATE POLICY "Students can view and update own profile" ON profiles
  USING (id = auth.uid());

-- Adding a policy to allow inserting new profiles
CREATE POLICY "Allow insert for authenticated users" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role_id)
  VALUES (
    NEW.id,
    NEW.email, -- Default to email as username
    NEW.email,
    3 -- Default role_id for student
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
