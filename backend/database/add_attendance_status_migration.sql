-- Migration: Add status column to attendance table and migrate data from users table
-- Date: 2025-09-25
-- Purpose: Move attendance status from users table to attendance table for better data structure

-- Step 1: Add status column to attendance table
ALTER TABLE attendance 
ADD COLUMN status VARCHAR DEFAULT 'present' 
CHECK (status IN ('present', 'absent', 'late', 'excused'));

-- Step 2: Update existing attendance records with status from users table
-- This will set all existing attendance records to 'present' since they represent actual attendance
UPDATE attendance 
SET status = 'present'
WHERE status IS NULL;

-- Step 3: Create index for better performance on status queries
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_user_status ON attendance(user_id, status);

-- Step 4: Update the schema for future reference
-- Note: The users.status column can now represent current/overall user status
-- while attendance.status represents the status for each specific attendance record

-- Optional: Clean up users.status to represent overall user account status rather than daily attendance
-- Uncomment the following lines if you want to reset user status to active/inactive only
-- UPDATE users SET status = 'active' WHERE status IN ('present', 'absent', 'late');
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
-- ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', ''));
