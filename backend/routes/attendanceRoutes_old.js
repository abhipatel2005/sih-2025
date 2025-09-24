const express = require('express');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { authMiddleware, adminOrMentorMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

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
  console.log(date)
  
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
    const user = await User.findOne({ rfidTag });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is active
    if (user.status === 'inactive') {
      return res.status(403).json({ 
        error: 'User account is inactive. Attendance not recorded.',
        user: {
          id: user._id,
          name: user.name,
          status: user.status
        }
      });
    }
    
    const dateOnly = Attendance.getDateOnly(currentTime);
    
    // Check if attendance record exists for today
    let attendance = await Attendance.findOne({
      user: user._id,
      date: dateOnly
    });
    
    if (!attendance) {
      // No record exists - create new entry with first session
      attendance = new Attendance({
        user: user._id,
        date: dateOnly,
        sessions: [{
          entryTime: currentTime,
          exitTime: null,
          autoExitSet: false
        }],
        // Legacy fields for backward compatibility
        userId: user._id,
        timestamp: currentTime,
        entryTime: currentTime
      });
      
      await attendance.save();
      
      return res.status(201).json({ 
        message: 'Entry time recorded successfully',
        type: 'entry',
        sessionNumber: 1,
        attendance: {
          id: attendance._id,
          userId: user._id,
          userName: user.name,
          userRole: user.role,
          date: dateOnly,
          sessions: attendance.sessions,
          currentSession: attendance.sessions[0]
        }
      });
    } 
    else {
      // Record exists - check last session
      const lastSession = attendance.sessions[attendance.sessions.length - 1];
      
      if (!lastSession.exitTime) {
        // Last session has no exit - record exit
        lastSession.exitTime = currentTime;
        lastSession.autoExitSet = false; // Manual exit
        await attendance.save();
        
        return res.status(200).json({ 
          message: 'Exit time recorded successfully',
          type: 'exit',
          sessionNumber: attendance.sessions.length,
          attendance: {
            id: attendance._id,
            userId: user._id,
            userName: user.name,
            userRole: user.role,
            date: dateOnly,
            sessions: attendance.sessions,
            currentSession: lastSession
          }
        });
      } else {
        // Last session is complete - start new session
        const newSession = {
          entryTime: currentTime,
          exitTime: null,
          autoExitSet: false
        };
        attendance.sessions.push(newSession);
        await attendance.save();
        
        return res.status(201).json({ 
          message: 'New entry session started',
          type: 'entry',
          sessionNumber: attendance.sessions.length,
          attendance: {
            id: attendance._id,
            userId: user._id,
            userName: user.name,
            userRole: user.role,
            date: dateOnly,
            sessions: attendance.sessions,
            currentSession: newSession
          }
        });
      }
    }
    
  } catch (error) {
    console.error('Attendance recording error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /attendance/manual - Manual attendance recording with session support
router.post('/manual', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { userId, timestamp, type } = req.body;
    
    // Validate inputs
    if (!userId || !timestamp || !type) {
      return res.status(400).json({ error: 'userId, timestamp, and type are required' });
    }

    if (!['entry', 'exit'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "entry" or "exit"' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is active
    if (user.status === 'inactive') {
      return res.status(403).json({ 
        error: 'User account is inactive. Attendance not recorded.',
        user: {
          id: user._id,
          name: user.name,
          status: user.status
        }
      });
    }
    
    const recordTime = parseISTTimestamp(timestamp);
    const dateOnly = Attendance.getDateOnly(recordTime);
    
    // Find or create attendance record for this date
    let attendance = await Attendance.findOne({
      user: userId,
      date: dateOnly
    });
    
    if (!attendance) {
      if (type === 'exit') {
        return res.status(400).json({ 
          error: 'Cannot record exit time without entry time',
          type: 'validation_error'
        });
      }
      
      // Create new attendance record with first session
      attendance = new Attendance({
        user: userId,
        date: dateOnly,
        sessions: [{
          entryTime: recordTime,
          exitTime: null,
          autoExitSet: false
        }],
        // Legacy fields for backward compatibility
        userId: userId,
        timestamp: recordTime,
        entryTime: recordTime
      });
      
      await attendance.save();
      
      return res.status(201).json({
        message: 'Entry time recorded successfully',
        type: 'entry',
        sessionNumber: 1,
        attendance: {
          id: attendance._id,
          userId: user._id,
          userName: user.name,
          userRole: user.role,
          date: dateOnly,
          sessions: attendance.sessions,
          currentSession: attendance.sessions[0]
        }
      });
    } else {
      // Handle existing record with session logic
      if (type === 'entry') {
        // Check if last session is complete
        const lastSession = attendance.sessions[attendance.sessions.length - 1];
        
        if (!lastSession.exitTime) {
          return res.status(400).json({ 
            error: 'Cannot add new entry session. Previous session is still active (no exit time recorded).',
            type: 'active_session_exists',
            attendance: {
              id: attendance._id,
              sessions: attendance.sessions,
              activeSession: lastSession
            }
          });
        }
        
        // Add new session
        const newSession = {
          entryTime: recordTime,
          exitTime: null,
          autoExitSet: false
        };
        attendance.sessions.push(newSession);
        await attendance.save();
        
        return res.status(201).json({
          message: 'New entry session started',
          type: 'entry',
          sessionNumber: attendance.sessions.length,
          attendance: {
            id: attendance._id,
            userId: user._id,
            userName: user.name,
            userRole: user.role,
            date: dateOnly,
            sessions: attendance.sessions,
            currentSession: newSession
          }
        });
        
      } else if (type === 'exit') {
        // Find the last session without exit time
        const lastSession = attendance.sessions[attendance.sessions.length - 1];
        
        if (!lastSession || lastSession.exitTime) {
          return res.status(400).json({ 
            error: 'Cannot record exit time. No active entry session found.',
            type: 'no_active_session'
          });
        }
        
        // Set exit time for the last session
        lastSession.exitTime = recordTime;
        lastSession.autoExitSet = false; // Manual exit
        await attendance.save();
        
        return res.status(200).json({
          message: 'Exit time recorded successfully',
          type: 'exit',
          sessionNumber: attendance.sessions.length,
          attendance: {
            id: attendance._id,
            userId: user._id,
            userName: user.name,
            userRole: user.role,
            date: dateOnly,
            sessions: attendance.sessions,
            currentSession: lastSession
          }
        });
      }
    }
    
  } catch (error) {
    console.error('Manual attendance recording error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /attendance/today - Get today's attendance logs with entry/exit times
router.get('/today', optionalAuthMiddleware, async (req, res) => {
  try {
    // Get start and end of today (since we store IST directly, use local date)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Find attendance records for today using new schema
    let attendanceRecords = await Attendance.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).populate('user', 'name rfidTag role status').sort({ 'sessions.0.entryTime': -1 });
    
    // If no records found with new schema, try legacy schema for backward compatibility
    if (attendanceRecords.length === 0) {
      const legacyRecords = await Attendance.find({
        timestamp: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      }).populate('userId', 'name rfidTag role status').sort({ timestamp: -1 });
      
      // Convert legacy records to new format
      attendanceRecords = legacyRecords.map(record => ({
        _id: record._id,
        user: record.userId,
        date: startOfDay,
        sessions: [{
          entryTime: record.timestamp,
          exitTime: null,
          autoExitSet: false
        }],
        entryTime: record.timestamp,
        exitTime: null,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }));
    }
    
    // Filter out records for inactive users if not admin/mentor
    let filteredRecords = attendanceRecords;
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'mentor')) {
      filteredRecords = attendanceRecords.filter(record => 
        record.user && record.user.status === 'active'
      );
    }
    
    // Format response to include session data
    const formattedRecords = filteredRecords.map(record => {
      const lastSession = record.sessions && record.sessions.length > 0 
        ? record.sessions[record.sessions.length - 1] 
        : null;
      
      return {
        id: record._id,
        name: record.user.name,
        rfidTag: record.user.rfidTag,
        role: record.user.role,
        status: record.user.status,
        sessions: record.sessions || [],
        sessionCount: record.sessions ? record.sessions.length : 0,
        // For compatibility with existing frontend
        entryTime: record.entryTime || (record.sessions && record.sessions[0] ? record.sessions[0].entryTime : null),
        exitTime: record.exitTime || (lastSession ? lastSession.exitTime : null),
        isCurrentlyInside: lastSession && !lastSession.exitTime,
        // Legacy timestamp for backward compatibility
        timestamp: record.entryTime || (record.sessions && record.sessions[0] ? record.sessions[0].entryTime : null)
      };
    });
    
    res.json(formattedRecords);
    
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /attendance/history - Get attendance history with filters (updated for entry/exit)
router.get('/history', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      userId, 
      page = 1, 
      limit = 50,
      status = 'active'
    } = req.query;
    
    // Build date filter for both new and legacy schema
    const dateFilter = {};
    if (startDate || endDate) {
      const timeFilter = {};
      if (startDate) {
        timeFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        timeFilter.$lte = end;
      }
      
      dateFilter.$or = [
        { date: timeFilter },
        { timestamp: timeFilter }
      ];
    }
    
    // Build main filter
    const filter = {};
    if (Object.keys(dateFilter).length > 0) {
      filter.$and = [dateFilter];
    }
    if (userId) {
      filter.$or = [
        { user: userId },
        { userId: userId } // Legacy support
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build aggregation pipeline for new schema
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'legacyUserInfo'
        }
      },
      {
        $addFields: {
          user: {
            $cond: {
              if: { $gt: [{ $size: '$userInfo' }, 0] },
              then: { $arrayElemAt: ['$userInfo', 0] },
              else: { $arrayElemAt: ['$legacyUserInfo', 0] }
            }
          }
        }
      },
      {
        $match: {
          'user.status': status
        }
      },
      {
        $project: {
          _id: 1,
          date: { $ifNull: ['$date', { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }] },
          sessions: { $ifNull: ['$sessions', []] },
          user: 1,
          // Legacy fields for backward compatibility
          entryTime: { $ifNull: ['$entryTime', '$timestamp'] },
          exitTime: 1,
          timestamp: { $ifNull: ['$entryTime', '$timestamp'] },
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $sort: { date: -1, entryTime: -1, timestamp: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];
    
    const attendanceRecords = await Attendance.aggregate(pipeline);
    
    // Format response to match today API structure
    const formattedRecords = attendanceRecords.map(record => {
      const lastSession = record.sessions && record.sessions.length > 0 
        ? record.sessions[record.sessions.length - 1] 
        : null;
      
      return {
        id: record._id,
        name: record.user.name,
        rfidTag: record.user.rfidTag,
        role: record.user.role,
        status: record.user.status,
        sessions: record.sessions || [],
        sessionCount: record.sessions ? record.sessions.length : 0,
        // For compatibility with existing frontend
        entryTime: record.entryTime || (record.sessions && record.sessions[0] ? record.sessions[0].entryTime : null),
        exitTime: record.exitTime || (lastSession ? lastSession.exitTime : null),
        isCurrentlyInside: lastSession && !lastSession.exitTime,
        // Legacy timestamp for backward compatibility  
        timestamp: record.entryTime || (record.sessions && record.sessions[0] ? record.sessions[0].entryTime : null),
        date: record.date,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      };
    });
    
    // Get total count for pagination
    const countPipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'legacyUserInfo'
        }
      },
      {
        $addFields: {
          user: {
            $cond: {
              if: { $gt: [{ $size: '$userInfo' }, 0] },
              then: { $arrayElemAt: ['$userInfo', 0] },
              else: { $arrayElemAt: ['$legacyUserInfo', 0] }
            }
          }
        }
      },
      {
        $match: {
          'user.status': status
        }
      },
      { $count: 'total' }
    ];
    
    const countResult = await Attendance.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;
    
    res.json({
      attendance: formattedRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ error: 'Server error while fetching attendance history' });
  }
});

// GET /attendance/user/:userId - Get attendance for specific user (updated for entry/exit)
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    
    // Check if user can access this data
    if (req.user.role !== 'admin' && req.user.role !== 'mentor' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only view your own attendance.' });
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Build date filter for both new and legacy schema
    const dateFilter = { 
      $or: [
        { user: userId },
        { userId: userId } // Legacy support
      ]
    };
    
    if (startDate || endDate) {
      const timeFilter = {};
      if (startDate) {
        timeFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        timeFilter.$lte = end;
      }
      
      dateFilter.$and = [
        {
          $or: [
            { date: timeFilter },
            { timestamp: timeFilter }
          ]
        }
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get attendance records
    const attendanceRecords = await Attendance.find(dateFilter)
      .sort({ date: -1, entryTime: -1, timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Attendance.countDocuments(dateFilter);
    
    // Format records for consistent response (new session-based format)
    const formattedRecords = attendanceRecords.map(record => {
      // Handle both new session-based records and legacy records
      if (record.sessions && record.sessions.length > 0) {
        // New session-based format
        return {
          id: record._id,
          date: record.date,
          sessions: record.sessions,
          isCurrentlyInside: record.isCurrentlyInside,
          // Legacy fields for backward compatibility
          entryTime: record.sessions[0]?.entryTime,
          exitTime: record.sessions[record.sessions.length - 1]?.exitTime,
          timestamp: record.sessions[0]?.entryTime
        };
      } else {
        // Legacy format - convert to session format
        const sessions = [];
        if (record.entryTime || record.timestamp) {
          sessions.push({
            entryTime: record.entryTime || record.timestamp,
            exitTime: record.exitTime,
            autoExitSet: false
          });
        }
        
        return {
          id: record._id,
          date: record.date || Attendance.getDateOnly(record.entryTime || record.timestamp),
          sessions: sessions,
          isCurrentlyInside: !record.exitTime && (record.entryTime || record.timestamp),
          // Legacy fields for backward compatibility
          entryTime: record.entryTime || record.timestamp,
          exitTime: record.exitTime,
          timestamp: record.entryTime || record.timestamp
        };
      }
    });
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      attendance: formattedRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get user attendance error:', error);
    res.status(500).json({ error: 'Server error while fetching user attendance' });
  }
});

// GET /attendance/stats - Get attendance statistics
router.get('/stats', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.timestamp.$lte = end;
      }
    }
    
    // Get total attendance records
    const totalAttendance = await Attendance.countDocuments(dateFilter);
    
    // Get unique users who attended
    const uniqueAttendees = await Attendance.distinct('userId', dateFilter);
    const uniqueAttendeesCount = uniqueAttendees.length;
    
    // Get attendance by day
    const attendanceByDay = await Attendance.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          attendanceCount: '$count',
          uniqueUsersCount: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { date: -1 } },
      { $limit: 30 } // Last 30 days
    ]);
    
    res.json({
      totalAttendance,
      uniqueAttendeesCount,
      attendanceByDay
    });
    
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ error: 'Server error while fetching attendance statistics' });
  }
});

// DELETE /attendance/:id - Delete attendance record (admin only)
router.delete('/:id', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const attendance = await Attendance.findById(id).populate('userId', 'name email');
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    await Attendance.findByIdAndDelete(id);
    
    res.json({
      message: 'Attendance record deleted successfully',
      deletedRecord: {
        id: attendance._id,
        userName: attendance.userId.name,
        timestamp: attendance.timestamp
      }
    });
    
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: 'Server error while deleting attendance record' });
  }
});

// GET /attendance/my - Get current user's attendance records
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    
    // Build date filter
    const dateFilter = { 
      $or: [
        { user: userId },
        { userId: userId } // Legacy support
      ]
    };
    
    if (startDate || endDate) {
      const timeFilter = {};
      if (startDate) {
        timeFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        timeFilter.$lte = end;
      }
      
      // Apply to both new and legacy schema
      dateFilter.$and = [
        {
          $or: [
            { date: timeFilter },
            { timestamp: timeFilter }
          ]
        }
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get attendance records
    const attendanceRecords = await Attendance.find(dateFilter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Attendance.countDocuments(dateFilter);
    
    // Format records for consistent response (new session-based format)
    const formattedRecords = attendanceRecords.map(record => {
      // Handle both new session-based records and legacy records
      if (record.sessions && record.sessions.length > 0) {
        // New session-based format
        return {
          id: record._id,
          date: record.date,
          sessions: record.sessions,
          isCurrentlyInside: record.isCurrentlyInside,
          // Legacy fields for backward compatibility
          entryTime: record.sessions[0]?.entryTime,
          exitTime: record.sessions[record.sessions.length - 1]?.exitTime,
          timestamp: record.sessions[0]?.entryTime
        };
      } else {
        // Legacy format - convert to session format
        const sessions = [];
        if (record.entryTime || record.timestamp) {
          sessions.push({
            entryTime: record.entryTime || record.timestamp,
            exitTime: record.exitTime,
            autoExitSet: false
          });
        }
        
        return {
          id: record._id,
          date: record.date || Attendance.getDateOnly(record.entryTime || record.timestamp),
          sessions: sessions,
          isCurrentlyInside: !record.exitTime && (record.entryTime || record.timestamp),
          // Legacy fields for backward compatibility
          entryTime: record.entryTime || record.timestamp,
          exitTime: record.exitTime,
          timestamp: record.entryTime || record.timestamp
        };
      }
    });
    
    res.json({
      attendance: formattedRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ error: 'Server error while fetching your attendance' });
  }
});

// POST /attendance/auto-exit - Trigger automatic cleanup of incomplete sessions
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
    const { date } = req.body; // Optional date parameter
    const checkDate = date ? new Date(date) : null;
    
    const result = await Attendance.checkLowAttendanceAndNotify(checkDate);
    res.json(result);
  } catch (error) {
    console.error('Low attendance check error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
