import React, { useState, useEffect } from 'react';
import { supabase } from '../config/SupaBaseClient';
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
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  ChartBarIcon, 
  UsersIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    schoolsByDistrict: [],
    usersByRole: [],
    attendanceByDay: [],
    attendanceByHour: [],
    stats: {
      totalSchools: 0,
      totalUsers: 0,
      activeUsers: 0,
      todayAttendance: 0,
      avgAttendanceRate: 0,
      totalAttendanceRecords: 0
    }
  });

  // Color palette for charts - matches website's minimalist aesthetic
  const colors = {
    primary: '#000000',
    secondary: '#374151',
    accent: '#6B7280',
    light: '#F3F4F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
  };

  const CHART_COLORS = [colors.primary, colors.secondary, colors.accent, colors.success, colors.warning];

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch schools data
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*');

      // Fetch users data
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      // Fetch attendance data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*, users(name, role)')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (schoolsError || usersError || attendanceError) {
        console.error('Error fetching analytics data:', { schoolsError, usersError, attendanceError });
        return;
      }

      // Process the data
      const processedData = processAnalyticsData(schoolsData || [], usersData || [], attendanceData || []);
      setAnalyticsData(processedData);

    } catch (error) {
      console.error('Error in fetchAnalyticsData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const processAnalyticsData = (schools, users, attendance) => {
    // Basic stats
    const totalSchools = schools.length;
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'active').length;
    
    // Today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(record => 
      record.date === today || record.created_at?.split('T')[0] === today
    ).length;

    // Calculate average attendance rate (simplified)
    const avgAttendanceRate = totalUsers > 0 ? ((todayAttendance / totalUsers) * 100) : 0;

    // Process schools by district for chart
    const schoolsByDistrict = schools.reduce((acc, school) => {
      const district = school.district || 'Unknown';
      acc[district] = (acc[district] || 0) + 1;
      return acc;
    }, {});

    const schoolsChartData = Object.entries(schoolsByDistrict).map(([district, count]) => ({
      district,
      count,
      percentage: ((count / totalSchools) * 100).toFixed(1)
    }));

    // Process users by role
    const usersByRole = users.reduce((acc, user) => {
      const role = user.role || 'member';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const usersChartData = Object.entries(usersByRole).map(([role, count]) => ({
      role: role.charAt(0).toUpperCase() + role.slice(1),
      count,
      percentage: ((count / totalUsers) * 100).toFixed(1)
    }));

    // Process attendance trends (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const attendanceTrends = last7Days.map(date => {
      const dayAttendance = attendance.filter(record => 
        record.date === date || record.created_at?.split('T')[0] === date
      ).length;
      
      return {
        date,
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        attendance: dayAttendance,
        rate: totalUsers > 0 ? ((dayAttendance / totalUsers) * 100).toFixed(1) : 0
      };
    });

    // School type distribution (if available)
    const schoolTypes = schools.reduce((acc, school) => {
      const type = school.type || school.name?.includes('Primary') ? 'Primary' : 
                   school.name?.includes('High') ? 'High School' : 
                   school.name?.includes('Secondary') ? 'Secondary' : 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const schoolTypesData = Object.entries(schoolTypes).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / totalSchools) * 100).toFixed(1)
    }));

    return {
      schools: schoolsChartData,
      attendance: attendanceTrends,
      users: usersChartData,
      schoolTypes: schoolTypesData,
      stats: {
        totalSchools,
        totalUsers,
        activeUsers,
        todayAttendance,
        avgAttendanceRate: Math.round(avgAttendanceRate)
      }
    };
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
    <div className="bg-white border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 tracking-wider uppercase">{title}</p>
          <p className="text-2xl font-bold text-black mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
            <Icon className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-xs text-green-600 font-medium">{trend}</span>
        </div>
      )}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-sm shadow-lg p-3">
          <p className="text-xs font-medium text-gray-600 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.payload.percentage && ` (${entry.payload.percentage}%)`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
            icon={BuildingOffice2Icon}
          />
          <StatCard
            title="Total Users"
            value={analyticsData.stats.totalUsers}
            subtitle={`${analyticsData.stats.activeUsers} active`}
            icon={UserGroupIcon}
          />
          <StatCard
            title="Today's Attendance"
            value={analyticsData.stats.todayAttendance}
            subtitle={`${analyticsData.stats.avgAttendanceRate}% rate`}
            icon={ClockIcon}
            trend={analyticsData.stats.avgAttendanceRate > 70 ? "+5% from yesterday" : "Below average"}
          />
          <StatCard
            title="Avg. Attendance Rate"
            value={`${analyticsData.stats.avgAttendanceRate}%`}
            subtitle="Last 7 days"
            icon={ChartBarIcon}
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
                <XAxis 
                  dataKey="district" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip content={<CustomTooltip />} />
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
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', color: '#6B7280' }}
                  formatter={(value, entry) => `${value} (${entry.payload.percentage}%)`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Attendance Trend */}
          <div className="bg-white border border-gray-100 p-6">
            <h2 className="text-lg font-medium text-black tracking-tight mb-6">
              Attendance Trends (Last 7 Days)
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
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip content={<CustomTooltip />} />
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

          {/* School Types Distribution */}
          <div className="bg-white border border-gray-100 p-6">
            <h2 className="text-lg font-medium text-black tracking-tight mb-6">
              School Types
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.schoolTypes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis 
                  dataKey="type" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill={colors.secondary}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Summary */}
        <div className="mt-8 bg-gray-50 border border-gray-100 p-6">
          <h2 className="text-lg font-medium text-black tracking-tight mb-4">
            Data Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                Schools Distribution
              </p>
              {analyticsData.schools.map((item, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span className="text-gray-600">{item.district}</span>
                  <span className="font-medium text-black">{item.count} ({item.percentage}%)</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                User Roles
              </p>
              {analyticsData.users.map((item, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span className="text-gray-600">{item.role}</span>
                  <span className="font-medium text-black">{item.count} ({item.percentage}%)</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                Recent Activity
              </p>
              <div className="space-y-1">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Today's Check-ins</span>
                  <span className="font-medium text-black">{analyticsData.stats.todayAttendance}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Active Users</span>
                  <span className="font-medium text-black">{analyticsData.stats.activeUsers}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Attendance Rate</span>
                  <span className="font-medium text-black">{analyticsData.stats.avgAttendanceRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;