const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  }, // store only date without time for grouping
  sessions: [{
    entryTime: { 
      type: Date,
      required: true
    },
    exitTime: { 
      type: Date 
    },
    autoExitSet: {
      type: Boolean,
      default: false
    }
  }],
  // Legacy fields for backward compatibility
  entryTime: { 
    type: Date 
  },
  exitTime: { 
    type: Date 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  timestamp: { 
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
AttendanceSchema.index({ user: 1, date: -1 });
AttendanceSchema.index({ date: -1 });
// Legacy indexes for backward compatibility
AttendanceSchema.index({ userId: 1, timestamp: -1 });
AttendanceSchema.index({ timestamp: -1 });

// Helper method to get date without time for grouping (works with IST timestamps stored directly)
AttendanceSchema.statics.getDateOnly = function(date) {
  // Since we're now storing IST timestamps directly, just extract the date part
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

// Method to auto-cleanup incomplete sessions at 10 PM
AttendanceSchema.statics.autoSetExitTimes = async function() {
  const emailService = require('../services/emailService');
  
  // Since we store IST directly, get current time as IST
  const now = new Date();
  const today = this.getDateOnly(now);
  const tenPM = new Date(today);
  tenPM.setHours(22, 0, 0, 0); // 10 PM

  // Only run if it's past 10 PM
  if (now < tenPM) {
    return { message: 'Not yet 10 PM, no auto-cleanup needed' };
  }

  try {
    // Find all attendance records for today with incomplete sessions
    const attendanceRecords = await this.find({
      date: today,
      'sessions.exitTime': null
    }).populate('user');

    let updatedCount = 0;
    let deletedSessionsCount = 0;

    for (let record of attendanceRecords) {
      const originalSessionsLength = record.sessions.length;
      
      // Store incomplete sessions for email notification
      const incompleteSessions = record.sessions.filter(session => !session.exitTime);
      
      // Remove only sessions that don't have an exit time
      record.sessions = record.sessions.filter(session => session.exitTime !== null);
      
      const deletedSessions = originalSessionsLength - record.sessions.length;
      
      if (deletedSessions > 0) {
        deletedSessionsCount += deletedSessions;
        
        // Send notification about incomplete sessions
        if (record.user.email && incompleteSessions.length > 0) {
          await emailService.sendIncompleteSessionNotification(record.user, incompleteSessions, today);
        }
        
        // If all sessions were removed, delete the entire attendance record
        if (record.sessions.length === 0) {
          await record.deleteOne();
        } else {
          // Update legacy fields based on remaining complete sessions
          record.entryTime = record.sessions[0].entryTime;
          record.exitTime = record.sessions[record.sessions.length - 1].exitTime;
          record.timestamp = record.sessions[0].entryTime;
          await record.save();
        }
        updatedCount++;
      }
    }

    return { 
      message: `Auto-cleanup completed: ${deletedSessionsCount} incomplete sessions removed from ${updatedCount} attendance records`,
      updatedRecords: updatedCount,
      deletedSessions: deletedSessionsCount
    };
  } catch (error) {
    throw new Error(`Auto-cleanup failed: ${error.message}`);
  }
};

// Method to calculate total hours worked for a specific date
AttendanceSchema.statics.calculateDailyHours = function(sessions) {
  if (!sessions || sessions.length === 0) {
    return 0;
  }

  let totalHours = 0;
  for (let session of sessions) {
    if (session.entryTime && session.exitTime) {
      const entryTime = new Date(session.entryTime);
      const exitTime = new Date(session.exitTime);
      const hoursWorked = (exitTime - entryTime) / (1000 * 60 * 60); // Convert milliseconds to hours
      totalHours += hoursWorked;
    }
  }
  
  return totalHours;
};

// Method to check for users with low attendance and send notifications
AttendanceSchema.statics.checkLowAttendanceAndNotify = async function(date = null) {
  const emailService = require('../services/emailService');
  const User = require('./User');
  
  // Use provided date or today
  const checkDate = date ? this.getDateOnly(date) : this.getDateOnly(new Date());
  
  try {
    // Find all attendance records for the specified date
    const attendanceRecords = await this.find({ date: checkDate }).populate('user');
    
    // Get all users to check who didn't have any attendance
    const allUsers = await User.find({ role: { $ne: 'admin' } }); // Exclude admins from attendance checks
    const usersWithAttendance = attendanceRecords.map(record => record.user._id.toString());
    
    const lowAttendanceUsers = [];
    
    // Check users with attendance records
    for (let record of attendanceRecords) {
      const hoursWorked = this.calculateDailyHours(record.sessions);
      if (hoursWorked < 2) {
        lowAttendanceUsers.push({
          user: record.user,
          hoursWorked: hoursWorked,
          name: record.user.name,
          email: record.user.email
        });
        
        // Send individual notification to user
        if (record.user.email) {
          await emailService.sendLowAttendanceNotification(record.user, hoursWorked, checkDate);
        }
      }
    }
    
    // Check users with no attendance records (0 hours)
    for (let user of allUsers) {
      if (!usersWithAttendance.includes(user._id.toString())) {
        lowAttendanceUsers.push({
          user: user,
          hoursWorked: 0,
          name: user.name,
          email: user.email
        });
        
        // Send individual notification to user
        if (user.email) {
          await emailService.sendLowAttendanceNotification(user, 0, checkDate);
        }
      }
    }
    
    // Send admin summary report
    await emailService.sendAdminLowAttendanceReport(lowAttendanceUsers, checkDate);
    
    return {
      message: `Low attendance check completed for ${checkDate.toDateString()}`,
      totalUsers: allUsers.length,
      lowAttendanceUsers: lowAttendanceUsers.length,
      usersNotified: lowAttendanceUsers.filter(u => u.email).length
    };
    
  } catch (error) {
    throw new Error(`Low attendance check failed: ${error.message}`);
  }
};

// Pre-save middleware to handle data migration and validation
AttendanceSchema.pre('save', function(next) {
  // Handle migration from old schema
  if (this.userId && !this.user) {
    this.user = this.userId;
  }
  
  // Migrate old single entry/exit to sessions array
  if ((this.entryTime || this.timestamp) && (!this.sessions || this.sessions.length === 0)) {
    const entryTime = this.entryTime || this.timestamp;
    const session = {
      entryTime: entryTime,
      exitTime: this.exitTime || null,
      autoExitSet: false
    };
    this.sessions = [session];
    this.date = AttendanceSchema.statics.getDateOnly(entryTime);
  }
  
  // Ensure sessions have proper entry times and update legacy fields for compatibility
  if (this.sessions && this.sessions.length > 0) {
    // Update legacy fields with first session for backward compatibility
    this.entryTime = this.sessions[0].entryTime;
    this.exitTime = this.sessions[this.sessions.length - 1].exitTime;
    this.timestamp = this.sessions[0].entryTime;
    
    // Set date based on first session entry time
    if (!this.date) {
      this.date = AttendanceSchema.statics.getDateOnly(this.sessions[0].entryTime);
    }
  }
  
  next();
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
