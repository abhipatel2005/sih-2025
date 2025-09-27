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
    date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
    timestamp: getCurrentISTForInput(), // Current IST time for datetime-local input
    status: 'present' // 'present', 'absent', 'late', 'excused'
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

  // Check if user can record attendance manually (teacher only)
  const canRecordAttendance = user?.role === 'teacher';
  
  // Check if user is admin/principal (should be redirected to attendance management)
  const isAdminOrPrincipal = user?.role === 'admin' || user?.role === 'principal';

  // Fetch users for selection (students only for teachers)
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      // Use getStudents for teachers/principals to get school-filtered data
      const response = user?.role === 'teacher' || user?.role === 'principal' 
        ? await userAPI.getStudents({ status: 'active' })
        : await userAPI.getUsers({ status: 'active' });
        
      const activeUsers = response.data.users || response.data || [];
      
      // For teachers, data is already filtered to students from their school
      // For admins, filter to show only students
      const filteredUsers = (user?.role === 'admin') 
        ? activeUsers.filter(userItem => userItem.role === 'student')
        : activeUsers;
      
      setUsers(filteredUsers);
      setFilteredUsers(filteredUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      showError('Failed to load students');
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
        user.rfid_tag?.toLowerCase().includes(searchTerm.toLowerCase())
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
  useEffect(() => {
    if (user && isAdminOrPrincipal) {
      // Redirect admins and principals to attendance management
      navigate('/attendance');
    } else if (user && !canRecordAttendance) {
      // Redirect other users to regular attendance view
      navigate('/attendance');
    }
  }, [user, canRecordAttendance, isAdminOrPrincipal, navigate]);

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
      newErrors.selectedUser = 'Please select a student';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.status) {
      newErrors.status = 'Please select attendance status';
    }

    // Check if date is not in the future
    if (formData.date) {
      const inputDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for date comparison
      
      if (inputDate > today) {
        newErrors.date = 'Date cannot be in the future';
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
      // Use manual attendance API with the new parameters
      await attendanceAPI.recordManualAttendance(
        formData.selectedUser.id,
        formData.date,
        formData.timestamp ? convertInputToISO(formData.timestamp) : undefined,
        formData.status
      );
      
      success(`${formData.status.charAt(0).toUpperCase() + formData.status.slice(1)} attendance recorded successfully for ${formData.selectedUser.name}`);
      
      // Reset form
      setFormData({
        selectedUser: null,
        date: new Date().toISOString().split('T')[0],
        timestamp: getCurrentISTForInput(),
        status: 'present'
      });
      setSearchTerm('');
      
      // Refresh recent attendance
      fetchRecentAttendance();
      
    } catch (err) {
      console.error('Error recording attendance:', err);
      showError(err.response?.data?.error || 'Failed to record attendance');
    } finally {
      setLoading(false);
    }
  };

  // Show unauthorized message
  if (!canRecordAttendance) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-medium text-black mb-4">Teacher Access Only</h1>
          <p className="text-sm text-gray-500 mb-6">
            Manual attendance entry is available for teachers only.
            {isAdminOrPrincipal ? ' Admins and principals have access to full attendance management.' : ''}
          </p>
          <Link
            to="/attendance"
            className="text-xs text-blue-600 tracking-wider uppercase hover:text-blue-800 transition-colors duration-200"
          >
            {isAdminOrPrincipal ? 'Go to Attendance Dashboard' : 'Back to Attendance'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto py-6 sm:py-16 px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 sm:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-4 sm:space-y-0">
            <h1 className="text-lg font-medium text-black tracking-tight">
              Manual Attendance Entry
            </h1>
            <div className="flex gap-4">
              <Link
                to="/attendance"
                className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200"
              >
                Today's Attendance
              </Link>
              <Link
                to="/attendance/history"
                className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200"
              >
                History
              </Link>
            </div>
          </div>
          <p className="text-xs text-gray-400 tracking-wider uppercase">
            Teacher Portal - Record attendance manually for students
          </p>
        </div>

        {/* Manual Entry Form */}
        <div className="bg-white border border-gray-100 rounded-none mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-base font-medium text-black">Record Attendance</h2>
            <p className="text-xs text-gray-400 tracking-wider uppercase mt-1">
              Select student, date, and status
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* User Selection */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs text-gray-400 tracking-wider uppercase mb-2">
                Select Student
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleUserSearch}
                  onKeyDown={handleKeyDown}
                  onClick={() => setShowDropdown(true)}
                  disabled={loading || usersLoading}
                  placeholder="Search students by name, email, or RFID tag..."
                  className={`w-full border-0 border-b bg-transparent py-4 text-sm focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 ${
                    errors.selectedUser ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleDropdownToggle}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {/* User Dropdown */}
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
                  {usersLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading students...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No students found</div>
                  ) : (
                    filteredUsers.map((userItem, index) => (
                      <button
                        key={userItem.id}
                        type="button"
                        onClick={() => handleUserSelect(userItem)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-200 ${
                          selectedIndex === index ? 'bg-gray-50' : ''
                        }`}
                      >
                        <div className="font-medium text-sm">{userItem.name}</div>
                        <div className="text-xs text-gray-500">
                          {userItem.role} • {userItem.email} • {userItem.rfid_tag}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
              
              {formData.selectedUser && (
                <div className="mt-2 text-xs text-green-600">
                  Selected: {formData.selectedUser.name} ({formData.selectedUser.role})
                </div>
              )}
              
              {errors.selectedUser && (
                <p className="mt-2 text-xs text-red-500">{errors.selectedUser}</p>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-xs text-gray-400 tracking-wider uppercase mb-2">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={loading}
                className={`w-full border-0 border-b bg-transparent py-4 text-sm focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 ${
                  errors.date ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
                }`}
              />
              {errors.date && (
                <p className="mt-2 text-xs text-red-500">{errors.date}</p>
              )}
            </div>

            {/* Time Selection (Optional) */}
            <div>
              <label className="block text-xs text-gray-400 tracking-wider uppercase mb-2">
                Time (Optional)
              </label>
              <input
                type="datetime-local"
                name="timestamp"
                value={formData.timestamp}
                onChange={handleChange}
                disabled={loading}
                className="w-full border-0 border-b bg-transparent py-4 text-sm focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 border-gray-200 focus:border-black"
              />
              <div className="mt-1 text-xs text-gray-400">
                Leave empty to use current time
              </div>
            </div>

            {/* Attendance Status Selection */}
            <div>
              <label className="block text-xs text-gray-400 tracking-wider uppercase mb-2">
                Attendance Status
              </label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full border-0 border-b bg-transparent py-4 text-sm focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 appearance-none cursor-pointer hover:bg-gray-50 ${
                    errors.status ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
                  }`}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-400">
                Select the attendance status for the selected student
              </div>
              {errors.status && (
                <p className="mt-2 text-xs text-red-500">{errors.status}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-4 text-xs tracking-wider uppercase font-medium hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Recording...' : 
                `Record ${formData.status.charAt(0).toUpperCase() + formData.status.slice(1)} Attendance`
                }
              </button>
            </div>
          </form>
        </div>

        {/* Recent Attendance */}
        {recentAttendance.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-none">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-base font-medium text-black">Recent Student Entries</h2>
              <p className="text-xs text-gray-400 tracking-wider uppercase mt-1">
                Last 5 student records
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 tracking-wider uppercase">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 tracking-wider uppercase">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 tracking-wider uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentAttendance.map((record, index) => (
                    <tr key={record.id || index} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm text-black">
                        {record.users?.name || record.userName || 'Unknown User'}
                      </td>
                      <td className="px-6 py-4 text-sm text-black">
                        {formatDateIST(record.date)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' :
                          record.status === 'absent' ? 'bg-red-100 text-red-800' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                          record.status === 'excused' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status || 'present'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualAttendance;
