import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { attendanceAPI, userAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatTimeIST, formatDateIST, getCurrentISTForInput, convertInputToISO } from '../utils/dateUtils';

const ManualAttendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const dropdownRef = useRef(null);
  
  const [formData, setFormData] = useState({
    selectedUser: null,
    timestamp: getCurrentISTForInput(), // Current IST time for datetime-local input
    attendanceType: 'entry' // 'entry' or 'exit'
  });
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Check if user can record attendance manually (admin or mentor)
  const canRecordAttendance = user?.role === 'admin' || user?.role === 'mentor';

  // Fetch users for selection
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await userAPI.getUsers({ status: 'active' });
      const activeUsers = response.data.users || response.data || [];
      setUsers(activeUsers);
      setFilteredUsers(activeUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      showError('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.rfidTag?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  // Load users on component mount
  useEffect(() => {
    if (canRecordAttendance) {
      fetchUsers();
      fetchRecentAttendance();
    }
  }, [canRecordAttendance]);

  // Fetch recent attendance for feedback
  const fetchRecentAttendance = async () => {
    try {
      const response = await attendanceAPI.getAttendanceHistory({ 
        limit: 5,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      });
      setRecentAttendance(response.data.attendance || response.data || []);
    } catch (err) {
      console.error('Error fetching recent attendance:', err);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Redirect if not authorized
  React.useEffect(() => {
    if (user && !canRecordAttendance) {
      navigate('/attendance');
    }
  }, [user, canRecordAttendance, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleUserSearch = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredUsers.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredUsers[selectedIndex]) {
        handleUserSelect(filteredUsers[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleUserSelect = (selectedUser) => {
    setFormData(prev => ({ ...prev, selectedUser }));
    setSearchTerm(selectedUser.name);
    setShowDropdown(false);
    setSelectedIndex(-1);
    
    // Clear error for user selection
    if (errors.selectedUser) {
      setErrors(prev => ({ ...prev, selectedUser: '' }));
    }
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
    setSelectedIndex(-1);
    if (!showDropdown) {
      setSearchTerm('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.selectedUser) {
      newErrors.selectedUser = 'Please select a user';
    }

    if (!formData.timestamp) {
      newErrors.timestamp = 'Timestamp is required';
    }

    if (!formData.attendanceType) {
      newErrors.attendanceType = 'Please select attendance type';
    }

    // Check if timestamp is not in the future (compare IST times)
    if (formData.timestamp) {
      const inputTime = new Date(formData.timestamp);
      const now = new Date();
      // Convert current time to IST for comparison
      const nowIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      
      if (inputTime > nowIST) {
        newErrors.timestamp = 'Timestamp cannot be in the future';
      }
    }

    // Validate based on existing attendance and selected type
    if (formData.selectedUser && userAttendance && formData.attendanceType) {
      const sessions = userAttendance.sessions || [];
      const openSession = sessions.find(session => session.entryTime && (session.exitTime === null || session.exitTime === undefined));
      const completedSessions = sessions.filter(session => session.entryTime && session.exitTime);
      
      console.log('Validation check:', {
        userId: formData.selectedUser._id,
        attendanceType: formData.attendanceType,
        sessions: sessions,
        openSession: openSession,
        completedSessions: completedSessions.length
      });
      
      if (formData.attendanceType === 'entry') {
        if (openSession) {
          newErrors.attendanceType = 'There is already an open session (entry without exit). Please record exit first.';
        }
      }
      
      if (formData.attendanceType === 'exit') {
        if (!openSession) {
          newErrors.attendanceType = 'Cannot record exit time without an open session (entry time)';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Use manual attendance API for precise control
      await attendanceAPI.recordManualAttendance(
        formData.selectedUser._id,
        convertInputToISO(formData.timestamp),
        formData.attendanceType
      );
      
      success(`${formData.attendanceType.charAt(0).toUpperCase() + formData.attendanceType.slice(1)} time recorded successfully for ${formData.selectedUser.name}`);
      
      // Reset form
      setFormData({
        selectedUser: null,
        timestamp: getCurrentISTForInput(),
        attendanceType: 'entry'
      });
      setSearchTerm('');
      setUserAttendance(null);
      
      // Refresh recent attendance
      fetchRecentAttendance();
      
    } catch (err) {
      console.error('Error recording attendance:', err);
      const errorMsg = err.response?.data?.error || 'Failed to record attendance';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Check existing attendance for the selected user and date
  const [userAttendance, setUserAttendance] = useState(null);
  const [checkingAttendance, setCheckingAttendance] = useState(false);

  const checkUserAttendance = async (userId, date) => {
    try {
      setCheckingAttendance(true);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const response = await attendanceAPI.getUserAttendance(userId, {
        startDate: startOfDay.toISOString().split('T')[0],
        endDate: endOfDay.toISOString().split('T')[0]
      });

      const attendanceRecords = response.data.attendance || response.data || [];
      
      // Find attendance record for the selected date
      const todayAttendance = attendanceRecords.find(record => {
        // Try different date fields that might exist
        const recordDate = new Date(record.date || record.createdAt || record.timestamp);
        const selectedDate = new Date(date);
        
        // Compare dates (ignore time)
        return recordDate.toDateString() === selectedDate.toDateString();
      });

      // Convert legacy format to sessions format if needed
      let processedAttendance = todayAttendance;
      if (todayAttendance && (!todayAttendance.sessions || todayAttendance.sessions.length === 0)) {
        // This is a legacy record, convert to sessions format
        processedAttendance = {
          ...todayAttendance,
          sessions: []
        };
        
        if (todayAttendance.entryTime || todayAttendance.timestamp) {
          processedAttendance.sessions.push({
            entryTime: todayAttendance.entryTime || todayAttendance.timestamp,
            exitTime: todayAttendance.exitTime,
            autoExitSet: false
          });
        }
      }

      console.log('Selected date:', new Date(date).toDateString());
      console.log('Found attendance:', todayAttendance);
      console.log('Processed attendance:', processedAttendance);
      console.log('Sessions:', processedAttendance?.sessions);

      setUserAttendance(processedAttendance || null);
    } catch (err) {
      console.error('Error checking user attendance:', err);
      setUserAttendance(null);
    } finally {
      setCheckingAttendance(false);
    }
  };

  // Check attendance when user or date changes
  useEffect(() => {
    if (formData.selectedUser && formData.timestamp) {
      const selectedDate = new Date(formData.timestamp);
      checkUserAttendance(formData.selectedUser._id, selectedDate);
    } else {
      setUserAttendance(null);
    }
  }, [formData.selectedUser, formData.timestamp]);

  if (!user || !canRecordAttendance) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-medium text-black mb-4">Access Denied</h1>
          <p className="text-xs text-gray-400 tracking-wider uppercase mb-8">
            Only administrators and mentors can record attendance manually
          </p>
          <Link 
            to="/attendance" 
            className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200"
          >
            Go to Attendance
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto py-6 sm:py-16 px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 sm:mb-16 text-center">
          <h1 className="text-lg font-medium text-black tracking-tight mb-4">
            Manual Attendance
          </h1>
          <p className="text-xs text-gray-400 tracking-wider uppercase">
            Record attendance manually
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs text-gray-400 tracking-wider uppercase mb-2">
              Select User
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={formData.selectedUser ? formData.selectedUser.name : "Search and select a user..."}
                value={showDropdown ? searchTerm : (formData.selectedUser ? formData.selectedUser.name : '')}
                onChange={handleUserSearch}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                disabled={loading || usersLoading}
                className={`w-full border-0 border-b bg-transparent py-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 pr-10 ${
                  errors.selectedUser ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
                }`}
              />
              <button
                type="button"
                onClick={handleDropdownToggle}
                disabled={loading || usersLoading}
                className="absolute right-0 top-4 text-gray-400 hover:text-black transition-colors duration-200 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                {usersLoading ? (
                  <div className="p-4 text-center text-xs text-gray-400">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    {searchTerm ? 'No users match your search' : 'No active users found'}
                  </div>
                ) : (
                  filteredUsers.map((user, index) => (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => handleUserSelect(user)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${
                        index === selectedIndex ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-medium rounded">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-black">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                          <div className="text-xs text-gray-400 font-mono">RFID: {user.rfidTag}</div>
                        </div>
                        <div className="text-xs text-gray-400 capitalize">
                          {user.role}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {errors.selectedUser && (
              <p className="mt-2 text-xs text-red-500">{errors.selectedUser}</p>
            )}
          </div>

          {/* Selected User Display */}
          {formData.selectedUser && !showDropdown && (
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-medium rounded">
                  {formData.selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-black">{formData.selectedUser.name}</div>
                  <div className="text-xs text-gray-400">{formData.selectedUser.email}</div>
                  <div className="text-xs text-gray-400 font-mono">RFID: {formData.selectedUser.rfidTag}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, selectedUser: null }));
                    setSearchTerm('');
                  }}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors duration-200"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div>
            <label className="block text-xs text-gray-400 tracking-wider uppercase mb-2">
              Date & Time
            </label>
            <input
              type="datetime-local"
              name="timestamp"
              value={formData.timestamp}
              onChange={handleChange}
              disabled={loading}
              className={`w-full border-0 border-b bg-transparent py-4 text-sm focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 ${
                errors.timestamp ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
              }`}
            />
            {errors.timestamp && (
              <p className="mt-2 text-xs text-red-500">{errors.timestamp}</p>
            )}
          </div>

          {/* Attendance Type Selection */}
          <div>
            <label className="block text-xs text-gray-400 tracking-wider uppercase mb-2">
              Attendance Type
            </label>
            <div className="relative">
              <select
                name="attendanceType"
                value={formData.attendanceType}
                onChange={handleChange}
                disabled={loading || checkingAttendance}
                className={`w-full border-0 border-b bg-transparent py-4 text-sm focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 appearance-none cursor-pointer hover:bg-gray-50 ${
                  errors.attendanceType ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
                }`}
              >
                <option value="entry">Entry Time</option>
                <option value="exit">Exit Time</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-400">
              Click to select between Entry or Exit time recording
            </div>
            {errors.attendanceType && (
              <p className="mt-2 text-xs text-red-500">{errors.attendanceType}</p>
            )}
          </div>

          {/* User Attendance Status */}
          {formData.selectedUser && userAttendance && (
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-xs text-gray-400 tracking-wider uppercase mb-2">
                Current Status for {formatDateIST(formData.timestamp)}
              </div>
              {userAttendance.sessions && userAttendance.sessions.length > 0 ? (
                <div className="space-y-3">
                  {/* Debug info */}
                  <div className="text-xs text-red-500 mb-2">
                    Debug: Found {userAttendance.sessions.length} sessions
                  </div>
                  {userAttendance.sessions.map((session, index) => {
                    const isOpen = session.entryTime && (session.exitTime === null || session.exitTime === undefined);
                    return (
                      <div key={index} className={`border p-3 rounded ${isOpen ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
                        <div className="text-xs text-gray-500 mb-2">
                          Session {index + 1} {isOpen && <span className="text-orange-600">(OPEN)</span>}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Entry Time:</span>
                            <span className={session.entryTime ? 'text-green-600 font-mono' : 'text-gray-400'}>
                              {session.entryTime ? 
                                formatTimeIST(session.entryTime) : 
                                'Not recorded'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Exit Time:</span>
                            <span className={session.exitTime ? 'text-green-600 font-mono' : 'text-orange-500'}>
                              {session.exitTime ? 
                                formatTimeIST(session.exitTime) : 
                                'Open session'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Total Sessions: {userAttendance.sessions.length} | 
                      Open Sessions: {userAttendance.sessions.filter(s => s.entryTime && (s.exitTime === null || s.exitTime === undefined)).length}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">No sessions recorded for this date</div>
              )}
            </div>
          )}

          {formData.selectedUser && checkingAttendance && (
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                <span className="text-xs text-gray-400 tracking-wider uppercase">Checking existing attendance...</span>
              </div>
            </div>
          )}

          {/* Helper Text */}
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-xs text-blue-800 tracking-wider uppercase mb-2">💡 Tips</div>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• Type to search users by name, email, or RFID tag</p>
              <p>• Use arrow keys ↑↓ to navigate, Enter to select</p>
              <p>• <strong>Choose "📥 Entry" to start a new session or "📤 Exit" to end an open session</strong></p>
              <p>• Users can have multiple sessions per day (entry/exit pairs)</p>
              <p>• Exit time requires an open session (entry without exit)</p>
              <p>• Only active users are shown in the dropdown</p>
              <p>• Timestamp cannot be in the future</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 pt-8">
            <Link
              to="/attendance"
              className="flex-1 py-4 border border-gray-200 text-xs tracking-wider uppercase font-medium hover:bg-gray-50 transition-colors duration-200 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-black text-white text-xs tracking-wider uppercase font-medium hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Recording...</span>
                </span>
              ) : (
                `Record ${formData.attendanceType} Time`
              )}
            </button>
          </div>
        </form>

        {/* Recent Attendance */}
        {recentAttendance.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-100">
            <h3 className="text-xs text-gray-400 tracking-wider uppercase mb-4">Recent Attendance Records</h3>
            <div className="space-y-2">
              {recentAttendance.slice(0, 5).map((record) => {
                const sessions = record.sessions || [];
                const currentSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
                const hasOpenSession = currentSession && currentSession.entryTime && !currentSession.exitTime;
                const hasCompletedSession = currentSession && currentSession.entryTime && currentSession.exitTime;
                const userName = record.userName || record.userId?.name || 'Unknown User';
                const userEmail = record.userEmail || record.userId?.email;
                
                return (
                  <div key={record._id} className={`flex items-center justify-between p-3 rounded ${
                    hasCompletedSession ? 'bg-green-50' : hasOpenSession ? 'bg-yellow-50' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 text-white flex items-center justify-center text-xs font-medium rounded ${
                        hasCompletedSession ? 'bg-green-500' : hasOpenSession ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}>
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="text-sm text-black">{userName}</div>
                        <div className="text-xs text-gray-400">{userEmail}</div>
                        <div className="text-xs text-gray-400">
                          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                          {hasOpenSession && ' (1 open)'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {currentSession && (
                        <div className="text-xs text-black font-mono">
                          {formatTimeIST(currentSession.entryTime)}
                          {currentSession.exitTime && (
                            <>
                              <span className="text-gray-400 mx-1">→</span>
                              {formatTimeIST(currentSession.exitTime)}
                            </>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        {formatDateIST(record.date, { month: 'short', day: 'numeric' })}
                        {hasCompletedSession && (
                          <span className="ml-2 text-green-600">✓</span>
                        )}
                        {hasOpenSession && (
                          <span className="ml-2 text-yellow-600">●</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <h3 className="text-xs text-gray-400 tracking-wider uppercase mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              to="/attendance"
              className="block text-xs text-gray-400 hover:text-black transition-colors duration-200"
            >
              View Today's Attendance
            </Link>
            <Link
              to="/attendance/history"
              className="block text-xs text-gray-400 hover:text-black transition-colors duration-200"
            >
              View Attendance History
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/members"
                className="block text-xs text-gray-400 hover:text-black transition-colors duration-200"
              >
                Manage Members
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualAttendance;
