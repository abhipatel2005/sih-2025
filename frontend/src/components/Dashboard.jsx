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
  const [selectedSessions, setSelectedSessions] = useState({});

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

  const getSelectedSession = (recordId, sessions) => {
    const sessionIndex = selectedSessions[recordId];
    // Default to last session (most recent) if no selection
    if (sessionIndex === undefined) {
      return sessions[sessions.length - 1];
    }
    return sessions[sessionIndex] || sessions[sessions.length - 1];
  };

  const handleSessionSelect = (recordId, sessionIndex) => {
    setSelectedSessions(prev => ({
      ...prev,
      [recordId]: sessionIndex
    }));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const profileResponse = await userAPI.getMyProfile();
      setProfile(profileResponse.data.user);
      
      // Fetch recent attendance (last 5 records) using new endpoint
      const recentAttendanceResponse = await attendanceAPI.getMyAttendance({ limit: 5 });
      setAttendanceData(recentAttendanceResponse.data.attendance);
      
      // Fetch current month's attendance for statistics
      const { startDate, endDate } = getCurrentMonthRange();
      const monthlyAttendanceResponse = await attendanceAPI.getMyAttendance({ 
        startDate, 
        endDate, 
        limit: 100 // Get all records for the month
      });
      
      // Calculate attendance percentage (assuming 22 working days per month)
      const attendanceDays = monthlyAttendanceResponse.data.attendance.length;
      const workingDaysInMonth = 22; // Approximate working days
      const attendancePercentage = Math.round((attendanceDays / workingDaysInMonth) * 100);
      
      setAttendanceStats({
        attendanceDays,
        workingDaysInMonth,
        attendancePercentage: Math.min(attendancePercentage, 100) // Cap at 100%
      });
      
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
                This Month's Attendance
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {attendanceStats?.attendanceDays || 0} of {attendanceStats?.workingDaysInMonth || 22} days
              </p>
            </div>
          </div>

          {/* Total Attendance Days */}
          <div className="bg-gray-50 border border-gray-100 rounded-none p-4 sm:p-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-medium text-black mb-2">
                {attendanceStats?.attendanceDays || 0}
              </div>
              <p className="text-xs text-gray-400 tracking-wider uppercase">
                Days Present
              </p>
              <p className="text-xs text-gray-500 mt-2">
                This month
              </p>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="bg-gray-50 border border-gray-100 rounded-none p-4 sm:p-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-medium text-black mb-2">
                {profile?.bio && profile?.skills?.length > 0 ? '100' : '50'}%
              </div>
              <p className="text-xs text-gray-400 tracking-wider uppercase">
                Profile Complete
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {profile?.bio && profile?.skills?.length > 0 ? 'All set!' : 'Add bio & skills'}
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
              Last 5 check-ins
            </p>
          </div>
          
          <div className="overflow-x-auto">
            {attendanceData.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-400 tracking-wider uppercase">
                      Date
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-400 tracking-wider uppercase">
                      Entry Time
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-400 tracking-wider uppercase">
                      Exit Time
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-medium text-gray-400 tracking-wider uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendanceData.map((record, index) => {
                    // Handle both new session structure and legacy structure  
                    const sessions = record.sessions || [];
                    const sessionCount = sessions.length;
                    const selectedSession = getSelectedSession(record._id || record.id, sessions);
                    const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
                    const hasExit = selectedSession ? selectedSession.exitTime : (lastSession ? lastSession.exitTime : record.exitTime);
                    const entryTime = selectedSession ? selectedSession.entryTime : (lastSession ? lastSession.entryTime : (record.entryTime || record.timestamp));
                    const isCurrentlyInside = record.isCurrentlyInside || (!hasExit && entryTime);
                    
                    return (
                      <tr key={record._id || record.id || index} className={`hover:bg-gray-50 transition-colors duration-200 ${hasExit ? 'bg-green-50/30' : ''}`}>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black">
                          {formatDate(record.date || entryTime)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black font-mono">
                          <div className="flex items-center justify-between">
                            <span>{formatTime(entryTime)}</span>
                            {sessionCount > 1 && (
                              <select
                                value={selectedSessions[record._id || record.id] ?? (sessionCount - 1)}
                                onChange={(e) => handleSessionSelect(record._id || record.id, parseInt(e.target.value))}
                                className="ml-2 text-xs bg-blue-100 text-blue-800 border-0 rounded px-1 py-0.5 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {sessions.map((_, sessionIndex) => (
                                  <option key={sessionIndex} value={sessionIndex}>
                                    {sessionIndex + 1}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-mono">
                          {hasExit ? (
                            <span className="text-black">{formatTime(hasExit)}</span>
                          ) : (
                            <span className="text-gray-400">Not yet logged</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                          {hasExit ? (
                            <div className="inline-flex items-center space-x-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Complete
                              </span>
                              <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              In Progress
                            </span>
                          )}
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
                  Your attendance history will appear here
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
          {(user?.role === 'admin' || user?.role === 'mentor') && (
            <button
              onClick={() => navigate('/attendance/history')}
              className="flex-1 border border-gray-300 text-black px-4 sm:px-6 py-3 text-xs tracking-wider uppercase font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              View Full History
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
