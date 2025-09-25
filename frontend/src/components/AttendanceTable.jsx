import React, { useState } from 'react';
import { formatTimeIST, formatDurationIST } from '../utils/dateUtils';

/**
 * AttendanceTable Component
 * 
 * Features:
 * - Shows current session entry/exit times for each user
 * - Sessions are selectable vi              <div className="w-20 text-center">
                {sessionCount > 1 ? (
                  <select
                    value={selectedSessions[record._id || record.id] ?? (sessionCount - 1)}
                    onChange={(e) => handleSessionSelect(record._id || record.id, parseInt(e.target.value))}
                    className="text-xs bg-blue-100 text-blue-800 border-0 rounded-full px-2 py-1 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sessions.map((_, sessionIndex) => (
                      <option key={sessionIndex} value={sessionIndex}>
                        #{sessionIndex + 1}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    1
                  </span>
                )}
              </div>s with multiple sessions
 * - Sessions reset daily (new day = new attendance record)
 * - Real-time status indicators (Active/Complete)
 * - Aligned table layout with consistent column widths
 */
const AttendanceTable = ({ attendanceData, loading, error, showUserInfo = true }) => {
  const [selectedSessions, setSelectedSessions] = useState({});
  // Use the utility function for IST time formatting
  const formatTime = (timestamp) => formatTimeIST(timestamp);

  // Use the utility function for duration formatting
  const formatDuration = (entryTime, exitTime) => formatDurationIST(entryTime, exitTime);

  const isComplete = (record) => {
    if (record.sessions && record.sessions.length > 0) {
      // Check if the last session has an exit time
      const lastSession = record.sessions[record.sessions.length - 1];
      return lastSession.exitTime !== null && lastSession.exitTime !== undefined;
    }
    // Fallback to legacy structure
    return record.entryTime && record.exitTime;
  };

  const getTotalDuration = (sessions) => {
    if (!sessions || sessions.length === 0) return '--';
    
    let totalMs = 0;
    sessions.forEach(session => {
      if (session.entryTime && session.exitTime) {
        const entry = new Date(session.entryTime);
        const exit = new Date(session.exitTime);
        const duration = exit - entry;
        if (duration > 0) {
          totalMs += duration;
        }
      }
    });
    
    if (totalMs === 0) return '--';
    
    // Convert total milliseconds to duration string
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
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

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-1 h-1 bg-black animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 text-center">
        <p className="text-xs text-gray-400 tracking-wider uppercase">Error</p>
      </div>
    );
  }

  if (!attendanceData || attendanceData.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-xs text-gray-400 tracking-wider uppercase">No entries</p>
      </div>
    );
  }

  return (
    <div className="space-y-px">
      {/* Header */}
      <div className="flex items-center py-4 border-b border-gray-200 text-xs text-gray-400 tracking-wider uppercase">
        {showUserInfo && <div className="w-48">Name</div>}
        <div className="w-20 text-center">Sessions</div>
        <div className="w-24 text-center">Entry</div>
        <div className="w-24 text-center">Exit</div>
        <div className="w-20 text-center">Duration</div>
        <div className="w-20 text-center">Status</div>
      </div>

      {/* Attendance Records */}
      {attendanceData.map((record, index) => {
        const complete = isComplete(record);
        const userName = record.userName || record.name || record.userId?.name || 'Unknown';
        const userRole = record.userRole || record.role || record.userId?.role;
        
        // Handle both new session structure and legacy structure
        const sessions = record.sessions || [];
        const sessionCount = sessions.length;
        const firstEntry = sessions.length > 0 ? sessions[0].entryTime : (record.entryTime || record.timestamp);
        const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
        const lastExit = lastSession ? lastSession.exitTime : record.exitTime;
        const totalDuration = getTotalDuration(sessions);
        const isCurrentlyInside = record.isCurrentlyInside || (!lastExit && firstEntry);
        const selectedSession = getSelectedSession(record._id || record.id, sessions);
        
        return (
          <div 
            key={record._id || record.id || index} 
            className={`group hover:bg-gray-50/50 transition-colors duration-200`}
          >
            {/* Main row */}
            <div className="flex items-center py-6 border-b border-gray-100 last:border-b-0">
              {showUserInfo && (
                <div className="w-48 flex items-center space-x-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-black tracking-tight truncate">
                      {userName}
                    </p>
                    {userRole && (
                      <p className="text-xs text-gray-400 tracking-wider uppercase mt-1">
                        {userRole}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="w-20 text-center">
                {sessionCount > 1 ? (
                  <select
                    value={selectedSessions[record._id || record.id] ?? (sessionCount - 1)}
                    onChange={(e) => handleSessionSelect(record._id || record.id, parseInt(e.target.value))}
                    className="text-xs bg-blue-100 text-blue-800 border-0 rounded-full px-2 py-1 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sessions.map((_, sessionIndex) => (
                      <option key={sessionIndex} value={sessionIndex}>
                        {sessionIndex + 1}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    1
                  </span>
                )}
              </div>
              
              <div className="w-24 text-center">
                <p className="text-xs text-gray-900 tracking-wider font-mono">
                  {formatTime(selectedSession?.entryTime || firstEntry)}
                </p>
              </div>
              
              <div className="w-24 text-center">
                <p className={`text-xs tracking-wider font-mono ${
                  selectedSession?.exitTime ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {selectedSession?.exitTime ? formatTime(selectedSession.exitTime) : '--'}
                </p>
                {selectedSession?.autoExitSet && (
                  <p className="text-xs text-orange-500 mt-1">Auto</p>
                )}
              </div>
              
              <div className="w-20 text-center">
                <p className="text-xs text-gray-600 tracking-wider font-mono">
                  {totalDuration}
                </p>
              </div>
              
              <div className="w-20 text-center">
                {selectedSession?.exitTime || (sessions.length === 0 && lastExit) ? (
                  <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AttendanceTable;
