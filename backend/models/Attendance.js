const { supabase } = require('../config/supabase');

class Attendance {
  constructor(attendanceData) {
    Object.assign(this, attendanceData);
  }

  // Helper method to get date without time for grouping (works with IST timestamps stored directly)
  static getDateOnly(date) {
    // Since we're now storing IST timestamps directly, just extract the date part
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // Save attendance to database
  async save() {
    try {
      // Handle legacy userId field
      if (this.userId && !this.user_id) {
        this.user_id = this.userId;
      }

      // Set date from timestamp if not provided
      if (!this.date && this.timestamp) {
        this.date = Attendance.getDateOnly(this.timestamp);
      }

      const attendanceData = {
        user_id: this.user_id || this.user,
        date: this.date,
        timestamp: this.timestamp,
        status: this.status || 'present'
      };

      let result;
      if (this.id) {
        // Update existing record
        const { data, error } = await supabase
          .from('attendance')
          .update(attendanceData)
          .eq('id', this.id)
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
        this.id = result.id;
      }

      // Update instance with returned data
      Object.assign(this, result);
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Delete attendance record
  async deleteOne() {
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', this.id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Method to auto-cleanup incomplete sessions at 10 PM
  static async autoSetExitTimes() {
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
      const { data: attendanceRecords, error } = await supabase
        .from('attendance')
        .select(`
          *,
          users (*)
        `)
        .eq('date', today.toISOString().split('T')[0])
        .contains('sessions', [{ exitTime: null }]);

      if (error) throw error;

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
          if (record.users.email && incompleteSessions.length > 0) {
            await emailService.sendIncompleteSessionNotification(record.users, incompleteSessions, today);
          }

          // If all sessions were removed, delete the entire attendance record
          if (record.sessions.length === 0) {
            const { error: deleteError } = await supabase
              .from('attendance')
              .delete()
              .eq('id', record.id);

            if (deleteError) throw deleteError;
          } else {
            // Update legacy fields based on remaining complete sessions
            const updateData = {
              sessions: record.sessions,
              entry_time: record.sessions[0].entryTime,
              exit_time: record.sessions[record.sessions.length - 1].exitTime,
              timestamp: record.sessions[0].entryTime
            };

            const { error: updateError } = await supabase
              .from('attendance')
              .update(updateData)
              .eq('id', record.id);

            if (updateError) throw updateError;
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
  }

  // Method to calculate total hours worked for a specific date
  static calculateDailyHours(sessions) {
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
  }

  // Method to check for users with low attendance and send notifications
  static async checkLowAttendanceAndNotify(date = null) {
    const emailService = require('../services/emailService');
    const User = require('./User');

    // Use provided date or today
    const checkDate = date ? this.getDateOnly(date) : this.getDateOnly(new Date());

    try {
      // Find all attendance records for the specified date
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          users (*)
        `)
        .eq('date', checkDate.toISOString().split('T')[0]);

      if (attendanceError) throw attendanceError;

      // Get all users to check who didn't have any attendance
      const allUsers = await User.find({ role: { $ne: 'admin' } }); // Exclude admins from attendance checks
      const usersWithAttendance = attendanceRecords.map(record => record.users.id);

      const lowAttendanceUsers = [];

      // Check users with attendance records
      for (let record of attendanceRecords) {
        const hoursWorked = this.calculateDailyHours(record.sessions);
        if (hoursWorked < 2) {
          lowAttendanceUsers.push({
            user: record.users,
            hoursWorked: hoursWorked,
            name: record.users.name,
            email: record.users.email
          });

          // Send individual notification to user
          if (record.users.email) {
            await emailService.sendLowAttendanceNotification(record.users, hoursWorked, checkDate);
          }
        }
      }

      // Check users with no attendance records (0 hours)
      for (let user of allUsers) {
        if (!usersWithAttendance.includes(user.id)) {
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
  }

  // Static method to find attendance records
  static async find(conditions = {}, populate = null) {
    try {
      let query = supabase.from('attendance').select('*');

      if (populate && populate.includes('user')) {
        query = supabase.from('attendance').select(`
          *,
          users (*)
        `);
      }

      // Apply conditions
      Object.keys(conditions).forEach(key => {
        if (conditions[key] !== undefined) {
          if (key === 'user' || key === 'user_id') {
            query = query.eq('user_id', conditions[key]);
          } else if (key === 'date') {
            if (typeof conditions[key] === 'object' && conditions[key].$gte && conditions[key].$lte) {
              query = query
                .gte('date', conditions[key].$gte.toISOString().split('T')[0])
                .lte('date', conditions[key].$lte.toISOString().split('T')[0]);
            } else {
              query = query.eq('date', conditions[key].toISOString().split('T')[0]);
            }
          } else {
            query = query.eq(key, conditions[key]);
          }
        }
      });

      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data.map(record => new Attendance(record));
    } catch (error) {
      throw error;
    }
  }

  // Static method to find one attendance record
  static async findOne(conditions = {}) {
    try {
      const records = await this.find(conditions);
      return records.length > 0 ? records[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Static method to find by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? new Attendance(data) : null;
    } catch (error) {
      throw error;
    }
  }

  // Populate method for backward compatibility
  populate(fields) {
    // This would need to be implemented based on specific needs
    // For now, return this for method chaining
    return this;
  }
}

module.exports = Attendance;
