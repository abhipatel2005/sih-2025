# Profile Component Testing Guide

## Prerequisites
Before testing the Profile component, ensure the following:

1. **Supabase Setup**: Make sure your `.env` file has the correct Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Admin User**: Ensure there's a user with email `admin@gmail.com` in your Supabase `users` table.

## Testing Steps

### 1. Profile Loading Test
- Navigate to the Profile page
- Verify that the loading spinner appears initially
- Check that all profile information is displayed correctly:
  - Name, email, phone, role, status
  - Profile picture (or initials if no picture)
  - Skills, bio, join date
  - Account creation and update timestamps
  - Last 10 attendance records

### 2. Edit Profile Test
- Click the "Edit Profile" button
- Verify that all form fields are populated with current data
- Test form validation:
  - Try submitting with empty name (should show error)
  - Try invalid email format (should show error)
  - Try phone number with invalid length (should show error)
  - Try password less than 6 characters (should show error)
  - Try mismatched password confirmation (should show error)

### 3. Profile Update Test
- Fill in all required fields with valid data
- Change profile picture URL
- Submit the form and verify:
  - Success message appears
  - Form switches back to view mode
  - All updated information is displayed
  - Data persists after page refresh

### 4. Password Update Test
- Enter a new password (6+ characters)
- Confirm the password correctly
- Submit and verify the update succeeds
- Note: Passwords are stored as plain text (should be hashed in production)

### 5. Error Handling Test
- Try updating with an email that's already in use
- Test with invalid Supabase connection
- Verify appropriate error messages are displayed

## Sample Test Data

```javascript
// Sample data for testing profile updates
const testProfileData = {
  name: "Admin User",
  email: "admin@gmail.com",
  phone: "+1234567890",
  profilePicture: "https://via.placeholder.com/150"
};
```

## Common Issues & Solutions

1. **Profile not loading**: Check Supabase credentials and ensure admin user exists
2. **Update failing**: Verify user permissions and table structure
3. **Validation errors**: Ensure all required fields meet validation criteria
4. **Attendance not loading**: Check if user_id exists in attendance table

## Database Schema Requirements

The Profile component expects these tables in Supabase:

```sql
-- Users table with required columns
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR,
  profile_picture TEXT,
  rfid_tag VARCHAR,
  role VARCHAR,
  status VARCHAR,
  skills TEXT[],
  bio TEXT,
  joined_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Attendance table for history
CREATE TABLE attendance (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  date DATE,
  sessions JSONB,
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```