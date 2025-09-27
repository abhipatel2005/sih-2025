# Supabase Setup Guide

This guide will help you set up Supabase for the Attendee Attendance Terminal project.

## 1. Create Supabase Project

1. **Sign up/Login to Supabase:**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up for a free account or login

2. **Create a new project:**
   - Click "New project"
   - Choose your organization
   - Enter project name: `attendee-system`
   - Enter database password (save this securely!)
   - Choose a region close to your location
   - Click "Create new project"

3. **Wait for setup:**
   - This usually takes 1-2 minutes
   - Your project will be ready when you see the dashboard

## 2. Set up Database Schema

1. **Navigate to SQL Editor:**
   - In your Supabase dashboard, go to "SQL Editor"
   - Click "New query"

2. **Run the schema creation script:**
   - Copy the entire contents of `backend/database/schema.sql`
   - Paste it into the SQL editor
   - Click "Run" or press Ctrl/Cmd + Enter

3. **Verify tables were created:**
   - Go to "Table Editor" in the sidebar
   - You should see `users` and `attendance` tables

## 3. Get Your API Keys

1. **Navigate to Settings:**
   - In your Supabase dashboard, go to "Settings"
   - Click on "API" in the left sidebar

2. **Copy the required keys:**
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Service Role Key**: This starts with `eyJ...` (KEEP THIS SECRET!)

   ⚠️ **Important**: Use the **service role key**, not the anon key, for the backend.

## 4. Configure Environment Variables

1. **Backend configuration (`backend/.env`):**
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Other configuration (keep existing values)
   JWT_SECRET=your-jwt-secret-here
   PORT=3000
   ADMIN_EMAIL=admin@yourcompany.com
   ADMIN_PASSWORD=your-secure-password
   ADMIN_NAME=Admin User
   ADMIN_RFID=ADMIN001
   ```

2. **Frontend configuration (optional - `frontend/.env`):**
   ```env
   # Only needed if using Supabase Auth directly in frontend
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 5. Test the Setup

1. **Test database connection:**
   ```bash
   cd backend
   npm run create-admin
   ```
   
   You should see:
   ```
   ✅ Connected to Supabase successfully!
   🎉 Admin user created successfully!
   ```

2. **Start the application:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

3. **Verify login:**
   - Go to http://localhost:3000
   - Login with your admin credentials
   - Check that the dashboard loads correctly

## 6. Database Security (Production)

### Enable Row Level Security (RLS)

1. **Navigate to Authentication > Policies**

2. **Enable RLS on tables:**
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
   ```

3. **Create security policies:**

   **Users table policies:**
   ```sql
   -- Allow service role to do everything
   CREATE POLICY "Service role can manage all users" ON users
   FOR ALL USING (auth.role() = 'service_role');
   
   -- Users can view their own profile
   CREATE POLICY "Users can view own profile" ON users
   FOR SELECT USING (id = auth.uid());
   ```

   **Attendance table policies:**
   ```sql
   -- Allow service role to do everything
   CREATE POLICY "Service role can manage all attendance" ON attendance
   FOR ALL USING (auth.role() = 'service_role');
   
   -- Users can view their own attendance
   CREATE POLICY "Users can view own attendance" ON attendance
   FOR SELECT USING (user_id = auth.uid());
   ```

## 7. Backup and Monitoring

### Automatic Backups
- Supabase automatically creates daily backups for your project
- Pro plans include point-in-time recovery

### Monitoring
1. **Dashboard metrics:**
   - Go to "Reports" in your Supabase dashboard
   - Monitor database size, API requests, and performance

2. **Log monitoring:**
   - Go to "Logs" to view database and API logs
   - Set up log-based alerts if needed

### Performance Optimization

1. **Add indexes for common queries:**
   ```sql
   -- Index for frequent attendance queries
   CREATE INDEX idx_attendance_user_date ON attendance(user_id, date DESC);
   CREATE INDEX idx_attendance_date_sessions ON attendance(date) WHERE jsonb_array_length(sessions) > 0;
   
   -- Index for user searches
   CREATE INDEX idx_users_search ON users USING gin((name || ' ' || email));
   ```

2. **Enable query optimization:**
   ```sql
   -- Analyze tables for better query planning
   ANALYZE users;
   ANALYZE attendance;
   ```

## 8. Production Deployment

### Environment Variables for Production

```env
# Production Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key

# Production JWT Secret (generate a strong one)
JWT_SECRET=your-very-long-random-secret-key-for-production

# Production Admin
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=very-secure-production-password

# Email Configuration for Notifications
EMAIL_SERVICE=gmail
EMAIL_USER=notifications@yourcompany.com
EMAIL_PASS=your-app-password
ADMIN_EMAILS=admin1@company.com,admin2@company.com
```

### SSL/TLS Configuration

- Supabase handles SSL/TLS automatically
- All connections are encrypted by default
- No additional configuration needed

### Database Connection Limits

- Free tier: 60 concurrent connections
- Pro tier: 200+ concurrent connections
- Use connection pooling for high-traffic applications

## 9. Migration from MongoDB

If migrating from existing MongoDB data:

1. **Export MongoDB data:**
   ```bash
   mongoexport --db attendance --collection users --out users.json
   mongoexport --db attendance --collection attendances --out attendances.json
   ```

2. **Transform data format:**
   - Convert MongoDB ObjectIds to UUIDs
   - Transform nested objects to JSONB
   - Update field names (e.g., `rfidTag` → `rfid_tag`)

3. **Import to Supabase:**
   ```javascript
   // Example migration script
   const { createClient } = require('@supabase/supabase-js');
   const fs = require('fs');
   
   // Read and transform your JSON files
   const users = JSON.parse(fs.readFileSync('users.json'));
   const transformedUsers = users.map(user => ({
     name: user.name,
     email: user.email,
     rfid_tag: user.rfidTag,
     role: user.role,
     // ... other fields
   }));
   
   // Insert to Supabase
   await supabase.from('users').insert(transformedUsers);
   ```

## 10. Troubleshooting

### Common Issues

1. **"relation does not exist" error:**
   - Make sure you've run the schema.sql file
   - Check that you're using the correct database

2. **"insufficient privileges" error:**
   - Ensure you're using the service role key
   - Check that RLS policies allow the operation

3. **Connection timeout:**
   - Check your internet connection
   - Verify the Supabase URL is correct
   - Ensure your Supabase project is active

4. **High latency:**
   - Choose a Supabase region closer to your users
   - Optimize your queries with proper indexes
   - Consider using Supabase Edge Functions for complex operations

### Getting Help

- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Community**: [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)

## 11. Cost Optimization

### Free Tier Limits
- Database size: 500MB
- Monthly active users: 50,000
- API requests: 5,000,000/month
- Bandwidth: 5GB

### Pro Tier Benefits
- Unlimited database size
- 100,000 monthly active users
- 50,000,000 API requests/month
- 200GB bandwidth
- Point-in-time recovery
- Enhanced support

### Cost Management Tips
1. **Monitor usage:** Regular check via dashboard
2. **Optimize queries:** Reduce unnecessary API calls
3. **Clean old data:** Archive old attendance records
4. **Use indexes:** Improve query performance
5. **Set up alerts:** Get notified before hitting limits
