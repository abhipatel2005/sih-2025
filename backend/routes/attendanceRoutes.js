const express = require('express');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { authMiddleware, adminOrMentorMiddleware, teacherOnlyMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

const router = express.Router();

// Helper function to parse IST timestamps from firmware and store with IST timezone
function parseISTTimestamp(timestamp) {
  if (!timestamp) {
    // If no timestamp provided, use current IST time with timezone
    const now = new Date();
    const istTimestamp = now.toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}) + '+05:30';
    return new Date(istTimestamp);
  }
  
  // Firmware sends timestamp in format: "2025-08-19T10:26:00" (IST)
  // We want to store this as "2025-08-19T10:26:00+05:30" in the database
  
  const istTimestampWithTimezone = timestamp + '+05:30';
  const date = new Date(istTimestampWithTimezone);
  
  // Verify the date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid timestamp received:', timestamp, 'using current time');
    const now = new Date();
    const istTimestamp = now.toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}) + '+05:30';
    return new Date(istTimestamp);
  }
  
  console.log('IST timestamp with timezone storage:');
  console.log('  Input (IST):', timestamp);
  console.log('  With IST timezone:', istTimestampWithTimezone);
  console.log('  Stored in database as:', date.toISOString());
  console.log('  Will be stored as:', istTimestampWithTimezone);
  console.log(date);
  
  return date; 
}

// Helper function to get date only for grouping
function getDateOnly(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// POST /attendance - Record attendance
router.post('/', async (req, res) => {
  try {
    const { rfidTag, timestamp } = req.body;
    
    console.log('RFID Tag: ', rfidTag);
    
    // Parse timestamp as IST FIRST (firmware sends IST timestamps)
    const currentTime = parseISTTimestamp(timestamp);
    const currentDate = getDateOnly(currentTime);
    
    // Find user by RFID tag
    const user = await User.findByRfidTag(rfidTag);
    if (!user) {
      return res.status(404).json({ error: 'User not found with this RFID tag' });
    }

    console.log('User found:', user.name);

    // Create attendance record with status
    const attendance = new Attendance({
      user_id: user.id,
      date: currentDate,
      timestamp: currentTime,
      status: 'present' // Default to present for RFID-based attendance
    });

    await attendance.save();

    // Update user status to present
    const { error: updateError } = await supabase
      .from('users')
      .update({ status: 'present' })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user status:', updateError);
    }

    console.log('Attendance recorded:', {
      user: user.name,
      date: currentDate,
      timestamp: currentTime.toISOString()
    });

    res.json({
      success: true,
      message: `Attendance recorded for ${user.name}`,
      data: {
        user: {
          name: user.name,
          role: user.role,
          rfid_tag: user.rfid_tag
        },
        attendance: {
          date: currentDate,
          timestamp: currentTime.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Attendance recording error:', error);
    res.status(500).json({ 
      error: 'Failed to record attendance',
      details: error.message 
    });
  }
});

// GET /attendance - Get attendance records with filtering
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      startDate, 
      endDate, 
      userId, 
      schoolId,
      role
    } = req.query;

    // For teachers and principals, automatically filter by their school
    let filterSchoolId = schoolId;
    if (req.user.role === 'teacher' || req.user.role === 'principal') {
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('school_id')
        .eq('id', req.user.id)
        .single();
      
      if (userError || !currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      filterSchoolId = currentUser.school_id;
    }

    let query = supabase
      .from('attendance')
      .select(`
        id,
        date,
        timestamp,
        status,
        users (
          id,
          name,
          role,
          rfid_tag,
          email,
          std,
          school_id,
          schools (
            name,
            district,
            state
          )
        )
      `);

    // Apply filters
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get attendance records with pagination
    const { data: attendance, error: attendanceError, count } = await query
      .order('timestamp', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)
      .select('*', { count: 'exact' });

    if (attendanceError) throw attendanceError;

    // Filter by school or role if specified
    let filteredAttendance = attendance;
    if (filterSchoolId || role) {
      filteredAttendance = attendance.filter(record => {
        const user = record.users;
        if (filterSchoolId && user.school_id !== filterSchoolId) return false;
        if (role && user.role !== role) return false;
        return true;
      });
    }

    res.json({
      attendance: filteredAttendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / limit),
        totalRecords: count || 0,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Server error while fetching attendance records' });
  }
});

// GET /attendance/stats - Get attendance statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, schoolId, role } = req.query;

    // For teachers and principals, automatically filter by their school
    let filterSchoolId = schoolId;
    if (req.user.role === 'teacher' || req.user.role === 'principal') {
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('school_id')
        .eq('id', req.user.id)
        .single();
      
      if (userError || !currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      filterSchoolId = currentUser.school_id;
    }

    let attendanceQuery = supabase
      .from('attendance')
      .select(`
        id,
        date,
        users (
          id,
          role,
          school_id,
          schools (
            name
          )
        )
      `);

    let usersQuery = supabase
      .from('users')
      .select('id, role, school_id');

    // Apply date filters
    if (startDate) {
      attendanceQuery = attendanceQuery.gte('date', startDate);
    }
    if (endDate) {
      attendanceQuery = attendanceQuery.lte('date', endDate);
    }

    // Apply school/role filters
    if (filterSchoolId) {
      usersQuery = usersQuery.eq('school_id', filterSchoolId);
    }
    if (role) {
      usersQuery = usersQuery.eq('role', role);
    }

    const { data: attendanceRecords, error: attendanceError } = await attendanceQuery;
    const { data: allUsers, error: usersError } = await usersQuery;

    if (attendanceError) throw attendanceError;
    if (usersError) throw usersError;

    // Filter attendance records by school/role if needed
    let filteredAttendance = attendanceRecords;
    if (filterSchoolId || role) {
      filteredAttendance = attendanceRecords.filter(record => {
        const user = record.users;
        if (filterSchoolId && user.school_id !== filterSchoolId) return false;
        if (role && user.role !== role) return false;
        return true;
      });
    }

    // Calculate statistics
    const totalUsers = allUsers.length;
    const totalAttendanceRecords = filteredAttendance.length;
    const uniqueUsersPresent = [...new Set(filteredAttendance.map(record => record.users.id))].length;
    const attendanceRate = totalUsers > 0 ? ((uniqueUsersPresent / totalUsers) * 100).toFixed(2) : 0;

    // Group by role
    const statsByRole = {};
    ['student', 'teacher', 'principal'].forEach(userRole => {
      const roleUsers = allUsers.filter(user => user.role === userRole);
      const roleAttendance = filteredAttendance.filter(record => record.users.role === userRole);
      const uniqueRoleUsersPresent = [...new Set(roleAttendance.map(record => record.users.id))].length;
      
      statsByRole[userRole] = {
        totalUsers: roleUsers.length,
        presentUsers: uniqueRoleUsersPresent,
        attendanceRate: roleUsers.length > 0 ? ((uniqueRoleUsersPresent / roleUsers.length) * 100).toFixed(2) : 0,
        totalRecords: roleAttendance.length
      };
    });

    res.json({
      overall: {
        totalUsers,
        presentUsers: uniqueUsersPresent,
        absentUsers: totalUsers - uniqueUsersPresent,
        attendanceRate: parseFloat(attendanceRate),
        totalAttendanceRecords
      },
      byRole: statsByRole,
      dateRange: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time'
      }
    });

  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ error: 'Server error while calculating attendance statistics' });
  }
});

// POST /attendance/manual - Manual attendance entry (teacher only)
router.post('/manual', authMiddleware, teacherOnlyMiddleware, async (req, res) => {
  try {
    const { userId, date, timestamp, status = 'present' } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ error: 'userId and date are required' });
    }

    // Validate status
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: present, absent, late, excused' });
    }

    // Find user and verify they're in the same school as the teacher
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, school_id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the current teacher's school_id
    const currentUserId = req.user.id;
    const { data: currentUser, error: teacherError } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', currentUserId)
      .single();
    
    if (teacherError || !currentUser) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Verify the student belongs to the same school as the teacher
    if (userData.school_id !== currentUser.school_id) {
      return res.status(403).json({ error: 'You can only manage attendance for students in your school' });
    }

    // Use provided timestamp or create one for the date
    let attendanceTimestamp;
    if (timestamp) {
      attendanceTimestamp = new Date(timestamp);
    } else {
      // Create timestamp for 9:00 AM on the given date
      attendanceTimestamp = new Date(`${date}T09:00:00+05:30`);
    }

    // Check if attendance already exists for this user on this date
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (existingAttendance) {
      return res.status(400).json({ error: 'Attendance already recorded for this user on this date' });
    }

    // Create attendance record with status
    const attendance = new Attendance({
      user_id: userId,
      date: date,
      timestamp: attendanceTimestamp,
      status: status
    });

    await attendance.save();

    res.json({
      success: true,
      message: `Manual attendance recorded for ${userData.name}`,
      data: {
        user: userData,
        attendance: {
          date: date,
          timestamp: attendanceTimestamp.toISOString(),
          status: status
        }
      }
    });

  } catch (error) {
    console.error('Manual attendance error:', error);
    res.status(500).json({ 
      error: 'Failed to record manual attendance',
      details: error.message 
    });
  }
});

// DELETE /attendance/:id - Delete attendance record (admin only)
router.delete('/:id', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });

  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ 
      error: 'Failed to delete attendance record',
      details: error.message 
    });
  }
});

// GET /attendance/my - Get current user's attendance records
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { 
      limit = 50, 
      startDate, 
      endDate 
    } = req.query;

    let query = supabase
      .from('attendance')
      .select('*')
      .eq('user_id', req.user.id);

    // Apply date filters
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Order by date descending and limit results
    const { data: attendanceRecords, error } = await query
      .order('date', { ascending: false })
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({
      attendance: attendanceRecords,
      count: attendanceRecords.length
    });

  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch attendance records',
      details: error.message 
    });
  }
});

// GET /attendance/history - Get attendance history (admin/mentor only)
router.get('/history', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      startDate, 
      endDate, 
      userId,
      schoolId
    } = req.query;

    let query = supabase
      .from('attendance')
      .select(`
        *,
        users (
          id,
          name,
          role,
          rfid_tag,
          email,
          std,
          school_id,
          schools (
            name,
            district,
            state
          )
        )
      `);

    // For teachers and principals, automatically filter by their school
    let filterSchoolId = schoolId;
    if (req.user.role === 'teacher' || req.user.role === 'principal') {
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('school_id')
        .eq('id', req.user.id)
        .single();
      
      if (userError || !currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      filterSchoolId = currentUser.school_id;
    }

    // Apply filters
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get records with pagination
    const { data: attendanceRecords, error, count } = await query
      .order('date', { ascending: false })
      .order('timestamp', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)
      .select('*', { count: 'exact' });

    if (error) throw error;

    // Filter by school if needed (for teachers/principals)
    let filteredAttendance = attendanceRecords;
    if (filterSchoolId) {
      filteredAttendance = attendanceRecords.filter(record => 
        record.users && record.users.school_id === filterSchoolId
      );
    }

    res.json({
      attendance: filteredAttendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / limit),
        totalRecords: count || 0,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch attendance history',
      details: error.message 
    });
  }
});

// GET /attendance/user/:userId - Get attendance for specific user (admin/mentor only)
router.get('/user/:userId', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      limit = 50, 
      startDate, 
      endDate 
    } = req.query;

    // First verify user exists 
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, school_id, role')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For teachers and principals, verify school access permissions
    if (req.user.role === 'teacher' || req.user.role === 'principal') {
      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('school_id')
        .eq('id', req.user.id)
        .single();
      
      if (currentUserError || !currentUser) {
        return res.status(404).json({ error: 'Current user not found' });
      }
      
      if (currentUser.school_id !== userData.school_id) {
        return res.status(403).json({ error: 'Access denied: You can only view attendance for users in your school' });
      }
    }

    let query = supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId);

    // Apply date filters
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Order by date descending and limit results
    const { data: attendanceRecords, error } = await query
      .order('date', { ascending: false })
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({
      attendance: attendanceRecords,
      user: userData,
      count: attendanceRecords.length
    });

  } catch (error) {
    console.error('Get user attendance error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user attendance',
      details: error.message 
    });
  }
});

module.exports = router;
