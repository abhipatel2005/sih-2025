-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  rfid_tag VARCHAR UNIQUE NOT NULL,
  role VARCHAR DEFAULT 'member' CHECK (role IN ('teacher', 'admin', 'student', 'principal')),
  status VARCHAR DEFAULT 'active' CHECK (status IN ('present', 'absent', 'late')),
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR,
  category VARCHAR,
  gender VARCHAR,
  std VARCHAR,
  password VARCHAR NOT NULL,
  profile_picture TEXT DEFAULT '',
  dob DATE,
  address VARCHAR,
  blood_group VARCHAR,
  aadhar_id VARCHAR,
  school_id uuid NOT NULL REFERENCES schools(school_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Create indexes for better performance
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date DESC);
CREATE INDEX idx_attendance_date ON attendance(date DESC);
CREATE INDEX idx_attendance_timestamp ON attendance(timestamp DESC);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rfid_tag ON users(rfid_tag);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

create table schools (
  school_id uuid primary key default gen_random_uuid(),
  name text not null,
  district text not null,
  state text not null
);