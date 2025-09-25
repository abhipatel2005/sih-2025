import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { systemAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { formatTimeIST } from '../utils/dateUtils';

const SystemStatus = () => {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState(null);
  const [apiInfo, setApiInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  // Fetch system health
  const fetchHealth = async () => {
    try {
      const response = await systemAPI.healthCheck();
      setHealthData(response.data);
      setLastChecked(new Date());
    } catch (err) {
      console.error('Health check failed:', err);
      setError('Health check failed');
    }
  };

  // Fetch API info
  const fetchApiInfo = async () => {
    try {
      const response = await systemAPI.getApiInfo();
      setApiInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch API info:', err);
    }
  };

  // Fetch all system data
  const fetchSystemData = async () => {
    setLoading(true);
    setError(null);
    
    await Promise.all([
      fetchHealth(),
      fetchApiInfo()
    ]);
    
    setLoading(false);
  };

  // Initial data fetch
  useEffect(() => {
    fetchSystemData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHealth(); // Only refresh health, not API info
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getHealthStatus = () => {
    if (error) return { status: 'error', color: 'text-red-600', bg: 'bg-red-50' };
    if (!healthData) return { status: 'unknown', color: 'text-gray-600', bg: 'bg-gray-50' };
    if (healthData.status === 'OK') return { status: 'healthy', color: 'text-green-600', bg: 'bg-green-50' };
    return { status: 'unhealthy', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-6 sm:py-16 px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 sm:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-4 sm:space-y-0">
            <h1 className="text-lg font-medium text-black tracking-tight">
              System Status
            </h1>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <button
                onClick={fetchSystemData}
                disabled={loading}
                className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <Link
                to="/attendance"
                className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200 whitespace-nowrap"
              >
                Back to Attendance
              </Link>
            </div>
          </div>
          
          {lastChecked && (
            <div className="text-xs text-gray-400 tracking-wider uppercase">
              Last checked: {formatTimeIST(lastChecked)}
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="mb-8">
          <h2 className="text-base sm:text-lg font-medium text-black tracking-tight mb-4 sm:mb-6">Health Status</h2>
          
          <div className={`p-4 sm:p-6 ${healthStatus.bg} mb-4 sm:mb-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${healthStatus.color.replace('text-', 'bg-')}`}></div>
                <div>
                  <div className={`text-sm font-medium ${healthStatus.color} capitalize`}>
                    {healthStatus.status}
                  </div>
                  <div className="text-xs text-gray-400 tracking-wider uppercase">
                    {error ? error : (healthData?.status || 'Unknown')}
                  </div>
                </div>
              </div>
              
              {healthData && (
                <div className="text-left sm:text-right">
                  <div className="text-sm text-black">
                    {healthData.environment || 'Unknown'}
                  </div>
                  <div className="text-xs text-gray-400 tracking-wider uppercase">
                    Environment
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Health Details */}
          {healthData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <div className="bg-gray-50 p-4">
                <div className="text-xs text-gray-400 tracking-wider uppercase mb-2">Uptime</div>
                <div className="text-lg font-medium text-black">
                  {formatUptime(healthData.uptime)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4">
                <div className="text-xs text-gray-400 tracking-wider uppercase mb-2">Timestamp</div>
                <div className="text-sm text-black">
                  {new Date(healthData.timestamp).toLocaleString()}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 sm:col-span-2 lg:col-span-1">
                <div className="text-xs text-gray-400 tracking-wider uppercase mb-2">Status</div>
                <div className={`text-sm font-medium ${healthStatus.color}`}>
                  {healthData.status}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* API Information */}
        {apiInfo && (
          <div className="mb-8">
            <h2 className="text-base sm:text-lg font-medium text-black tracking-tight mb-4 sm:mb-6">API Information</h2>
            
            <div className="bg-gray-50 p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <div className="text-xs text-gray-400 tracking-wider uppercase mb-2">Name</div>
                  <div className="text-sm text-black">{apiInfo.name}</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-400 tracking-wider uppercase mb-2">Version</div>
                  <div className="text-sm text-black">{apiInfo.version}</div>
                </div>
                
                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-400 tracking-wider uppercase mb-2">Description</div>
                  <div className="text-sm text-black">{apiInfo.description}</div>
                </div>
                
                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-400 tracking-wider uppercase mb-2">Authentication</div>
                  <div className="text-sm text-black">{apiInfo.authentication}</div>
                </div>
              </div>
            </div>

            {/* Endpoints Overview */}
            {apiInfo.endpoints && (
              <div>
                <h3 className="text-sm font-medium text-black mb-4">Available Endpoints</h3>
                <div className="space-y-4">
                  {Object.entries(apiInfo.endpoints).map(([category, endpoints]) => (
                    <div key={category} className="bg-gray-50 p-4">
                      <div className="text-xs text-gray-400 tracking-wider uppercase mb-3 capitalize">
                        {category} Endpoints
                      </div>
                      <div className="space-y-2">
                        {Object.entries(endpoints).map(([endpoint, description]) => (
                          <div key={endpoint} className="flex justify-between items-start">
                            <code className="text-xs bg-white px-2 py-1 font-mono text-black">
                              {endpoint}
                            </code>
                            <span className="text-xs text-gray-400 ml-4 flex-1 text-right">
                              {description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-1 h-1 bg-black animate-pulse"></div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <h3 className="text-xs text-gray-400 tracking-wider uppercase mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/attendance"
              className="block p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="text-sm font-medium text-black mb-1">View Attendance</div>
              <div className="text-xs text-gray-400">Today's attendance records</div>
            </Link>
            
            {(user?.role === 'admin' || user?.role === 'mentor') && (
              <Link
                to="/attendance/history"
                className="block p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="text-sm font-medium text-black mb-1">Attendance History</div>
                <div className="text-xs text-gray-400">View historical records</div>
              </Link>
            )}
            
            {user?.role === 'admin' && (
              <Link
                to="/members"
                className="block p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="text-sm font-medium text-black mb-1">Manage Members</div>
                <div className="text-xs text-gray-400">User management</div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
