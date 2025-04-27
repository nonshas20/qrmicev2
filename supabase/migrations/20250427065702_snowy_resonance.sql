/*
  # Initial Schema for MICE Attendance System

  1. New Tables
    - `students` - Stores student information
    - `events` - Stores event information
    - `attendance` - Stores attendance records
    - `profiles` - Stores user profile information
  
  2. Security
    - Enable RLS on all tables
    - Add policies for appropriate data access
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  qr_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  event_id UUID NOT NULL REFERENCES events(id),
  time_in TIMESTAMPTZ,
  time_out TIMESTAMPTZ,
  status TEXT DEFAULT 'absent' CHECK (status IN ('present', 'late', 'absent', 'excused')),
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, event_id)
);

-- Create profiles table for users (secretaries/admins)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  role TEXT DEFAULT 'secretary' CHECK (role IN ('admin', 'secretary')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Students policies
CREATE POLICY "Anyone can view students" 
ON students FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert students" 
ON students FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update students" 
ON students FOR UPDATE 
TO authenticated 
USING (true);

-- Events policies
CREATE POLICY "Anyone can view events" 
ON events FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert events" 
ON events FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update their events" 
ON events FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by);

-- Attendance policies
CREATE POLICY "Anyone can view attendance" 
ON attendance FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert attendance" 
ON attendance FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update attendance" 
ON attendance FOR UPDATE 
TO authenticated 
USING (true);

-- Profiles policies
CREATE POLICY "Users can view profiles" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'secretary');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);