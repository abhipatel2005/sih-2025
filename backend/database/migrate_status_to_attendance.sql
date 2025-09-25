-- Migration: Add status column to attendance table and migrate data from users table
-- Date: 2025-09-25
-- Purpose: Move attendance status from users table to attendance table for better data structure

-- Step 1: Add status column to attendance table if it doesn't exist
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'present' 
CHECK (status IN ('present', 'absent', 'late', 'excused'));

-- Step 2: Update existing attendance records with status
-- For existing attendance records, set status to 'present' since they represent actual attendance
UPDATE attendance 
SET status = 'present'
WHERE status IS NULL OR status = '';

-- Step 3: For any attendance records where we can match with user status, use that
-- This is optional but provides better data if users table has meaningful status values
UPDATE attendance 
SET status = CASE 
  WHEN users.status IN ('present', 'absent', 'late') THEN users.status
  ELSE 'present'
END
FROM users 
WHERE attendance.user_id = users.id 
AND users.status IN ('present', 'absent', 'late')
AND attendance.status = 'present';

-- Step 4: Create indexes for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_user_status ON attendance(user_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_date_status ON attendance(date, status);

-- Step 5: Update the users table status to represent overall user account status
-- Reset user status to empty or active since attendance.status now handles daily attendance
UPDATE users 
SET status = ''
WHERE status IN ('present', 'absent', 'late');

-- Optional: Update users table constraint to only allow account-level statuses
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
-- ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', ''));

-- Step 6: Verify the migration
-- Count records in attendance table with status
SELECT 
  status,
  COUNT(*) as record_count
FROM attendance 
GROUP BY status
ORDER BY status;

-- Show sample records to verify the structure
SELECT 
  a.id,
  a.date,
  a.timestamp,
  a.status,
  u.name,
  u.role
FROM attendance a
JOIN users u ON a.user_id = u.id
ORDER BY a.timestamp DESC
LIMIT 10;
