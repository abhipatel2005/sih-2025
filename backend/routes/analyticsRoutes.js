const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

const router = express.Router();

// GET /analytics/overview - Get analytics overview data (admin only)
router.get('/overview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Fetch users data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, rfid_tag, role, status, email, phone, profile_picture, joined_date, skills, bio, created_at');

    if (usersError) {
      console.error('Users fetch error:', usersError);
      return res.status(400).json({ 
        success: false, 
        message: 'Error fetching users data',
        error: usersError 
      });
    }

    // Fetch schools data
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name, address, district, type, status, principal_name, contact_email, total_students, total_teachers, established_year, created_at');

    if (schoolsError) {
      console.error('Schools fetch error:', schoolsError);
      // Don't fail if schools table doesn't exist, just return empty array
    }

    // Fetch attendance data
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('id, user_id, date, timestamp, created_at');

    if (attendanceError) {
      console.error('Attendance fetch error:', attendanceError);
      return res.status(400).json({ 
        success: false, 
        message: 'Error fetching attendance data',
        error: attendanceError 
      });
    }

    // Calculate basic stats
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(record => record.date === today);
    const activeUsers = users.filter(user => user.status === 'active');

    const stats = {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      totalSchools: schools ? schools.length : 0,
      todayAttendance: todayAttendance.length,
      totalAttendanceRecords: attendance.length,
      avgAttendanceRate: users.length > 0 ? ((todayAttendance.length / users.length) * 100).toFixed(1) : 0
    };

    // Group users by role
    const usersByRole = users.reduce((acc, user) => {
      const role = user.role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    // Group schools by district (if schools data exists)
    const schoolsByDistrict = schools ? schools.reduce((acc, school) => {
      const district = school.district || 'unknown';
      acc[district] = (acc[district] || 0) + 1;
      return acc;
    }, {}) : {};

    res.json({
      success: true,
      data: {
        stats,
        usersByRole,
        schoolsByDistrict,
        rawData: {
          users: users || [],
          schools: schools || [],
          attendance: attendance || []
        }
      }
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /analytics/users - Get user analytics (admin only)
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role, status } = req.query;
    
    let query = supabase
      .from('users')
      .select('id, name, role, status, created_at, joined_date');
    
    if (role) query = query.eq('role', role);
    if (status) query = query.eq('status', status);
    
    const { data: users, error } = await query;
    
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Error fetching user analytics',
        error 
      });
    }

    // Group by role and status
    const analytics = {
      byRole: users.reduce((acc, user) => {
        const role = user.role || 'unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {}),
      byStatus: users.reduce((acc, user) => {
        const status = user.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      total: users.length
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;