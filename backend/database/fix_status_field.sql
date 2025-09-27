-- Fix user status field to handle account status instead of attendance status
-- Drop the old constraint and add the new one

ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_status_check;

ALTER TABLE users 
ADD CONSTRAINT users_status_check 
CHECK (status IN ('active', 'inactive') OR status IS NULL);

-- Update existing status values (if any)
UPDATE users SET status = 'active' WHERE status IN ('present', '');
UPDATE users SET status = 'inactive' WHERE status IN ('absent', 'late');
UPDATE users SET status = NULL WHERE status NOT IN ('active', 'inactive');

-- Update default for status
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';
