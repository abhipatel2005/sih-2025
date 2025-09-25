# Schema Update Summary

## Changes Made to Align with New Database Schema

### 1. Database Schema (schema.sql)
The new schema includes:
- **Users table**: Now includes school-specific fields like `category`, `gender`, `std`, `dob`, `address`, `blood_group`, `aadhar_id`, `school_id`
- **Attendance table**: Simplified to just `user_id`, `date`, `timestamp` (removed complex sessions)
- **Schools table**: New table for school management with `school_id`, `name`, `district`, `state`
- **Roles**: Changed from `['member', 'admin', 'mentor']` to `['student', 'teacher', 'principal', 'admin']`
- **Status**: Allows `['present', 'absent', 'late', '']`

### 2. Updated Models

#### User Model (`/models/User.js`)
- **Updated fields**: Added support for all new schema fields
- **Save method**: Now handles `category`, `gender`, `std`, `dob`, `address`, `blood_group`, `aadhar_id`, `school_id`
- **Added method**: `User.updateStatus()` for updating user attendance status
- **Removed fields**: `skills`, `bio`, `joined_date` (not in new schema)

#### Attendance Model (`/models/Attendance.js`)
- **Simplified**: Removed complex session handling
- **Core fields**: Only `user_id`, `date`, `timestamp`
- **Removed**: `sessions`, `entry_time`, `exit_time` arrays

### 3. Updated Routes

#### Auth Routes (`/routes/authRoutes.js`)
- **Registration**: Now requires `school_id` as mandatory field
- **New fields**: Accepts all new user fields (category, gender, std, etc.)
- **Role validation**: Updated to accept new role values
- **Default status**: Set to empty string `''` to match schema constraint

#### User Routes (`/routes/userRoutes.js`)
- **User creation**: Updated to handle new schema fields
- **Profile updates**: Added support for new personal information fields
- **Role validation**: Updated for new role system
- **Required fields**: Added `school_id` as mandatory

#### Attendance Routes (`/routes/attendanceRoutes_updated.js`)
- **Simplified attendance**: Removed entry/exit logic, now just records attendance
- **Status update**: Automatically sets user status to 'present' when attendance is recorded
- **Manual attendance**: Allows admin/teachers to manually add attendance records
- **Statistics**: Updated to work with new schema relationships
- **School filtering**: Added support for filtering by school

#### New School Routes (`/routes/schoolRoutes.js`)
- **CRUD operations**: Full create, read, update, delete for schools
- **School statistics**: Get attendance stats for specific schools
- **User management**: Prevents deletion of schools with existing users
- **Search functionality**: Search schools by name, district, or state

### 4. Updated Server (`server.js`)
- **New route**: Added `/schools` endpoint
- **Updated imports**: Now uses `attendanceRoutes_updated.js`

### 5. Data Insertion Script (`insert-dummy-data.js`)
- **Schema compliance**: All user records now include proper status field
- **School integration**: Users are properly linked to schools
- **Realistic data**: Generates appropriate data for Indian schools
- **Attendance records**: Creates simple attendance records without complex sessions

## API Endpoints

### Schools
- `GET /schools` - List all schools (with pagination and search)
- `GET /schools/:id` - Get specific school
- `POST /schools` - Create new school (admin only)
- `PUT /schools/:id` - Update school (admin only)  
- `DELETE /schools/:id` - Delete school (admin only)
- `GET /schools/:id/stats` - Get school attendance statistics

### Users
- Updated user creation to require school_id
- Profile updates now support personal information fields
- Role system updated for education context

### Attendance
- Simplified attendance recording
- Manual attendance entry for admins/teachers
- Statistics with school and role filtering
- Automatic status updates

### Authentication
- Registration updated for new schema
- All new user fields supported

## Breaking Changes
1. **Role values**: Changed from business context to education context
2. **Required field**: `school_id` now mandatory for all users
3. **Status constraint**: Must be one of `['present', 'absent', 'late', '']`
4. **Attendance structure**: Simplified from sessions to single records
5. **New endpoints**: `/schools` routes added

## Migration Notes
- Existing data will need to be migrated to include school references
- User roles will need to be mapped from old system to new education roles  
- Attendance records may need restructuring if using old session format
- Status field must comply with new constraints

## Testing
Run the dummy data script to populate the database with realistic test data:
```bash
npm run seed-dummy
```

This will create:
- 10 schools across different Indian states
- 1,110 users per school (100 students + 10 teachers + 1 principal)
- 1 week of attendance data for all users
