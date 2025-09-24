const express = require('express');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { authMiddleware, adminOrMentorMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
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
    return new Date(istTimestampWithTimezone);
  }
  
  console.log('IST timestamp with timezone storage:');
  console.log('  Input (IST):', timestamp);
  console.log('  With IST timezone:', istTimestampWithTimezone);
  console.log('  Stored in database as:', date.toISOString());
  console.log('  Will be stored as:', istTimestampWithTimezone);
  console.log(date);
  
  return date; 
}

// POST /attendance - Record attendance with entry/exit logic (multiple sessions support)
router.post('/', async (req, res) => {
  try {
    const { rfidTag, timestamp } = req.body;
    
    console.log('RFID Tag: ', rfidTag);
    
    // Parse timestamp as IST FIRST (firmware sends IST timestamps)
    const currentTime = parseISTTimestamp(timestamp);
    console.log('Parsed time for RFID', rfidTag, ':', currentTime.toISOString(), '(from', timestamp, ')');
    
    // Find user by RFID tag
    const user = await User.findByRfidTag(rfidTag);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is active
    if (user.status === 'inactive') {
      return res.status(403).json({ 
        error: 'User account is inactive. Attendance not recorded.',
        user: {
          id: user.id,
          name: user.name,
          status: user.status
        }
      });
    }
    
    const dateOnly = Attendance.getDateOnly(currentTime);
    
    // Check if attendance record exists for today
    const { data: existingAttendance, error: findError } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateOnly.toISOString().split('T')[0])
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    let attendance;
    
    if (!existingAttendance) {
      // No record exists - create new entry with first session
      const attendanceData = {
        user_id: user.id,
        date: dateOnly.toISOString().split('T')[0],
        sessions: [{
          entryTime: currentTime.toISOString(),
          exitTime: null,
          autoExitSet: false
        }],
        // Legacy fields for backward compatibility
        timestamp: currentTime.toISOString(),
        entry_time: currentTime.toISOString()
      };

      const { data: newAttendance, error: createError } = await supabase
        .from('attendance')
        .insert(attendanceData)
        .select()
        .single();

      if (createError) throw createError;
      
      return res.status(201).json({ 
        message: 'Entry time recorded successfully',
        type: 'entry',
        sessionNumber: 1,
        attendance: newAttendance,
        user: {
          id: user.id,
          name: user.name,
          role: user.role
        }
      });
    } else {
      // Record exists - check sessions
      attendance = new Attendance(existingAttendance);
      let sessions = attendance.sessions || [];
      
      if (sessions.length === 0) {
        // No sessions exist - create first session
        sessions.push({
          entryTime: currentTime.toISOString(),
          exitTime: null,
          autoExitSet: false
        });
        
        const updateData = {
          sessions: sessions,
          entry_time: currentTime.toISOString(),
          timestamp: currentTime.toISOString()
        };

        const { data: updatedAttendance, error: updateError } = await supabase
          .from('attendance')
          .update(updateData)
          .eq('id', attendance.id)
          .select()
          .single();

        if (updateError) throw updateError;
        
        return res.status(200).json({ 
          message: 'Entry time recorded successfully',
          type: 'entry',
          sessionNumber: 1,
          attendance: updatedAttendance,
          user: {
            id: user.id,
            name: user.name,
            role: user.role
          }
        });
      } else {
        // Sessions exist - check last session
        const lastSession = sessions[sessions.length - 1];
        
        if (lastSession.exitTime === null) {
          // Last session is open - record exit
          lastSession.exitTime = currentTime.toISOString();
          
          const updateData = {
            sessions: sessions,
            exit_time: currentTime.toISOString()
          };

          const { data: updatedAttendance, error: updateError } = await supabase
            .from('attendance')
            .update(updateData)
            .eq('id', attendance.id)
            .select()
            .single();

          if (updateError) throw updateError;
          
          return res.status(200).json({ 
            message: 'Exit time recorded successfully',
            type: 'exit',
            sessionNumber: sessions.length,
            attendance: updatedAttendance,
            user: {
              id: user.id,
              name: user.name,
              role: user.role
            }
          });
        } else {
          // All sessions are closed - create new session
          sessions.push({
            entryTime: currentTime.toISOString(),
            exitTime: null,
            autoExitSet: false
          });
          
          const updateData = {
            sessions: sessions,
            entry_time: currentTime.toISOString(), // Update legacy field to latest entry
            timestamp: currentTime.toISOString()
          };

          const { data: updatedAttendance, error: updateError } = await supabase
            .from('attendance')
            .update(updateData)
            .eq('id', attendance.id)
            .select()
            .single();

          if (updateError) throw updateError;
          
          return res.status(200).json({ 
            message: 'Entry time recorded successfully',
            type: 'entry',
            sessionNumber: sessions.length,
            attendance: updatedAttendance,
            user: {
              id: user.id,
              name: user.name,
              role: user.role
            }
          });
        }
      }
    }

  } catch (error) {
    console.error('Attendance recording error:', error);
    res.status(500).json({ error: 'Server error while recording attendance' });
  }
});

// POST /attendance/manual - Manual attendance recording (admin/mentor only)
router.post('/manual', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { userId, timestamp, type } = req.body; // type: 'entry' or 'exit'
    
    if (!userId || !type) {
      return res.status(400).json({ error: 'userId and type are required' });
    }
    
    if (!['entry', 'exit'].includes(type)) {
      return res.status(400).json({ error: 'Type must be entry or exit' });
    }

    // Parse timestamp
    const attendanceTime = parseISTTimestamp(timestamp);
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const dateOnly = Attendance.getDateOnly(attendanceTime);
    
    // Check if attendance record exists for the date
    const { data: existingAttendance, error: findError } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateOnly.toISOString().split('T')[0])
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    let attendance;
    let sessions = [];
    
    if (existingAttendance) {
      sessions = existingAttendance.sessions || [];
    }
    
    if (type === 'entry') {
      // Add new entry session
      sessions.push({
        entryTime: attendanceTime.toISOString(),
        exitTime: null,
        autoExitSet: false
      });
    } else if (type === 'exit') {
      // Find last open session and close it
      if (sessions.length === 0 || sessions[sessions.length - 1].exitTime !== null) {
        return res.status(400).json({ error: 'No open entry session found to record exit' });
      }
      
      sessions[sessions.length - 1].exitTime = attendanceTime.toISOString();
    }

    const attendanceData = {
      user_id: user.id,
      date: dateOnly.toISOString().split('T')[0],
      sessions: sessions,
      // Update legacy fields
      entry_time: sessions.length > 0 ? sessions[0].entryTime : null,
      exit_time: sessions.length > 0 && sessions[sessions.length - 1].exitTime ? sessions[sessions.length - 1].exitTime : null,
      timestamp: sessions.length > 0 ? sessions[0].entryTime : attendanceTime.toISOString()
    };

    let result;
    if (existingAttendance) {
      // Update existing record
      const { data, error } = await supabase
        .from('attendance')
        .update(attendanceData)
        .eq('id', existingAttendance.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceData)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    res.status(201).json({
      message: `Manual ${type} time recorded successfully`,
      type: type,
      attendance: result,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Manual attendance error:', error);
    res.status(500).json({ error: 'Server error while recording manual attendance' });
  }
});

// GET /attendance/today - Get today's attendance
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: attendanceRecords, error } = await supabase
      .from('attendance')
      .select(`
        *,
        users (
          id,
          name,
          email,
          role,
          rfid_tag
        )
      `)
      .eq('date', today)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate hours worked for each record
    const attendanceWithHours = attendanceRecords.map(record => {
      const hoursWorked = Attendance.calculateDailyHours(record.sessions);
      return {
        ...record,
        hoursWorked: Math.round(hoursWorked * 100) / 100 // Round to 2 decimal places
      };
    });

    res.json({
      date: today,
      attendance: attendanceWithHours,
      totalRecords: attendanceRecords.length
    });

  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ error: 'Server error while fetching today\'s attendance' });
  }
});

// GET /attendance/my - Get current user's attendance records
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    
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

    // Apply pagination
    const offset = (page - 1) * limit;
    const { data: records, error, count } = await query
      .order('date', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)
      .select('*', { count: 'exact' });

    if (error) throw error;

    // Calculate hours worked for each record
    const attendanceWithHours = records.map(record => {
      const hoursWorked = Attendance.calculateDailyHours(record.sessions);
      return {
        ...record,
        hoursWorked: Math.round(hoursWorked * 100) / 100
      };
    });

    res.json({
      attendance: attendanceWithHours,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ error: 'Server error while fetching attendance records' });
  }
});

// GET /attendance/history - Get attendance history (admin/mentor only)
router.get('/history', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { userId, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    let query = supabase
      .from('attendance')
      .select(`
        *,
        users (
          id,
          name,
          email,
          role,
          rfid_tag
        )
      `);

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    const { data: records, error, count } = await query
      .order('date', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)
      .select('*', { count: 'exact' });

    if (error) throw error;

    // Calculate hours worked for each record
    const attendanceWithHours = records.map(record => {
      const hoursWorked = Attendance.calculateDailyHours(record.sessions);
      return {
        ...record,
        hoursWorked: Math.round(hoursWorked * 100) / 100
      };
    });

    res.json({
      attendance: attendanceWithHours,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ error: 'Server error while fetching attendance history' });
  }
});

// GET /attendance/user/:userId - Get user attendance records
router.get('/user/:userId', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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

    // Apply pagination
    const offset = (page - 1) * limit;
    const { data: records, error, count } = await query
      .order('date', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)
      .select('*', { count: 'exact' });

    if (error) throw error;

    // Calculate hours worked for each record
    const attendanceWithHours = records.map(record => {
      const hoursWorked = Attendance.calculateDailyHours(record.sessions);
      return {
        ...record,
        hoursWorked: Math.round(hoursWorked * 100) / 100
      };
    });

    res.json({
      user: user.toJSON(),
      attendance: attendanceWithHours,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user attendance error:', error);
    
    if (error.message && error.message.includes('invalid input syntax for type uuid')) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    res.status(500).json({ error: 'Server error while fetching user attendance' });
  }
});

// GET /attendance/stats - Get attendance statistics
router.get('/stats', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's attendance count
    const { count: todayCount, error: todayError } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('date', today);

    if (todayError) throw todayError;

    // Build date filter for overall stats
    let query = supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true });

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    } else if (startDate) {
      query = query.gte('date', startDate);
    } else if (endDate) {
      query = query.lte('date', endDate);
    }

    const { count: totalRecords, error: totalError } = await query;
    if (totalError) throw totalError;

    // Get unique users count for the period
    let userQuery = supabase
      .from('attendance')
      .select('user_id', { count: 'exact' });

    if (startDate && endDate) {
      userQuery = userQuery.gte('date', startDate).lte('date', endDate);
    } else if (startDate) {
      userQuery = userQuery.gte('date', startDate);
    } else if (endDate) {
      userQuery = userQuery.lte('date', endDate);
    }

    const { data: userRecords, error: userError } = await userQuery;
    if (userError) throw userError;

    const uniqueUsers = new Set(userRecords.map(r => r.user_id)).size;

    // Get total active users
    const activeUsers = await User.findActive();

    const stats = {
      today: {
        attendanceRecords: todayCount,
        date: today
      },
      overall: {
        totalRecords: totalRecords,
        uniqueUsers: uniqueUsers,
        totalActiveUsers: activeUsers.length,
        attendanceRate: activeUsers.length > 0 ? Math.round((uniqueUsers / activeUsers.length) * 100) : 0
      },
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Now'
      }
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ error: 'Server error while fetching attendance statistics' });
  }
});

// DELETE /attendance/:id - Delete attendance record (admin/mentor only)
router.delete('/:id', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if record exists
    const { data: record, error: findError } = await supabase
      .from('attendance')
      .select('*')
      .eq('id', id)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Attendance record not found' });
      }
      throw findError;
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ message: 'Attendance record deleted successfully' });

  } catch (error) {
    console.error('Delete attendance error:', error);
    
    if (error.message && error.message.includes('invalid input syntax for type uuid')) {
      return res.status(400).json({ error: 'Invalid attendance ID format' });
    }
    
    res.status(500).json({ error: 'Server error while deleting attendance record' });
  }
});

// POST /attendance/auto-exit - Trigger auto-cleanup of incomplete sessions
router.post('/auto-exit', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const result = await Attendance.autoSetExitTimes();
    res.json(result);
  } catch (error) {
    console.error('Auto-exit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /attendance/check-low-attendance - Check for low attendance and send notifications
router.post('/check-low-attendance', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { date } = req.body; // Optional specific date
    const checkDate = date ? new Date(date) : null;
    
    const result = await Attendance.checkLowAttendanceAndNotify(checkDate);
    res.json(result);
  } catch (error) {
    console.error('Check low attendance error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
