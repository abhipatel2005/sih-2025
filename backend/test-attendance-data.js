const { supabase } = require('./config/supabase');

async function testAttendanceData() {
  try {
    console.log('Testing attendance data structure...');
    
    // Test 1: Get attendance records with user join
    console.log('\n1. Testing attendance records with user join:');
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        id,
        date,
        timestamp,
        status,
        users (
          id,
          name,
          role,
          rfid_tag,
          email,
          std,
          school_id,
          schools (
            name,
            district,
            state
          )
        )
      `)
      .limit(3);
    
    if (attendanceError) {
      console.error('Error fetching attendance records:', attendanceError);
    } else {
      console.log('✓ Attendance records with user data:');
      console.table(attendanceRecords?.map(record => ({
        id: record.id,
        date: record.date,
        status: record.status,
        userName: record.users?.name,
        userRole: record.users?.role,
        schoolName: record.users?.schools?.name
      })));
    }
    
    // Test 2: Check status distribution
    console.log('\n2. Testing status distribution:');
    const { data: allRecords, error: statusError } = await supabase
      .from('attendance')
      .select('status')
      .limit(100);
      
    if (statusError) {
      console.error('Error fetching status data:', statusError);
    } else {
      const statusCounts = allRecords.reduce((acc, record) => {
        acc[record.status || 'null'] = (acc[record.status || 'null'] || 0) + 1;
        return acc;
      }, {});
      
      console.log('✓ Status distribution:');
      console.table(statusCounts);
    }
    
    // Test 3: Check users table structure
    console.log('\n3. Testing users table structure:');
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (userError) {
      console.error('Error fetching user record:', userError);
    } else {
      console.log('✓ Users table columns:', Object.keys(userRecord[0] || {}));
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAttendanceData();
