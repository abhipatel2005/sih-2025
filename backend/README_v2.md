# 🚀 Attendee Backend v2.0 - Enhanced Attendance System

Enhanced Node.js + Express + MongoDB backend with **User Management** and **JWT Authentication** while maintaining full backward compatibility with existing attendance endpoints.

## 🆕 What's New in v2.0

### ✅ **User Management & Authentication**
- JWT-based authentication system
- Role-based access control (admin, mentor, member)
- User status management (active/inactive)
- Secure password hashing with bcrypt

### ✅ **Enhanced Features**
- Extended User model with email, phone, role, status
- Admin-only user management endpoints
- Attendance filtering by user status
- Comprehensive API documentation
- Health checks and error handling

### ✅ **Backward Compatibility**
- All existing endpoints work unchanged
- RFID attendance recording preserved
- WhatsApp bot integration maintained

## 📋 Requirements

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Environment variables configured

## 🛠️ Installation & Setup

### 1. **Install Dependencies**
```bash
npm install bcrypt jsonwebtoken
```

### 2. **Environment Configuration**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MONGODB_URI=mongodb://localhost:27017/attendance_system
```

### 3. **Database Setup**
```bash
# Create admin user
npm run create-admin

# Seed sample data (optional)
npm run seed

# Or do both at once
npm run setup
```

### 4. **Run the Server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔐 Authentication Flow

### 1. **Admin Login**
```bash
POST /auth/login
{
  "email": "admin@launchlog.com",
  "password": "admin123456"
}
```

### 2. **Create Users**
```bash
POST /users
Authorization: Bearer <admin-token>
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "rfidTag": "04A1B2C3",
  "role": "member"
}
```

### 3. **Record Attendance**
```bash
# No authentication required (RFID-based)
POST /attendance
{
  "rfidTag": "04A1B2C3",
  "timestamp": "2025-08-15 09:30:00"
}
```

## 🏗️ API Endpoints

### 🔐 **Authentication** (`/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| `POST` | `/auth/register` | Register new user | Admin only |
| `POST` | `/auth/login` | User login | Public |
| `GET` | `/auth/me` | Get current user info | Authenticated |
| `POST` | `/auth/change-password` | Change password | Authenticated |
| `POST` | `/auth/logout` | Logout | Authenticated |

### 👥 **User Management** (`/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| `GET` | `/users` | List all users | Admin only |
| `GET` | `/users/:id` | Get single user | Owner/Admin |
| `POST` | `/users` | Create user | Admin only |
| `PUT` | `/users/:id` | Update user | Admin only |
| `DELETE` | `/users/:id` | Delete user | Admin only |
| `PUT` | `/users/:id/status` | Toggle user status | Admin only |
| `GET` | `/users/stats/summary` | User statistics | Admin/Mentor |

### 📋 **Attendance** (`/attendance`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| `POST` | `/attendance` | Record attendance (RFID) | Public |
| `GET` | `/attendance/today` | Get today's attendance | Public |
| `GET` | `/attendance/history` | Get attendance history | Admin/Mentor |
| `GET` | `/attendance/user/:id` | Get user attendance | Owner/Admin/Mentor |
| `GET` | `/attendance/stats` | Attendance statistics | Admin/Mentor |
| `DELETE` | `/attendance/:id` | Delete attendance record | Admin/Mentor |

## 🔒 User Roles & Permissions

### **Admin** 🛡️
- Full system access
- Create, read, update, delete users
- Access all attendance data
- Manage user status and roles

### **Mentor** 👨‍🏫
- View all attendance data
- Access attendance statistics
- View user information
- Cannot modify users

### **Member** 👤
- View own profile
- View own attendance
- Change own password
- Record attendance via RFID

## 📊 Data Models

### **User Model**
```javascript
{
  name: String,           // Required
  rfidTag: String,        // Required, unique
  email: String,          // Required, unique
  password: String,       // Required, hashed
  role: String,           // "member" | "admin" | "mentor"
  status: String,         // "active" | "inactive"
  phone: String,          // Optional
  createdAt: Date,        // Auto-generated
  updatedAt: Date         // Auto-generated
}
```

### **Attendance Model**
```javascript
{
  userId: ObjectId,       // Reference to User
  timestamp: Date,        // When attendance was recorded
  createdAt: Date,        // Auto-generated
  updatedAt: Date         // Auto-generated
}
```

## 🔧 Key Features

### **Enhanced Attendance Logic**
- ✅ **Status Check**: Only active users can record attendance
- ✅ **Role Integration**: Attendance data includes user roles
- ✅ **Filtering**: Inactive users filtered from public views
- ✅ **Backward Compatibility**: Existing RFID endpoints unchanged

### **Security Features**
- 🔐 **JWT Authentication**: Secure token-based auth
- 🔒 **Password Hashing**: bcrypt with 12 rounds
- 🛡️ **Role-based Access**: Granular permission control
- 🚫 **Input Validation**: Comprehensive request validation

### **Admin Features**
- 👥 **User Management**: Full CRUD operations
- 📊 **Statistics**: User and attendance analytics
- 🔍 **Search & Filter**: Advanced user/attendance queries
- 📱 **Status Management**: Activate/deactivate users

## 🧪 Testing the API

### **1. Health Check**
```bash
curl http://localhost:3000/health
```

### **2. Admin Login**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@launchlog.com","password":"admin123456"}'
```

### **3. Create User (with admin token)**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "rfidTag": "TEST001",
    "role": "member"
  }'
```

### **4. Record Attendance**
```bash
curl -X POST http://localhost:3000/attendance \
  -H "Content-Type: application/json" \
  -d '{"rfidTag":"TEST001"}'
```

### **5. Get Today's Attendance**
```bash
curl http://localhost:3000/attendance/today
```

## 🔄 Migration from v1.0

The upgrade is **fully backward compatible**:

### ✅ **What Still Works**
- All existing RFID attendance endpoints
- WhatsApp bot integration
- Frontend attendance display
- Database structure (with extensions)

### 🆕 **What's Added**
- User authentication and management
- Role-based access control
- Enhanced attendance features
- Admin dashboard capabilities

### 📝 **Migration Steps**
1. Install new dependencies: `npm install bcrypt jsonwebtoken`
2. Update `.env` with JWT configuration
3. Run `npm run create-admin` to create admin user
4. Start using new authentication features
5. Existing users continue working via RFID

## 🐛 Troubleshooting

### **JWT Secret Missing**
```bash
# Add to .env file
JWT_SECRET=your-super-secret-jwt-key-here
```

### **Admin User Issues**
```bash
# Recreate admin user
npm run create-admin
```

### **Database Connection**
```bash
# Check MongoDB is running
mongod

# Test connection
curl http://localhost:3000/health
```

### **Permission Errors**
- Ensure proper JWT token in Authorization header
- Check user role has required permissions
- Verify token hasn't expired

## 📈 Performance & Security

### **Security Best Practices**
- 🔐 Strong JWT secrets (min 32 characters)
- 🔒 Password complexity requirements
- 🛡️ Rate limiting on auth endpoints
- 🚫 Input sanitization and validation

### **Performance Optimizations**
- 📊 Database indexes on commonly queried fields
- 🔄 Efficient pagination for large datasets
- ⚡ Optimized aggregation pipelines
- 📱 Response compression

## 🚀 Deployment

### **Environment Variables**
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-production-secret
PORT=3000
```

### **Production Checklist**
- [ ] Change default admin password
- [ ] Set strong JWT secret
- [ ] Configure HTTPS
- [ ] Set up monitoring
- [ ] Enable rate limiting
- [ ] Configure CORS properly

## 📞 Support

### **Common Issues**
1. **Authentication fails**: Check JWT_SECRET and token format
2. **Attendance not recording**: Verify user status is active
3. **Permission denied**: Ensure correct user role
4. **Database errors**: Check MongoDB connection

### **API Documentation**
- Health check: `GET /health`
- API info: `GET /`
- Full endpoint list with examples

---

**🎉 Your Attendee backend is now ready with full user management and authentication!**
