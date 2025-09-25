// Sample data for Analytics Dashboard Demo
// Use this when testing without full database setup

export const sampleAnalyticsData = {
  schools: [
    { district: 'Chandigarh', count: 15, percentage: '25.0' },
    { district: 'Ludhiana', count: 12, percentage: '20.0' },
    { district: 'Amritsar', count: 10, percentage: '16.7' },
    { district: 'Jalandhar', count: 8, percentage: '13.3' },
    { district: 'Patiala', count: 7, percentage: '11.7' },
    { district: 'Mohali', count: 5, percentage: '8.3' },
    { district: 'Bathinda', count: 3, percentage: '5.0' }
  ],
  
  users: [
    { role: 'Member', count: 45, percentage: '75.0' },
    { role: 'Mentor', count: 12, percentage: '20.0' },
    { role: 'Admin', count: 3, percentage: '5.0' }
  ],
  
  attendance: [
    { date: '2025-09-19', day: 'Thu', attendance: 38, rate: '63.3' },
    { date: '2025-09-20', day: 'Fri', attendance: 42, rate: '70.0' },
    { date: '2025-09-21', day: 'Sat', attendance: 15, rate: '25.0' },
    { date: '2025-09-22', day: 'Sun', attendance: 8, rate: '13.3' },
    { date: '2025-09-23', day: 'Mon', attendance: 48, rate: '80.0' },
    { date: '2025-09-24', day: 'Tue', attendance: 45, rate: '75.0' },
    { date: '2025-09-25', day: 'Wed', attendance: 50, rate: '83.3' }
  ],
  
  schoolTypes: [
    { type: 'Primary', count: 25, percentage: '41.7' },
    { type: 'Secondary', count: 20, percentage: '33.3' },
    { type: 'High School', count: 12, percentage: '20.0' },
    { type: 'Other', count: 3, percentage: '5.0' }
  ],
  
  stats: {
    totalSchools: 60,
    totalUsers: 60,
    activeUsers: 57,
    todayAttendance: 50,
    avgAttendanceRate: 72
  }
};

// Demo mode flag - set to true to use sample data instead of database
export const DEMO_MODE = false;

// Helper function to generate random variations of sample data
export const generateRandomizedData = () => {
  const randomVariation = (base, variance = 0.2) => {
    return Math.floor(base * (1 + (Math.random() - 0.5) * variance));
  };

  return {
    ...sampleAnalyticsData,
    attendance: sampleAnalyticsData.attendance.map(day => ({
      ...day,
      attendance: randomVariation(day.attendance),
      rate: (randomVariation(parseInt(day.rate)) + Math.random() * 10).toFixed(1)
    })),
    stats: {
      ...sampleAnalyticsData.stats,
      todayAttendance: randomVariation(sampleAnalyticsData.stats.todayAttendance),
      avgAttendanceRate: randomVariation(sampleAnalyticsData.stats.avgAttendanceRate, 0.1)
    }
  };
};