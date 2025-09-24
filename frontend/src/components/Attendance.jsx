import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AttendanceTable from './AttendanceTable';
import SearchBar from './SearchBar';
import { attendanceAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { formatTimeIST } from '../utils/dateUtils';

const Attendance = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch attendance data from the backend
  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await attendanceAPI.getTodayAttendance();
      setAttendanceData(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(err.response?.data?.error || 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(attendanceData);
    } else {
      const filtered = attendanceData.filter(record =>
        record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [attendanceData, searchTerm]);

  // Initial data fetch
  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAttendanceData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleRefresh = () => {
    fetchAttendanceData();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto py-6 sm:py-16 px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 sm:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-4 sm:space-y-0">
            <h1 className="text-lg font-medium text-black tracking-tight">
              Today's Attendance
            </h1>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {(user?.role === 'admin' || user?.role === 'mentor') && (
                <>
                  <Link
                    to="/attendance/history"
                    className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200"
                  >
                    History
                  </Link>
                  <Link
                    to="/attendance/manual"
                    className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200 whitespace-nowrap"
                  >
                    Manual Entry
                  </Link>
                </>
              )}
              <Link
                to="/system-status"
                className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200 whitespace-nowrap"
              >
                System Status
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-400 tracking-wider uppercase">
            <span>{attendanceData.length} entries</span>
            {lastUpdated && (
              <span className="hidden sm:inline">Updated {formatTimeIST(lastUpdated)}</span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="hover:text-black transition-colors duration-200 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={handleSearchChange} 
        />

        {/* Attendance Table */}
        <AttendanceTable 
          attendanceData={filteredData}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default Attendance;
