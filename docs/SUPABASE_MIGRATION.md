# MongoDB to Supabase Migration Guide

This guide will help you migrate your Attendee Attendance Terminal from MongoDB to Supabase (PostgreSQL).

## Prerequisites

- A Supabase account and project
- PostgreSQL knowledge (basic)
- Node.js 16+ installed

## Step 1: Set up Supabase Project

1. **Create a Supabase project:**
   - Go to [https://supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and service role key

2. **Create the database schema:**
   - Go to your Supabase dashboard
   - Navigate to the SQL editor
   - Copy and run the contents of `backend/database/schema.sql`

## Step 2: Update Environment Variables

1. **Copy the example file:**
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Update your `.env` file with Supabase credentials:**
   ```bash
   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Keep other existing variables...
   JWT_SECRET=your-jwt-secret-key
   ```

## Step 3: Install New Dependencies

1. **Backend:**
   ```bash
   cd backend
   npm install @supabase/supabase-js
   npm uninstall mongoose
   ```

2. **Frontend:**
   ```bash
   cd ../frontend
   npm install @supabase/supabase-js
   ```

## Step 4: Create Initial Admin User

```bash
cd backend
npm run create-admin
```

This will create an admin user using the credentials in your `.env` file.

## Step 5: Test the Migration

1. **Start the backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend:**
   ```bash
   cd ../frontend
   npm run dev
   ```

3. **Test login:**
   - Go to http://localhost:3000
   - Login with your admin credentials
   - Verify all features work correctly

## Key Changes Made

### Database Schema
- **Users Table:** Converted from MongoDB document to PostgreSQL table
- **Attendance Table:** Converted with JSON fields for sessions
- **Indexes:** Recreated for optimal query performance
- **Triggers:** Added for automatic timestamp updates

### Backend Changes
- **Models:** Converted from Mongoose schemas to Supabase-compatible classes
- **Queries:** Updated from MongoDB queries to Supabase queries
- **Error Handling:** Updated to handle PostgreSQL error codes
- **Authentication:** Maintained JWT-based auth (unchanged)

### Frontend Changes
- **API Calls:** No changes needed (backend maintains compatibility)
- **Data Structure:** Minor adjustments for PostgreSQL UUIDs vs MongoDB ObjectIds

## Benefits of Supabase

1. **Real-time subscriptions:** Built-in real-time features
2. **Better scaling:** Horizontal scaling with PostgreSQL
3. **Dashboard:** Built-in admin interface
4. **Row Level Security:** Fine-grained access control
5. **API Management:** Automatic REST and GraphQL APIs
6. **Storage:** Built-in file storage (for profile pictures)

## Troubleshooting

### Common Issues

1. **Connection Error:**
   ```
   ❌ Supabase connection failed
   ```
   - Check your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - Ensure your Supabase project is active

2. **Schema Not Found:**
   ```
   relation "users" does not exist
   ```
   - Run the `schema.sql` file in your Supabase SQL editor

3. **Permission Error:**
   ```
   insufficient_privilege
   ```
   - Make sure you're using the service role key, not the anon key

4. **UUID Format Error:**
   ```
   invalid input syntax for type uuid
   ```
   - This typically happens when frontend sends old MongoDB ObjectId format
   - Clear browser storage and try again

### Performance Tips

1. **Enable Row Level Security (RLS):**
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
   ```

2. **Add appropriate policies:**
   ```sql
   -- Example: Users can only see their own attendance
   CREATE POLICY "Users can view own attendance" ON attendance
   FOR SELECT USING (auth.uid() = user_id);
   ```

3. **Monitor query performance:**
   - Use Supabase dashboard to monitor slow queries
   - Add indexes as needed

## Data Migration (Optional)

If you want to migrate existing data from MongoDB:

1. **Export MongoDB data:**
   ```bash
   mongoexport --db attendance --collection users --out users.json
   mongoexport --db attendance --collection attendances --out attendance.json
   ```

2. **Transform and import:**
   - Create a migration script to transform MongoDB documents to PostgreSQL format
   - Handle ObjectId to UUID conversion
   - Import using Supabase client or direct SQL

## Rollback Plan

If you need to rollback to MongoDB:

1. Keep the old MongoDB-based files:
   - `models/User_old.js`
   - `models/Attendance_old.js`
   - `routes/*_old.js`

2. Restore the old package.json dependencies

3. Update your `.env` file back to MongoDB configuration

## Support

- **Supabase Documentation:** [https://supabase.com/docs](https://supabase.com/docs)
- **PostgreSQL Documentation:** [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- **Project Issues:** Use GitHub issues for project-specific problems
