import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { userAPI, attendanceAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatDateIST, formatTimeIST } from '../utils/dateUtils';

const UserDetail = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  
  const [user, setUser] = useState(null);
  const [userAttendance, setUserAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
    endDate: new Date().toISOString().split('T')[0]
  });

  // Check access permissions
  const canViewUserDetails = currentUser?.role === 'admin' || currentUser?.role === 'mentor' || currentUser?._id === id;

  // Redirect if not authorized
  useEffect(() => {
    if (currentUser && !canViewUserDetails) {
      navigate('/attendance');
    }
  }, [currentUser, canViewUserDetails, navigate]);

  // Fetch user details
  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userAPI.getUser(id);
      setUser(response.data.user || response.data);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err.response?.data?.error || 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user attendance
  const fetchUserAttendance = async () => {
    setAttendanceLoading(true);
    
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 100
      };
      
      const response = await attendanceAPI.getUserAttendance(id, params);
      setUserAttendance(response.data.attendance || response.data || []);
    } catch (err) {
      console.error('Error fetching user attendance:', err);
      showError(err.response?.data?.error || 'Failed to fetch attendance records');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  // Fetch attendance when user or date range changes
  useEffect(() => {
    if (id) {
      fetchUserAttendance();
    }
  }, [id, dateRange]);

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString) => {
    return formatDateIST(dateString, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return formatTimeIST(dateString);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-600';
      case 'mentor': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'text-green-600' : 'text-gray-400';
  };

  if (!currentUser || !canViewUserDetails) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-medium text-black mb-4">Access Denied</h1>
          <p className="text-xs text-gray-400 tracking-wider uppercase mb-8">
            You don't have permission to view this user's details
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-1 h-1 bg-black animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-medium text-black mb-4">Error</h1>
          <p className="text-xs text-red-500 tracking-wider uppercase mb-8">{error}</p>
          <button
            onClick={fetchUser}
            className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-medium text-black mb-4">User Not Found</h1>
          <p className="text-xs text-gray-400 tracking-wider uppercase mb-8">
            The requested user could not be found
          </p>
          <Link 
            to="/members" 
            className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200"
          >
            Back to Members
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-16 px-6">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-medium text-black tracking-tight">
              User Details
            </h1>
            <div className="flex space-x-4">
              {currentUser?.role === 'admin' && (
                <Link
                  to="/members"
                  className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200"
                >
                  Back to Members
                </Link>
              )}
              <Link
                to="/attendance"
                className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200"
              >
                Back to Attendance
              </Link>
            </div>
          </div>

          {/* User Information Card */}
          <div className="bg-gray-50 p-8 mb-8">
            <div className="flex items-start space-x-6">
              {/* Avatar */}
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center text-xl font-medium">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-xl font-medium text-black mb-2">{user.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400 tracking-wider uppercase text-xs">Email:</span>
                    <p className="text-black">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 tracking-wider uppercase text-xs">RFID Tag:</span>
                    <p className="text-black font-mono">{user.rfidTag}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 tracking-wider uppercase text-xs">Role:</span>
                    <p className={`capitalize ${getRoleColor(user.role)}`}>{user.role}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 tracking-wider uppercase text-xs">Status:</span>
                    <p className={`capitalize ${getStatusColor(user.status)}`}>{user.status}</p>
                  </div>
                  {user.phone && (
                    <div>
                      <span className="text-gray-400 tracking-wider uppercase text-xs">Phone:</span>
                      <p className="text-black">{user.phone}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400 tracking-wider uppercase text-xs">Joined:</span>
                    <p className="text-black">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-black tracking-tight">
              Attendance History
            </h3>
            <div className="text-xs text-gray-400 tracking-wider uppercase">
              {userAttendance.length} records
            </div>
          </div>

          {/* Date Range Controls */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 tracking-wider uppercase">From:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="border border-gray-200 px-3 py-2 text-xs focus:border-black focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 tracking-wider uppercase">To:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="border border-gray-200 px-3 py-2 text-xs focus:border-black focus:outline-none"
              />
            </div>
          </div>

          {/* Attendance Records */}
          <div className="space-y-px">
            {attendanceLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-1 h-1 bg-black animate-pulse"></div>
              </div>
            ) : userAttendance.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xs text-gray-400 tracking-wider uppercase">
                  No attendance records found for this date range
                </p>
              </div>
            ) : (
              userAttendance.map((record) => (
                <div 
                  key={record._id} 
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="text-sm text-black">Check-in</div>
                      <div className="text-xs text-gray-400">Record ID: {record._id.slice(-8)}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-black">
                      {formatTime(record.timestamp)}
                    </div>
                    <div className="text-xs text-gray-400 tracking-wider uppercase">
                      {formatDate(record.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
