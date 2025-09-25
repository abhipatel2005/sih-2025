-- Schools table schema for Analytics Dashboard
-- Add this to your Supabase database to enable full analytics functionality

CREATE TABLE schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  address TEXT,
  district VARCHAR,
  type VARCHAR DEFAULT 'Primary' CHECK (type IN ('Primary', 'High School', 'Secondary', 'Other')),
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  principal_name VARCHAR,
  contact_email VARCHAR,
  contact_phone VARCHAR,
  total_students INTEGER DEFAULT 0,
  total_teachers INTEGER DEFAULT 0,
  established_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample data for testing Analytics Dashboard
INSERT INTO schools (name, address, district, type, principal_name, contact_email, total_students, total_teachers, established_year) VALUES
('Govt Senior Secondary School Chandigarh', 'Sector 1, Chandigarh', 'Chandigarh', 'Secondary', 'Dr. Rajesh Kumar', 'principal.sss.chd@punjab.gov.in', 850, 45, 1975),
('Govt High School Ludhiana', 'Model Town, Ludhiana', 'Ludhiana', 'High School', 'Mrs. Priya Sharma', 'ghs.ludhiana@punjab.gov.in', 620, 32, 1982),
('Govt Primary School Amritsar', 'Mall Road, Amritsar', 'Amritsar', 'Primary', 'Mr. Harpreet Singh', 'gps.amritsar@punjab.gov.in', 280, 18, 1968),
('Govt Senior Secondary School Jalandhar', 'Civil Lines, Jalandhar', 'Jalandhar', 'Secondary', 'Dr. Sunita Devi', 'principal.sss.jal@punjab.gov.in', 750, 41, 1978),
('Govt High School Patiala', 'Urban Estate, Patiala', 'Patiala', 'High School', 'Mr. Manjeet Kumar', 'ghs.patiala@punjab.gov.in', 540, 29, 1985),
('Govt Primary School Bathinda', 'Thermal Colony, Bathinda', 'Bathinda', 'Primary', 'Mrs. Gurpreet Kaur', 'gps.bathinda@punjab.gov.in', 315, 20, 1972),
('Govt Senior Secondary School Mohali', 'Phase 8, Mohali', 'Mohali', 'Secondary', 'Dr. Amandeep Singh', 'principal.sss.moh@punjab.gov.in', 680, 38, 1988),
('Govt High School Gurdaspur', 'Model Town, Gurdaspur', 'Gurdaspur', 'High School', 'Mrs. Kavita Rani', 'ghs.gurdaspur@punjab.gov.in', 480, 26, 1980),
('Govt Primary School Hoshiarpur', 'Shastri Nagar, Hoshiarpur', 'Hoshiarpur', 'Primary', 'Mr. Balwinder Singh', 'gps.hoshiarpur@punjab.gov.in', 220, 15, 1965),
('Govt Senior Secondary School Ferozepur', 'Cantt Area, Ferozepur', 'Ferozepur', 'Secondary', 'Dr. Neelam Gupta', 'principal.sss.fzr@punjab.gov.in', 590, 34, 1983);

-- Create indexes for better performance
CREATE INDEX idx_schools_district ON schools(district);
CREATE INDEX idx_schools_type ON schools(type);
CREATE INDEX idx_schools_status ON schools(status);

-- Add updated_at trigger
CREATE TRIGGER update_schools_updated_at 
  BEFORE UPDATE ON schools 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Sample SQL queries for testing analytics
-- These queries can be used to verify the analytics dashboard is working correctly

-- 1. Count schools by district
SELECT district, COUNT(*) as count 
FROM schools 
WHERE status = 'active' 
GROUP BY district 
ORDER BY count DESC;

-- 2. Count schools by type
SELECT type, COUNT(*) as count 
FROM schools 
WHERE status = 'active' 
GROUP BY type;

-- 3. Total students and teachers across all schools
SELECT 
  COUNT(*) as total_schools,
  SUM(total_students) as total_students,
  SUM(total_teachers) as total_teachers,
  AVG(total_students) as avg_students_per_school
FROM schools 
WHERE status = 'active';

-- 4. Schools established by decade
SELECT 
  CASE 
    WHEN established_year < 1970 THEN 'Before 1970'
    WHEN established_year < 1980 THEN '1970s'
    WHEN established_year < 1990 THEN '1980s'
    WHEN established_year < 2000 THEN '1990s'
    ELSE '2000s+'
  END as decade,
  COUNT(*) as count
FROM schools 
WHERE established_year IS NOT NULL
GROUP BY decade
ORDER BY decade;