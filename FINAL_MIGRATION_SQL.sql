-- Final SQL commands to complete attendance status migration
-- Run these directly in Supabase SQL Editor

-- 1. Ensure status column exists with proper constraints
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'present' 
CHECK (status IN ('present', 'absent', 'late', 'excused'));

-- 2. Update any null or empty status values
UPDATE attendance 
SET status = 'present' 
WHERE status IS NULL OR status = '';

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_user_status ON attendance(user_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_date_status ON attendance(date, status);

-- 4. Optional: Clean up users table status (if you want to repurpose it)
-- UPDATE users SET status = '' WHERE status IN ('present', 'absent', 'late');

-- 5. Verify the migration
SELECT 
  status,
  COUNT(*) as record_count
FROM attendance 
GROUP BY status
ORDER BY status;
