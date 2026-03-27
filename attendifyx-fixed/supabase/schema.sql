-- AttendifyX Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  student_id TEXT UNIQUE,
  employee_id TEXT UNIQUE,
  level TEXT CHECK (level IN ('highschool', 'senior_highschool', 'college')),
  grade_year TEXT,
  section TEXT,
  department TEXT,
  subject TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
  birthdate DATE,
  profile_pic TEXT,
  notif_enabled BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_code TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  qr_token TEXT UNIQUE NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  method TEXT DEFAULT 'qr' CHECK (method IN ('qr', 'link')),
  synced BOOLEAN DEFAULT true,
  session_snapshot TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Feedback / Absence Justification
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  teacher_reply TEXT,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'not_valid')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  replied_at TIMESTAMP WITH TIME ZONE,
  notif_sent BOOLEAN DEFAULT false
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'teacher', 'admin')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync log table
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  records_sent INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('success', 'partial', 'error')),
  notes JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_session_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_scanned_at ON attendance(scanned_at);
CREATE INDEX IF NOT EXISTS idx_feedbacks_student_id ON feedbacks(student_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_teacher_id ON feedbacks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id::text = auth.uid()::text);

CREATE POLICY "Teachers can view students" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND role = 'teacher'
    )
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id::text = auth.uid()::text);

-- RLS Policies for sessions
CREATE POLICY "Teachers can view own sessions" ON sessions
  FOR SELECT USING (teacher_id::text = auth.uid()::text);

CREATE POLICY "Teachers can create sessions" ON sessions
  FOR INSERT WITH CHECK (teacher_id::text = auth.uid()::text);

CREATE POLICY "Teachers can update own sessions" ON sessions
  FOR UPDATE USING (teacher_id::text = auth.uid()::text);

-- RLS Policies for attendance
CREATE POLICY "Students can view own attendance" ON attendance
  FOR SELECT USING (student_id::text = auth.uid()::text);

CREATE POLICY "Teachers can view session attendance" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE id::text = attendance.session_id::text AND teacher_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Students can create attendance" ON attendance
  FOR INSERT WITH CHECK (student_id::text = auth.uid()::text);

-- RLS Policies for feedbacks
CREATE POLICY "Students can view own feedbacks" ON feedbacks
  FOR SELECT USING (student_id::text = auth.uid()::text);

CREATE POLICY "Teachers can view received feedbacks" ON feedbacks
  FOR SELECT USING (teacher_id::text = auth.uid()::text);

CREATE POLICY "Students can create feedbacks" ON feedbacks
  FOR INSERT WITH CHECK (student_id::text = auth.uid()::text);

CREATE POLICY "Teachers can update feedbacks" ON feedbacks
  FOR UPDATE USING (teacher_id::text = auth.uid()::text);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- RLS Policies for sync_log
CREATE POLICY "Allow all operations on sync_log" ON sync_log
  FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
