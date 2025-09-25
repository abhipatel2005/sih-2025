import React, { useState, useEffect } from 'react';
import { supabase } from '../config/SupaBaseClient';
import {
  ChartBarIcon,
  BuildingOffice2Icon,
  UsersIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  FunnelIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

// Professional chart components with proper X-Y axes - Fully Responsive
const ProfessionalBarChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-gray-500 text-center py-8">No data available</div>;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];
  
  // Create Y-axis scale (0 to maxValue with 5 intervals)
  const yAxisSteps = 5;
  const stepSize = Math.ceil(maxValue / yAxisSteps);
  const yAxisLabels = [];
  for (let i = 0; i <= yAxisSteps; i++) {
    yAxisLabels.push(i * stepSize);
  }
  const chartMaxValue = yAxisSteps * stepSize;
  
  // Responsive dimensions
  const isMobile = window.innerWidth < 640; // sm breakpoint
  const isTablet = window.innerWidth < 1024; // lg breakpoint
  
  return (
    <div className="p-3 sm:p-6">
      <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">District-wise Attendance Records</h3>
      <div className="relative w-full overflow-x-auto">
        {/* SVG Chart with proper X-Y axes - Responsive */}
        <svg 
          width="100%" 
          height={isMobile ? "300" : isTablet ? "340" : "380"} 
          viewBox={`0 0 ${Math.max(400, data.length * (isMobile ? 50 : 60))} ${isMobile ? 300 : isTablet ? 340 : 380}`}
          className="bg-gray-50 rounded border overflow-visible"
          style={{ 
            minWidth: isMobile ? Math.max(300, data.length * 40) + 'px' : 
                     isTablet ? Math.max(400, data.length * 60) + 'px' : 
                     Math.max(500, data.length * 80) + 'px' 
          }}
        >
          {/* Y-axis grid lines and labels - Responsive */}
          {yAxisLabels.map((value, index) => {
            const chartHeight = isMobile ? 220 : isTablet ? 240 : 250;
            const baseY = isMobile ? 250 : isTablet ? 270 : 300;
            const y = baseY - (index / yAxisSteps) * chartHeight;
            const rightX = Math.max(350, data.length * (isMobile ? 40 : isTablet ? 50 : 60)) - 20;
            
            return (
              <g key={`y-${index}`}>
                {/* Grid line */}
                <line 
                  x1={isMobile ? "40" : "60"} 
                  y1={y} 
                  x2={rightX} 
                  y2={y} 
                  stroke="#E5E7EB" 
                  strokeWidth="1" 
                  strokeDasharray={index === 0 ? "none" : "2,2"}
                />
                {/* Y-axis label */}
                <text 
                  x={isMobile ? "35" : "45"} 
                  y={y + 4} 
                  textAnchor="end" 
                  className={`fill-gray-600 ${isMobile ? 'text-[10px]' : 'text-xs'} font-medium`}
                >
                  {value}
                </text>
              </g>
            );
          })}
          
          {/* X-axis line */}
          <line 
            x1={isMobile ? "40" : "60"} 
            y1={isMobile ? "250" : isTablet ? "270" : "300"} 
            x2={Math.max(350, data.length * (isMobile ? 40 : isTablet ? 50 : 60)) - 20} 
            y2={isMobile ? "250" : isTablet ? "270" : "300"} 
            stroke="#374151" 
            strokeWidth="2"
          />
          
          {/* Y-axis line */}
          <line 
            x1={isMobile ? "40" : "60"} 
            y1="30" 
            x2={isMobile ? "40" : "60"} 
            y2={isMobile ? "250" : isTablet ? "270" : "300"} 
            stroke="#374151" 
            strokeWidth="2"
          />
          
          {/* Bars - Responsive */}
          {data.map((item, index) => {
            const chartWidth = Math.max(300, data.length * (isMobile ? 35 : isTablet ? 45 : 55)) - 80;
            const barWidth = Math.min(
              isMobile ? 25 : isTablet ? 35 : 50, 
              Math.max(isMobile ? 15 : 20, (chartWidth / data.length) - 10)
            );
            const spacing = (chartWidth / data.length);
            const startX = isMobile ? 50 : 70;
            const x = startX + index * spacing + (spacing - barWidth) / 2;
            
            const chartHeight = isMobile ? 220 : isTablet ? 240 : 250;
            const baseY = isMobile ? 250 : isTablet ? 270 : 300;
            const barHeight = (item.value / chartMaxValue) * chartHeight;
            const y = baseY - barHeight;
            
            // Determine text rotation and positioning based on screen size and data
            const shouldRotate = data.length > (isMobile ? 4 : isTablet ? 6 : 8) || item.name.length > (isMobile ? 6 : 10);
            const textY = shouldRotate ? (isMobile ? "280" : isTablet ? "300" : "335") : (isMobile ? "265" : isTablet ? "285" : "320");
            const textClass = isMobile ? "text-[8px]" : shouldRotate ? "text-[10px]" : "text-xs";
            
            return (
              <g key={item.name}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={colors[index % colors.length]}
                  className="hover:opacity-80 transition-opacity duration-200"
                  rx="3"
                />
                
                {/* Value label on top of bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  className="fill-gray-700 text-xs font-semibold"
                >
                  {item.value}
                </text>
                
                {/* X-axis label with smart rotation */}
                <text
                  x={x + barWidth / 2}
                  y={textY}
                  textAnchor={shouldRotate ? "end" : "middle"}
                  className={`fill-gray-700 ${textClass} font-medium`}
                  transform={shouldRotate ? `rotate(-45, ${x + barWidth / 2}, ${textY})` : ''}
                >
                  {shouldRotate && item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name}
                </text>
                
                {/* Hover tooltip background */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="transparent"
                  className="hover:fill-black hover:fill-opacity-10"
                >
                  <title>{item.name}: {item.value} records</title>
                </rect>
              </g>
            );
          })}
          
          {/* Axis Labels - Responsive */}
          <text 
            x={Math.max(200, data.length * (isMobile ? 20 : 30))} 
            y={isMobile ? "290" : isTablet ? "330" : "370"} 
            textAnchor="middle" 
            className={`fill-gray-800 ${isMobile ? 'text-xs' : 'text-sm'} font-semibold`}
          >
            Districts
          </text>
          
          <text 
            x={isMobile ? "15" : "25"} 
            y={isMobile ? "140" : isTablet ? "155" : "175"} 
            textAnchor="middle" 
            className={`fill-gray-800 ${isMobile ? 'text-xs' : 'text-sm'} font-semibold`}
            transform={`rotate(-90, ${isMobile ? "15" : "25"}, ${isMobile ? "140" : isTablet ? "155" : "175"})`}
          >
            {isMobile ? "Count" : "Attendance Count"}
          </text>
        </svg>
        
        {/* Legend */}
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-600">
            Showing attendance records grouped by district
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfessionalPieChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-gray-500 text-center py-8">No data available</div>;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];
  
  // Calculate angles for each slice
  let currentAngle = 0;
  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const slice = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: colors[index % colors.length]
    };
    currentAngle += angle;
    return slice;
  });
  
  // Create SVG pie chart
  const createPieSlice = (slice, index) => {
    const { startAngle, endAngle, color } = slice;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    
    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    return (
      <path
        key={index}
        d={pathData}
        fill={color}
        stroke="white"
        strokeWidth="2"
        className="hover:opacity-80 transition-opacity duration-200"
      />
    );
  };
  
  // Responsive design
  const isMobile = window.innerWidth < 640;
  const isTablet = window.innerWidth < 1024;
  
  return (
    <div className="p-3 sm:p-6">
      <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Pie Chart Distribution</h3>
      <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-8">
        {/* Centered Pie Chart */}
        <div className="flex justify-center items-center flex-shrink-0">
          <div className="relative">
            <svg 
              width={isMobile ? "160" : isTablet ? "200" : "240"} 
              height={isMobile ? "160" : isTablet ? "200" : "240"} 
              viewBox="0 0 200 200" 
              className="drop-shadow-lg mx-auto"
              style={{ display: 'block' }}
            >
              {slices.map(createPieSlice)}
            </svg>
          </div>
        </div>
        {/* Legend - Centered on mobile, side-aligned on desktop */}
        <div className={`${isMobile ? 'w-full max-w-xs' : 'flex-1 min-w-0'}`}>
          <div className={`space-y-2 ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
            {slices.map((slice) => (
              <div key={slice.name} className={`flex items-center justify-between ${isMobile ? 'text-xs' : ''}`}>
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div
                    className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded-full flex-shrink-0`}
                    style={{ backgroundColor: slice.color }}
                  ></div>
                  <span className={`font-medium text-gray-900 ${isMobile ? 'text-xs' : ''} truncate`}>
                    {isMobile && slice.name.length > 12 ? slice.name.substring(0, 12) + '...' : slice.name}
                  </span>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className={`font-bold text-gray-900 ${isMobile ? 'text-xs' : ''}`}>{slice.value}</div>
                  <div className={`text-gray-500 ${isMobile ? 'text-[10px]' : 'text-sm'}`}>{slice.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfessionalLineChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-gray-500 text-center py-8">No data available</div>;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  // Responsive dimensions
  const isMobile = window.innerWidth < 640;
  const isTablet = window.innerWidth < 1024;
  
  const chartWidth = isMobile ? 280 : isTablet ? 350 : 400;
  const chartHeight = isMobile ? 120 : isTablet ? 140 : 160;
  
  // Create SVG line chart with responsive points
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((item.value - minValue) / range) * (chartHeight - 40);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="p-3 sm:p-6">
      <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Line Chart Trend</h3>
      <div className="relative overflow-x-auto">
        <svg 
          width="100%" 
          height={isMobile ? "160" : isTablet ? "180" : "200"} 
          viewBox={`0 0 ${chartWidth + 40} ${chartHeight + 40}`} 
          className="border border-gray-200 rounded bg-gray-50"
          style={{ minWidth: isMobile ? '300px' : '350px' }}
        >
          {/* Grid lines - Responsive */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={`grid-${i}`}
              x1="20"
              y1={20 + i * (chartHeight / 4)}
              x2={chartWidth + 20}
              y2={20 + i * (chartHeight / 4)}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}
          
          {/* Y-axis */}
          <line x1="20" y1="20" x2="20" y2={chartHeight + 20} stroke="#374151" strokeWidth="2"/>
          
          {/* X-axis */}
          <line x1="20" y1={chartHeight + 20} x2={chartWidth + 20} y2={chartHeight + 20} stroke="#374151" strokeWidth="2"/>
          
          {/* Line */}
          <polyline
            points={points.split(' ').map(point => {
              const [x, y] = point.split(',');
              return `${parseFloat(x) + 20},${parseFloat(y) + 20}`;
            }).join(' ')}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={isMobile ? "2" : "3"}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * chartWidth + 20;
            const y = chartHeight + 20 - ((item.value - minValue) / range) * (chartHeight - 40);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={isMobile ? "3" : "4"}
                fill="#3B82F6"
                stroke="white"
                strokeWidth="2"
                className="hover:opacity-80 transition-all duration-200"
              >
                <title>{item.name}: {item.value}</title>
              </circle>
            );
          })}
        </svg>
        
        {/* Labels - Responsive */}
        <div className={`flex justify-between mt-2 px-2 sm:px-5 ${isMobile ? 'overflow-x-auto' : ''}`}>
          {data.map((item, index) => (
            <div key={index} className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-600 text-center flex flex-col items-center flex-shrink-0 ${isMobile ? 'min-w-[60px]' : ''}`}>
              <span className="font-medium truncate w-full">
                {isMobile && item.name.length > 6 ? item.name.substring(0, 6) + '...' : item.name}
              </span>
              <span className={`font-bold text-blue-600 ${isMobile ? 'text-[10px]' : ''}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AnalyticsWorking = () => {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState({
    users: [],
    schools: [],
    attendance: []
  });
  const [filteredData, setFilteredData] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [selectedChartType, setSelectedChartType] = useState('bar');
  
  // Store unique values for dynamic filters
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    stats: {
      totalSchools: 0,
      totalUsers: 0,
      activeUsers: 0,
      todayAttendance: 0,
      avgAttendanceRate: 0,
      totalAttendanceRecords: 0
    }
  });

  useEffect(() => {
    fetchAnalyticsData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Data is loaded, ready for filtering when user clicks apply

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Try using backend API first, fallback to direct Supabase
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/analytics/overview', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const apiData = await response.json();
          if (apiData.success) {
            setRawData(apiData.data.rawData);
            setAnalyticsData({ stats: apiData.data.stats });
            setFilteredData([]);
            return;
          }
        }
      } catch {
        console.log('Backend API not available, using direct Supabase connection');
      }

      // Fallback to direct Supabase calls - use schema from schools_schema.sql
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*'); // Use * to get all available columns

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*'); // Use * to get all available columns

      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*'); // Use * to get all available columns

      if (schoolsError || usersError || attendanceError) {
        console.error('Error fetching analytics data:', { 
          schoolsError,
          usersError, 
          attendanceError
        });
        
        // Show helpful error messages
        if (schoolsError) {
          console.error('Schools table error:', schoolsError.message);
          console.log('Make sure schools table exists with schema from schools_schema.sql');
        }
        if (usersError) {
          console.error('Users table error:', usersError.message);
          console.log('Using .select("*") to get all available fields');
        }
        
        setAnalyticsData(getFallbackAnalytics());
        setRawData({ users: [], schools: [], attendance: [] });
        setFilteredData([]);
        return;
      }

      console.log('Successfully fetched data:', { usersData, schoolsData, attendanceData });

      // Store raw data for filtering  
      const processedRawData = {
        users: usersData || [],
        schools: schoolsData || [],
        attendance: attendanceData || []
      };
      
      setRawData(processedRawData);

      // Extract unique values for dynamic filters
      const uniqueDistricts = [...new Set((schoolsData || []).map(school => school.district).filter(Boolean))];
      const uniqueStatuses = [...new Set((attendanceData || []).map(record => record.status).filter(Boolean))];
      
      setAvailableDistricts(uniqueDistricts);
      setAvailableStatuses(uniqueStatuses);
      
      console.log('Available filter values:', { uniqueDistricts, uniqueStatuses });

      // Calculate basic statistics
      const stats = calculateBasicStats(usersData || [], schoolsData || [], attendanceData || []);
      setAnalyticsData({ stats });

      // Don't initialize filtered data immediately, let user apply filters
      setFilteredData([]);

    } catch (error) {
      console.error('Error in fetchAnalyticsData:', error);
      setAnalyticsData(getFallbackAnalytics());
      setRawData({ users: [], schools: [], attendance: [] });
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateBasicStats = (users, schools, attendance) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(record => record.date === today);
    // Use actual status field if it exists in users table, otherwise count all
    const activeUsers = users.filter(user => user.status === 'present' || user.status === 'active').length || users.length;
    
    return {
      totalSchools: schools.length,
      totalUsers: users.length,
      activeUsers,
      todayAttendance: todayAttendance.length,
      avgAttendanceRate: users.length > 0 ? ((todayAttendance.length / users.length) * 100).toFixed(1) : 0,
      totalAttendanceRecords: attendance.length
    };
  };

  const getFallbackAnalytics = () => ({
    stats: {
      totalSchools: 0,
      totalUsers: 0,
      activeUsers: 0,
      todayAttendance: 0,
      avgAttendanceRate: 0,
      totalAttendanceRecords: 0
    }
  });



  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: {
        ...prev[filterType],
        [value]: !prev[filterType]?.[value]
      }
    }));
  };

  const applyFilters = () => {
    if (!rawData) {
      console.log('No data available');
      setFilteredData([]);
      return;
    }

    console.log('Applying filters:', selectedFilters);
    console.log('Raw data:', { 
      users: rawData.users?.length, 
      schools: rawData.schools?.length, 
      attendance: rawData.attendance?.length 
    });
    
    let filteredUsers = rawData.users || [];
    let filteredSchools = rawData.schools || [];
    let filteredAttendance = rawData.attendance || [];
    
    // Apply district filter to schools
    if (selectedFilters.district) {
      const selectedDistricts = Object.entries(selectedFilters.district)
        .filter(([, isSelected]) => isSelected)
        .map(([district]) => district);
      
      if (selectedDistricts.length > 0) {
        filteredSchools = rawData.schools.filter(school => 
          selectedDistricts.includes(school.district)
        );
        console.log('Filtered schools by district:', filteredSchools.length);
      }
    }
    
    // Apply status filter to attendance
    if (selectedFilters.status) {
      const selectedStatuses = Object.entries(selectedFilters.status)
        .filter(([, isSelected]) => isSelected)
        .map(([status]) => status);
      
      if (selectedStatuses.length > 0) {
        filteredAttendance = rawData.attendance.filter(record => 
          selectedStatuses.includes(record.status)
        );
        console.log('Filtered attendance by status:', filteredAttendance.length);
      }
    }
    
    // Apply role filter to users
    if (selectedFilters.role) {
      const selectedRoles = Object.entries(selectedFilters.role)
        .filter(([, isSelected]) => isSelected)
        .map(([role]) => role);
      
      if (selectedRoles.length > 0) {
        filteredUsers = rawData.users.filter(user => 
          selectedRoles.includes(user.role)
        );
        console.log('Filtered users by role:', filteredUsers.length);
      }
    }
    
    // Calculate analytics with filtered data
    const updatedAnalytics = {
      stats: calculateBasicStats(filteredUsers, filteredSchools, filteredAttendance),
      chartData: []
    };
    
    setAnalyticsData(updatedAnalytics);
    
    // Create chart data based on what filters are active
    const processedData = [];
    
    // If district filter is active, group attendance by districts
    if (selectedFilters.district && Object.values(selectedFilters.district).some(v => v)) {
      // Create district-attendance mapping by joining schools and users data
      const districtAttendanceCounts = {};
      
      // Initialize counts for filtered districts
      filteredSchools.forEach(school => {
        districtAttendanceCounts[school.district] = 0;
      });
      
      // Count attendance records per district
      filteredAttendance.forEach(attendanceRecord => {
        // Find the user for this attendance record
        const user = rawData.users.find(u => u.id === attendanceRecord.user_id);
        if (user) {
          // Find the school for this user
          const school = rawData.schools.find(s => s.school_id === user.school_id);
          if (school && school.district in districtAttendanceCounts) {
            districtAttendanceCounts[school.district]++;
          }
        }
      });
      
      Object.entries(districtAttendanceCounts).forEach(([district, count]) => {
        processedData.push({
          name: district,
          value: count,
          count,
          type: 'attendance_by_district'
        });
      });
    }
    // If status filter is active, group by status
    else if (selectedFilters.status && Object.values(selectedFilters.status).some(v => v)) {
      const statusCounts = filteredAttendance.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        processedData.push({
          name: status,
          value: count,
          count
        });
      });
    }
    // If role filter is active, group by roles
    else if (selectedFilters.role && Object.values(selectedFilters.role).some(v => v)) {
      const roleCounts = filteredUsers.reduce((acc, user) => {
        const role = user.role || 'Unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(roleCounts).forEach(([role, count]) => {
        processedData.push({
          name: role,
          value: count,
          count
        });
      });
    }
    // Default: show district-wise attendance data (most relevant for X-Y axis chart)
    else if (rawData.schools.length > 0 && rawData.attendance.length > 0) {
      // Create district-attendance mapping for all districts
      const districtAttendanceCounts = {};
      
      // Initialize counts for all districts
      rawData.schools.forEach(school => {
        if (!districtAttendanceCounts[school.district]) {
          districtAttendanceCounts[school.district] = 0;
        }
      });
      
      // Count attendance records per district
      rawData.attendance.forEach(attendanceRecord => {
        const user = rawData.users.find(u => u.id === attendanceRecord.user_id);
        if (user) {
          const school = rawData.schools.find(s => s.school_id === user.school_id);
          if (school && school.district in districtAttendanceCounts) {
            districtAttendanceCounts[school.district]++;
          }
        }
      });
      
      Object.entries(districtAttendanceCounts).forEach(([district, count]) => {
        processedData.push({
          name: district,
          value: count,
          count,
          type: 'default_attendance_by_district'
        });
      });
    }
    // Fallback: show user roles if no district/attendance data
    else if (filteredUsers.length > 0) {
      const roleCounts = filteredUsers.reduce((acc, user) => {
        const role = user.role || 'Unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(roleCounts).forEach(([role, count]) => {
        processedData.push({
          name: role,
          value: count,
          count,
          type: 'user_roles'
        });
      });
    }
    
    setFilteredData(processedData);
    
    console.log('Filtered analytics:', updatedAnalytics);
    console.log('Chart data:', processedData);
  };




  const StatCard = ({ title, value, subtitle, IconComponent, trend }) => (
    <div className="bg-white border border-gray-100 p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 tracking-wider uppercase truncate">{title}</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-black mt-1 sm:mt-2 truncate">{value}</p>
          {subtitle && (
            <div className="flex items-center mt-1">
              <p className="text-xs text-gray-500 truncate">{subtitle}</p>
              {trend && (
                <ArrowTrendingUpIcon className="w-3 h-3 text-green-500 ml-1 flex-shrink-0" />
              )}
            </div>
          )}
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-50 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
          {IconComponent && <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-600" />}
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-medium text-black tracking-tight mb-1 sm:mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-xs text-gray-400 tracking-wider uppercase">
            Schools, Users & Attendance Insights
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Schools"
            value={analyticsData.stats.totalSchools}
            subtitle="Registered institutions"
            IconComponent={BuildingOffice2Icon}
            trend={true}
          />
          <StatCard
            title="Total Users"
            value={analyticsData.stats.totalUsers}
            subtitle={`${analyticsData.stats.activeUsers} active users`}
            IconComponent={UsersIcon}
            trend={true}
          />
          <StatCard
            title="Today's Attendance"
            value={analyticsData.stats.todayAttendance}
            subtitle="Present today"
            IconComponent={ClockIcon}
          />
          <StatCard
            title="Avg Attendance Rate"
            value={`${analyticsData.stats.avgAttendanceRate}%`}
            subtitle="Last 7 days"
            IconComponent={ChartBarIcon}
            trend={analyticsData.stats.avgAttendanceRate > 70}
          />
        </div>

        {/* Main Content Grid: Filters + Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Left Side - Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 p-3 sm:p-6 lg:sticky lg:top-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-medium text-black tracking-tight">Filters</h2>
                <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>

              {/* Filter Categories */}
              <div className="space-y-4 sm:space-y-6">
                {/* Role Filter */}
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Role</h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    {['member', 'admin', 'mentor'].map((role) => (
                      <label key={role} className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black border-gray-300 rounded focus:ring-black"
                          checked={selectedFilters.role?.[role] || false}
                          onChange={() => handleFilterChange('role', role)}
                        />
                        <span className="ml-2 text-xs sm:text-sm text-gray-600 capitalize">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status Filter - Dynamic from attendance table */}
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Attendance Status</h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    {availableStatuses.map((status) => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black border-gray-300 rounded focus:ring-black"
                          checked={selectedFilters.status?.[status] || false}
                          onChange={() => handleFilterChange('status', status)}
                        />
                        <span className="ml-2 text-xs sm:text-sm text-gray-600 capitalize">{status}</span>
                      </label>
                    ))}
                  </div>
                  {availableStatuses.length === 0 && (
                    <p className="text-xs text-gray-500">No attendance status data available</p>
                  )}
                </div>

                {/* District Filter - Dynamic from schools table */}
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">School District</h3>
                  <div className="space-y-1.5 sm:space-y-2 max-h-28 sm:max-h-32 overflow-y-auto">
                    {availableDistricts.map((district) => (
                      <label key={district} className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black border-gray-300 rounded focus:ring-black"
                          checked={selectedFilters.district?.[district] || false}
                          onChange={() => handleFilterChange('district', district)}
                        />
                        <span className="ml-2 text-xs sm:text-sm text-gray-600 truncate">{district}</span>
                      </label>
                    ))}
                  </div>
                  {availableDistricts.length === 0 && (
                    <p className="text-xs text-gray-500">No district data available</p>
                  )}
                </div>

                {/* Apply Filters Button */}
                <button
                  onClick={applyFilters}
                  className="w-full bg-black text-white py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center rounded-sm"
                >
                  <CheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Apply Filters & Show Chart</span>
                  <span className="sm:hidden">Apply Filters</span>
                </button>
                
                {/* Filter Status */}
                <div className="mt-2 sm:mt-3 text-xs text-gray-500 text-center">
                  {Object.values(selectedFilters).some(filterObj => 
                    filterObj && Object.values(filterObj).some(Boolean)
                  ) ? (
                    <div className="flex items-center justify-center">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1"></div>
                      <span className="text-green-600 text-xs">Filters Selected</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 rounded-full mr-1"></div>
                      <span className="text-xs">No filters applied</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Charts */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-100 p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <h2 className="text-base sm:text-lg font-medium text-black tracking-tight">
                  Filtered Data Visualization
                </h2>
                <div className="flex flex-wrap gap-2 sm:space-x-2">
                  <button
                    onClick={() => setSelectedChartType('bar')}
                    className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-sm ${
                      selectedChartType === 'bar' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="hidden sm:inline">Bar Chart</span>
                    <span className="sm:hidden">Bar</span>
                  </button>
                  <button
                    onClick={() => setSelectedChartType('pie')}
                    className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-sm ${
                      selectedChartType === 'pie' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="hidden sm:inline">Pie Chart</span>
                    <span className="sm:hidden">Pie</span>
                  </button>
                  <button
                    onClick={() => setSelectedChartType('line')}
                    className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-sm ${
                      selectedChartType === 'line' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="hidden sm:inline">Line Chart</span>
                    <span className="sm:hidden">Line</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Chart Rendering - Professional Visual Charts */}
              {filteredData && filteredData.length > 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 min-h-[450px] shadow-sm">
                  {selectedChartType === 'bar' && <ProfessionalBarChart data={filteredData} />}
                  {selectedChartType === 'pie' && <ProfessionalPieChart data={filteredData} />}
                  {selectedChartType === 'line' && <ProfessionalLineChart data={filteredData} />}
                </div>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <FunnelIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No Data Available</p>
                    <p className="text-gray-400 text-sm">Select filters and click "Refresh Chart" to visualize data</p>
                  </div>
                </div>
              )}

              {/* No Data Message */}
              {(!filteredData || filteredData.length === 0) && (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <FunnelIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">Select filters and click "Apply Filters" to view data visualization</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default AnalyticsWorking;