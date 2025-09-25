import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import AttendanceTable from './AttendanceTable';
import SearchBar from './SearchBar';
import { formatDateIST, formatTimeIST } from '../utils/dateUtils';

const AttendanceHistory = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch attendance history
  const fetchAttendanceHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 100
      };
      
      const response = await attendanceAPI.getAttendanceHistory(params);
      setAttendanceData(response.data.attendance || response.data);
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setError(err.response?.data?.error || 'Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance statistics
  const fetchStats = async () => {
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      const response = await attendanceAPI.getAttendanceStats(params);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Delete attendance record
  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    try {
      await attendanceAPI.deleteAttendance(recordId);
      success('Attendance record deleted successfully');
      fetchAttendanceHistory();
      fetchStats();
    } catch (err) {
      console.error('Error deleting record:', err);
      showError(err.response?.data?.error || 'Failed to delete attendance record');
    }
  };

  // Filter data based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(attendanceData);
    } else {
      const filtered = attendanceData.filter(record => {
        // Handle different data structures:
        // 1. History API: userName, userEmail, userRfidTag
        // 2. Today API: name, email, rfidTag 
        // 3. Legacy: userId.name, userId.email, userId.rfidTag
        const userName = record.userName || record.name || record.userId?.name || '';
        const userEmail = record.userEmail || record.email || record.userId?.email || '';
        const userRfid = record.userRfidTag || record.rfidTag || record.userId?.rfidTag || '';
        
        return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
               userRfid.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredData(filtered);
    }
  }, [attendanceData, searchTerm]);

  // Fetch data when date range changes
  useEffect(() => {
    fetchAttendanceHistory();
    fetchStats();
  }, [dateRange]);

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString) => {
    return formatDateIST(dateString);
  };

  const formatTime = (dateString) => {
    return formatTimeIST(dateString);
  };

  // Check if user can delete records (admin or mentor)
  const canDeleteRecords = user?.role === 'admin' || user?.role === 'mentor';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto py-6 sm:py-16 px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 sm:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-4 sm:space-y-0">
            <h1 className="text-lg font-medium text-black tracking-tight">
              Attendance History
            </h1>
            <Link
              to="/attendance"
              className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200 whitespace-nowrap"
            >
              Back to Today's Attendance
            </Link>
          </div>
          
          {/* Statistics */}
          {stats && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-gray-400 tracking-wider uppercase mb-6">
              <span>{stats.totalRecords || filteredData.length} total records</span>
              <span>•</span>
              <span>{stats.uniqueUsers || new Set(filteredData.map(r => r.userId?._id)).size} unique users</span>
              {stats.averageDaily && (
                <>
                  <span>•</span>
                  <span>{Math.round(stats.averageDaily)} avg daily</span>
                </>
              )}
            </div>
          )}

          {/* Date Range Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-4 mb-6">
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
        </div>

        {/* Search Bar */}
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={handleSearchChange}
          placeholder="Search by name, email, or RFID tag..."
        />

        {/* Attendance History Table */}
        <AttendanceTable 
          attendanceData={filteredData}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default AttendanceHistory;
