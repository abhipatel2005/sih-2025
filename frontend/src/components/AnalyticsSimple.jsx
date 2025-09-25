// Simplified Analytics Component with safer imports
// Use this version if you encounter persistent icon import issues

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Using simple div icons instead of heroicons to avoid import issues
const SimpleIcons = {
  Chart: () => <div className="w-6 h-6 bg-gray-400 rounded"></div>,
  School: () => <div className="w-6 h-6 bg-gray-400 rounded"></div>,
  Users: () => <div className="w-6 h-6 bg-gray-400 rounded"></div>,
  Clock: () => <div className="w-6 h-6 bg-gray-400 rounded"></div>,
  Trend: () => <div className="w-4 h-4 bg-green-500 rounded"></div>
};

const AnalyticsSimple = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    schools: [],
    attendance: [],
    users: [],
    stats: {
      totalSchools: 0,
      totalUsers: 0,
      activeUsers: 0,
      todayAttendance: 0,
      avgAttendanceRate: 0
    }
  });

  const colors = {
    primary: '#000000',
    secondary: '#374151',
    accent: '#6B7280',
    light: '#F3F4F6',
    success: '#10B981'
  };

  const CHART_COLORS = [colors.primary, colors.secondary, colors.accent, colors.success];

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);

      // Use sample data if database is not ready
      const sampleData = {
        schools: [
          { district: 'Chandigarh', count: 15, percentage: '25.0' },
          { district: 'Ludhiana', count: 12, percentage: '20.0' },
          { district: 'Amritsar', count: 10, percentage: '16.7' },
          { district: 'Jalandhar', count: 8, percentage: '13.3' }
        ],
        users: [
          { role: 'Member', count: 45, percentage: '75.0' },
          { role: 'Mentor', count: 12, percentage: '20.0' },
          { role: 'Admin', count: 3, percentage: '5.0' }
        ],
        attendance: [
          { day: 'Mon', attendance: 48, rate: '80.0' },
          { day: 'Tue', attendance: 45, rate: '75.0' },
          { day: 'Wed', attendance: 50, rate: '83.3' },
          { day: 'Thu', attendance: 38, rate: '63.3' },
          { day: 'Fri', attendance: 42, rate: '70.0' }
        ],
        schoolTypes: [
          { type: 'Primary', count: 25, percentage: '41.7' },
          { type: 'Secondary', count: 20, percentage: '33.3' },
          { type: 'High School', count: 12, percentage: '20.0' }
        ],
        stats: {
          totalSchools: 60,
          totalUsers: 60,
          activeUsers: 57,
          todayAttendance: 50,
          avgAttendanceRate: 72
        }
      };

      setAnalyticsData(sampleData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const StatCard = ({ title, value, subtitle, IconComponent }) => (
    <div className="bg-white border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 tracking-wider uppercase">{title}</p>
          <p className="text-2xl font-bold text-black mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
          {IconComponent && <IconComponent />}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-xs text-gray-400 tracking-wider uppercase">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-xl sm:text-2xl font-medium text-black tracking-tight mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-xs text-gray-400 tracking-wider uppercase">
            School and attendance insights
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Schools"
            value={analyticsData.stats.totalSchools}
            subtitle="Registered institutions"
            IconComponent={SimpleIcons.School}
          />
          <StatCard
            title="Total Users"
            value={analyticsData.stats.totalUsers}
            subtitle={`${analyticsData.stats.activeUsers} active`}
            IconComponent={SimpleIcons.Users}
          />
          <StatCard
            title="Today's Attendance"
            value={analyticsData.stats.todayAttendance}
            subtitle={`${analyticsData.stats.avgAttendanceRate}% rate`}
            IconComponent={SimpleIcons.Clock}
          />
          <StatCard
            title="Avg. Attendance Rate"
            value={`${analyticsData.stats.avgAttendanceRate}%`}
            subtitle="Last 7 days"
            IconComponent={SimpleIcons.Chart}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Schools by District */}
          <div className="bg-white border border-gray-100 p-6">
            <h2 className="text-lg font-medium text-black tracking-tight mb-6">
              Schools by District
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.schools} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="district" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip />
                <Bar dataKey="count" fill={colors.primary} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Users by Role */}
          <div className="bg-white border border-gray-100 p-6">
            <h2 className="text-lg font-medium text-black tracking-tight mb-6">
              User Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.users}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {analyticsData.users.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#6B7280' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Trends */}
        <div className="bg-white border border-gray-100 p-6">
          <h2 className="text-lg font-medium text-black tracking-tight mb-6">
            Attendance Trends (Last 5 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.attendance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="attendance"
                stroke={colors.primary}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#attendanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSimple;