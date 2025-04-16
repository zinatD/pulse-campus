-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Admins have full access to courses
CREATE POLICY "Admins have full access to courses" ON courses
  USING (EXISTS (
    SELECT 1 FROM profiles p 
    JOIN roles r ON p.role_id = r.id 
    WHERE p.id = auth.uid() AND r.name = 'admin'
  ));

-- Teachers can view all courses
CREATE POLICY "Teachers can view all courses" ON courses
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles p 
    JOIN roles r ON p.role_id = r.id 
    WHERE p.id = auth.uid() AND r.name = 'teacher'
  ));

-- Teachers can create and update their own courses
CREATE POLICY "Teachers can create and update own courses" ON courses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      JOIN roles r ON p.role_id = r.id 
      WHERE p.id = auth.uid() AND r.name = 'teacher'
    )
  );

CREATE POLICY "Teachers can update own courses" ON courses
  FOR UPDATE USING (
    instructor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles p 
      JOIN roles r ON p.role_id = r.id 
      WHERE p.id = auth.uid() AND r.name = 'teacher'
    )
  );

-- Students can only view courses
CREATE POLICY "Students can view courses" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      JOIN roles r ON p.role_id = r.id 
      WHERE p.id = auth.uid() AND r.name = 'student'
    )
  );
