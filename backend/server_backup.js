const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

// Import models  
const User = require('./models/User');
const Attendance = require('./models/Attendance');

// const app = express();
// const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance', {})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Use routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/attendance', attendanceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint with API information
app.get('/', (req, res) => {
  res.json({
    name: 'Attendee System API',
    version: '2.0.0',
    description: 'MVP Attendance System with Sessions Support',
    features: [
      'Multiple daily sessions per user',
      'RFID-based attendance tracking', 
      'JWT authentication',
      'Role-based access control',
      'Automatic session cleanup',
      'Email notifications',
      'Real-time attendance tracking'
    ],
    endpoints: {
      auth: {
        'POST /auth/login': 'User login',
        'POST /auth/register': 'User registration'
      },
      users: {
        'GET /users': 'List all users (admin/mentor)',
        'GET /users/me': 'Get current user info',
        'GET /users/:id': 'Get user by ID (admin/mentor)',
        'PUT /users/:id': 'Update user (admin/mentor)',
        'DELETE /users/:id': 'Delete user (admin)',
        'GET /users/stats/overview': 'Get user statistics overview',
        'GET /users/stats/summary': 'Get user statistics'
      },
      attendance: {
        'POST /attendance': 'Record attendance (RFID) - handles entry/exit logic',
        'POST /attendance/manual': 'Manual attendance recording (admin/mentor) - specify entry/exit',
        'GET /attendance/today': 'Get today\'s attendance with entry/exit times',
        'GET /attendance/my': 'Get current user\'s attendance records',
        'GET /attendance/history': 'Get attendance history (admin/mentor)',
        'GET /attendance/user/:userId': 'Get user attendance with entry/exit times',
        'GET /attendance/stats': 'Get attendance statistics',
        'DELETE /attendance/:id': 'Delete attendance record (admin/mentor)',
        'POST /attendance/auto-exit': 'Trigger automatic cleanup of incomplete sessions',
        'POST /attendance/check-low-attendance': 'Check for low attendance and send notifications'
      },
      legacy: {
        'GET /health': 'Health check',
        'GET /': 'API information'
      }
    },
    authentication: 'JWT Bearer token required for most endpoints'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation Error', details: errors });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ error: `Duplicate ${field}` });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API info: http://localhost:${PORT}/`);
  console.log(`🔐 Make sure to set JWT_SECRET in your .env file`);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Database connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/attendance', attendanceRoutes);

// Legacy routes (for backward compatibility)
// These are now handled by the attendanceRoutes, but we keep them here for reference

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Attendee API',
    version: '2.0.0',
    description: 'Enhanced attendance system with user management and JWT authentication',
    endpoints: {
      auth: {
        'POST /auth/register': 'Register new user (admin only)',
        'POST /auth/login': 'User login',
        'GET /auth/me': 'Get current user info',
        'POST /auth/change-password': 'Change password',
        'POST /auth/logout': 'Logout'
      },
      users: {
        'GET /users': 'List all users (admin only)',
        'GET /users/:id': 'Get single user',
        'POST /users': 'Create user (admin only)',
        'PUT /users/:id': 'Update user (admin only)',
        'DELETE /users/:id': 'Delete user (admin only)',
        'PUT /users/:id/status': 'Toggle user status (admin only)',
        'GET /users/stats/summary': 'Get user statistics'
      },
      attendance: {
        'POST /attendance': 'Record attendance (RFID) - handles entry/exit logic',
        'POST /attendance/manual': 'Manual attendance recording (admin/mentor) - specify entry/exit',
        'GET /attendance/today': 'Get today\'s attendance with entry/exit times',
        'GET /attendance/my': 'Get current user\'s attendance records',
        'GET /attendance/history': 'Get attendance history (admin/mentor)',
        'GET /attendance/user/:userId': 'Get user attendance with entry/exit times',
        'GET /attendance/stats': 'Get attendance statistics',
        'DELETE /attendance/:id': 'Delete attendance record (admin/mentor)'
      },
      legacy: {
        'GET /health': 'Health check',
        'GET /': 'API information'
      }
    },
    authentication: 'JWT Bearer token required for most endpoints'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation Error', details: errors });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ error: `Duplicate ${field}` });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API info: http://localhost:${PORT}/`);
  console.log(`🔐 Make sure to set JWT_SECRET in your .env file`);
});

// Schedule auto-cleanup task to run every day at 10:00 PM
cron.schedule('0 22 * * *', async () => {
  console.log('� Running scheduled auto-cleanup task at 10:00 PM...');
  try {
    const result = await Attendance.autoSetExitTimes();
    console.log('✅ Auto-cleanup completed:', result.message);
  } catch (error) {
    console.error('❌ Auto-cleanup failed:', error.message);
  }
}, {
  timezone: 'Asia/Kolkata'
});

console.log('⏰ Auto-exit scheduler set for 9:00 PM IST daily');

module.exports = app;