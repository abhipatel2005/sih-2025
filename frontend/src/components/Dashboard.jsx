import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { userAPI, attendanceAPI } from '../api';
import { formatTimeIST, formatDateIST } from '../utils/dateUtils';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const [profile, setProfile] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get current month's first and last day
  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const profileResponse = await userAPI.getMyProfile();
      setProfile(profileResponse.data.user);
      
      const { startDate, endDate } = getCurrentMonthRange();
      
      // Different data fetching for admins vs regular users
      if (user?.role === 'admin' || user?.role === 'principal') {
        // For admins: Fetch system-wide attendance data
        const recentAttendanceResponse = await attendanceAPI.getAttendanceHistory({ 
          limit: 10,
          sortBy: 'timestamp',
          order: 'desc'
        });
        setAttendanceData(recentAttendanceResponse.data.attendance || []);
        
        // Get system-wide monthly statistics
        const monthlyAttendanceResponse = await attendanceAPI.getAttendanceHistory({ 
          startDate, 
          endDate,
          limit: 1000 // Get all records for the month
        });
        
        const monthlyAttendance = monthlyAttendanceResponse.data.attendance || [];
        
        // Calculate system-wide statistics
        const totalUsers = [...new Set(monthlyAttendance.map(record => record.userId))].length;
        const presentRecords = monthlyAttendance.filter(record => 
          record.status === 'present' || record.status === 'late'
        );
        const totalRecords = monthlyAttendance.length;
        
        // Calculate average attendance percentage across all users
        const workingDaysInMonth = 22;
        const avgAttendancePercentage = totalUsers > 0 
          ? Math.round((presentRecords.length / (totalUsers * Math.min(workingDaysInMonth, totalRecords / totalUsers || 1))) * 100)
          : 0;
        
        setAttendanceStats({
          attendanceDays: presentRecords.length,
          totalDays: totalRecords,
          totalUsers,
          workingDaysInMonth,
          attendancePercentage: Math.min(avgAttendancePercentage, 100)
        });
        
      } else {
        // For regular users: Fetch personal attendance data
        const recentAttendanceResponse = await attendanceAPI.getMyAttendance({ limit: 5 });
        setAttendanceData(recentAttendanceResponse.data.attendance || []);
        
        const monthlyAttendanceResponse = await attendanceAPI.getMyAttendance({ 
          startDate, 
          endDate, 
          limit: 100
        });
        
        const monthlyAttendance = monthlyAttendanceResponse.data.attendance || [];
        const attendanceDays = monthlyAttendance.filter(record => 
          record.status === 'present' || record.status === 'late'
        ).length;
        const totalDays = monthlyAttendance.length;
        const workingDaysInMonth = 22;
        const attendancePercentage = totalDays > 0 
          ? Math.round((attendanceDays / Math.min(totalDays, workingDaysInMonth)) * 100)
          : 0;
        
        setAttendanceStats({
          attendanceDays,
          totalDays,
          workingDaysInMonth,
          attendancePercentage: Math.min(attendancePercentage, 100)
        });
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Use utility functions for IST formatting
  const formatDate = (dateString) => formatDateIST(dateString);
  const formatTime = (dateString) => formatTimeIST(dateString);

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-600';
      case 'principal': return 'text-purple-600';
      case 'teacher': return 'text-blue-600';
      case 'student': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'text-green-600' : 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-xs text-gray-400 tracking-wider uppercase">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6 sm:mb-8">
            {/* Profile Picture */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
              {profile?.profilePicture ? (
                <img 
                  src={profile.profilePicture} 
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-base sm:text-lg font-medium text-gray-400">
                  {profile?.name?.charAt(0) || user?.name?.charAt(0)}
                </span>
              )}
            </div>
            
            {/* Welcome Message */}
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-medium text-black tracking-tight">
                Welcome back, {profile?.name || user?.name}
              </h1>
              <p className="text-xs text-gray-400 tracking-wider uppercase mt-1">
                {profile?.role || user?.role} • {profile?.email || user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* Attendance Percentage */}
          <div className="bg-gray-50 border border-gray-100 rounded-none p-4 sm:p-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-medium text-black mb-2">
                {attendanceStats?.attendancePercentage || 0}%
              </div>
              <p className="text-xs text-gray-400 tracking-wider uppercase">
                {(user?.role === 'admin' || user?.role === 'principal') ? 'System Attendance' : "This Month's Attendance"}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {(user?.role === 'admin' || user?.role === 'principal') 
                  ? `${attendanceStats?.totalUsers || 0} users tracked`
                  : `${attendanceStats?.attendanceDays || 0} of ${attendanceStats?.workingDaysInMonth || 22} days`
                }
              </p>
            </div>
          </div>

          {/* Attendance Records */}
          <div className="bg-gray-50 border border-gray-100 rounded-none p-4 sm:p-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-medium text-black mb-2">
                {attendanceStats?.attendanceDays || 0}
              </div>
              <p className="text-xs text-gray-400 tracking-wider uppercase">
                {(user?.role === 'admin' || user?.role === 'principal') ? 'Present Records' : 'Days Present'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {(user?.role === 'admin' || user?.role === 'principal') 
                  ? 'This month system-wide'
                  : 'This month'
                }
              </p>
            </div>
          </div>

          {/* Third Stat - Context Dependent */}
          <div className="bg-gray-50 border border-gray-100 rounded-none p-4 sm:p-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-medium text-black mb-2">
                {(user?.role === 'admin' || user?.role === 'principal') 
                  ? (attendanceStats?.totalDays || 0)
                  : (profile?.bio && profile?.skills?.length > 0 ? '100' : '50')
                }{(user?.role === 'admin' || user?.role === 'principal') ? '' : '%'}
              </div>
              <p className="text-xs text-gray-400 tracking-wider uppercase">
                {(user?.role === 'admin' || user?.role === 'principal') ? 'Total Records' : 'Profile Complete'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {(user?.role === 'admin' || user?.role === 'principal') 
                  ? 'All attendance entries'
                  : (profile?.bio && profile?.skills?.length > 0 ? 'All set!' : 'Add bio & skills')
                }
              </p>
            </div>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white border border-gray-100 rounded-none">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-medium text-black tracking-tight">
              Recent Attendance
            </h2>
            <p className="text-xs text-gray-400 tracking-wider uppercase mt-1">
              {(user?.role === 'admin' || user?.role === 'principal') ? 'Latest system records' : 'Last 5 check-ins'}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            {attendanceData.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {(user?.role === 'admin' || user?.role === 'principal') && (
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-400 tracking-wider uppercase">
                        User
                      </th>
                    )}
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-400 tracking-wider uppercase">
                      Date
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-400 tracking-wider uppercase">
                      Time
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-medium text-gray-400 tracking-wider uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendanceData.map((record, index) => {
                    const getStatusColor = (status) => {
                      switch (status?.toLowerCase()) {
                        case 'present':
                          return 'bg-green-100 text-green-800';
                        case 'absent':
                          return 'bg-red-100 text-red-800';
                        case 'late':
                          return 'bg-yellow-100 text-yellow-800';
                        case 'excused':
                          return 'bg-blue-100 text-blue-800';
                        default:
                          return 'bg-gray-100 text-gray-800';
                      }
                    };

                    // Handle different data structures for admin vs user
                    const recordUser = record.users || record.user || {};
                    const userName = recordUser.name || record.userName || 'Unknown User';
                    
                    return (
                      <tr key={record.id || index} className="hover:bg-gray-50 transition-colors duration-200">
                        {(user?.role === 'admin' || user?.role === 'principal') && (
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black">
                            <div>
                              <div className="font-medium">{userName}</div>
                              <div className="text-xs text-gray-500 capitalize">{recordUser.role || 'N/A'}</div>
                            </div>
                          </td>
                        )}
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black font-mono">
                          {record.timestamp ? formatTime(record.timestamp) : 'N/A'}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(record.status)}`}>
                            {record.status || 'present'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 sm:p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-8 sm:w-12 h-8 sm:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xs text-gray-400 tracking-wider uppercase">
                  No attendance records found
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {(user?.role === 'admin' || user?.role === 'principal') 
                    ? 'System attendance records will appear here'
                    : 'Your attendance history will appear here'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="flex-1 bg-black text-white px-4 sm:px-6 py-3 text-xs tracking-wider uppercase font-medium hover:bg-gray-800 transition-colors duration-200"
          >
            View Profile
          </button>
          
          {(user?.role === 'admin' || user?.role === 'principal' || user?.role === 'teacher') && (
            <button
              onClick={() => navigate('/attendance/history')}
              className="flex-1 border border-gray-300 text-black px-4 sm:px-6 py-3 text-xs tracking-wider uppercase font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              {(user?.role === 'admin' || user?.role === 'principal') ? 'System Attendance' : 'View Full History'}
            </button>
          )}
          
          {user?.role === 'teacher' && (
            <button
              onClick={() => navigate('/attendance/manual')}
              className="flex-1 border border-gray-300 text-black px-4 sm:px-6 py-3 text-xs tracking-wider uppercase font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Manual Entry
            </button>
          )}
          
          {(user?.role === 'admin' || user?.role === 'principal') && (
            <button
              onClick={() => navigate('/members')}
              className="flex-1 border border-gray-300 text-black px-4 sm:px-6 py-3 text-xs tracking-wider uppercase font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Manage Users
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
