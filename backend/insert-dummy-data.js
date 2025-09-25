const { supabase } = require('./config/supabase');
const bcrypt = require('bcrypt');

// Configuration
const SCHOOLS_COUNT = 10;
const STUDENTS_PER_SCHOOL = 100;
const TEACHERS_PER_SCHOOL = 10;
const PRINCIPALS_PER_SCHOOL = 1;
const ATTENDANCE_DAYS = 7; // 1 week

// Sample data arrays
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['Male', 'Female'];
const categories = ['General', 'OBC', 'SC', 'ST'];
const standards = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
const districts = ['Central', 'North', 'South', 'East', 'West'];
const validStatuses = ['present', 'absent', 'late', ''];

const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Priya', 'Kavya', 'Aadhya', 'Saanvi', 'Kiara', 'Anika', 'Riya', 'Navya',
  'Rohit', 'Amit', 'Suresh', 'Rajesh', 'Prakash', 'Dinesh', 'Ramesh', 'Mahesh', 'Ganesh', 'Naresh',
  'Sunita', 'Meera', 'Kavita', 'Rekha', 'Geeta', 'Sita', 'Rita', 'Nita', 'Lata', 'Gita'
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Yadav', 'Patel', 'Jain', 'Agarwal', 'Mishra',
  'Shah', 'Mehta', 'Desai', 'Modi', 'Joshi', 'Pandey', 'Tiwari', 'Chauhan', 'Saxena', 'Bansal'
];

const schools = [
  { name: 'Sunrise Public School', district: 'Mumbai', state: 'Maharashtra' },
  { name: 'Green Valley High School', district: 'Delhi', state: 'Delhi' },
  { name: "St. Mary's Convent School", district: 'Bangalore', state: 'Karnataka' },
  { name: 'Blue Diamond School', district: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Golden Eagle International School', district: 'Pune', state: 'Maharashtra' },
  { name: 'River View Academy', district: 'Hyderabad', state: 'Telangana' },
  { name: 'Mount Everest School', district: 'Kolkata', state: 'West Bengal' },
  { name: 'Rainbow Children School', district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Crystal Palace School', district: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Bright Future Academy', district: 'Lucknow', state: 'Uttar Pradesh' }
];

// Utility functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

const generateRandomName = (counter) => {
  const firstName = firstNames[counter % firstNames.length];
  const lastName = lastNames[Math.floor(counter / firstNames.length) % lastNames.length];
  return `${firstName} ${lastName}`;
};

const generateRandomDate = (minYearsAgo, maxYearsAgo) => {
  const today = new Date();
  const minDate = new Date(today.getFullYear() - maxYearsAgo, 0, 1);
  const maxDate = new Date(today.getFullYear() - minYearsAgo, 11, 31);
  return new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const generateRandomTime = (startHour = 8, endHour = 9.5) => {
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  const randomMinutes = Math.floor(Math.random() * (endMinutes - startMinutes)) + startMinutes;
  const hours = Math.floor(randomMinutes / 60);
  const minutes = randomMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
};

const isWeekend = (date) => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
};

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Insert functions
const insertSchools = async () => {
  console.log('📚 Inserting schools...');
  
  const { data, error } = await supabase
    .from('schools')
    .insert(schools)
    .select();

  if (error) {
    throw new Error(`Error inserting schools: ${error.message}`);
  }

  console.log(`✅ Inserted ${data.length} schools`);
  return data;
};

const insertUsers = async (schoolsData) => {
  console.log('👥 Inserting users...');
  
  let userCounter = 1;
  const allUsers = [];

  for (let schoolIndex = 0; schoolIndex < schoolsData.length; schoolIndex++) {
    const school = schoolsData[schoolIndex];
    const schoolName = school.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    console.log(`  Processing ${school.name}...`);
    
    // Create principal
    const principalUser = {
      name: generateRandomName(userCounter),
      rfid_tag: `RFID${userCounter.toString().padStart(6, '0')}`,
      role: 'principal',
      status: 'absent', // Use a valid status value
      email: `principal${schoolIndex + 1}@${schoolName}.edu`,
      phone: `+91${(7000000000 + userCounter).toString()}`,
      category: getRandomElement(categories),
      gender: getRandomElement(genders),
      password: await hashPassword(`password${userCounter}`),
      dob: formatDate(generateRandomDate(30, 45)),
      address: `${userCounter % 999 + 1}, ${getRandomElement(districts)} District, ${school.name} Area`,
      blood_group: getRandomElement(bloodGroups),
      aadhar_id: (100000000000 + userCounter).toString(),
      school_id: school.school_id
    };
    allUsers.push(principalUser);
    userCounter++;

    // Create teachers
    for (let i = 0; i < TEACHERS_PER_SCHOOL; i++) {
      const teacherUser = {
        name: generateRandomName(userCounter),
        rfid_tag: `RFID${userCounter.toString().padStart(6, '0')}`,
        role: 'teacher',
        status: 'absent', // Use a valid status value
        email: `teacher${userCounter}@${schoolName}.edu`,
        phone: `+91${(7000000000 + userCounter).toString()}`,
        category: getRandomElement(categories),
        gender: getRandomElement(genders),
        password: await hashPassword(`password${userCounter}`),
        dob: formatDate(generateRandomDate(25, 40)),
        address: `${userCounter % 999 + 1}, ${getRandomElement(districts)} District, ${school.name} Area`,
        blood_group: getRandomElement(bloodGroups),
        aadhar_id: (100000000000 + userCounter).toString(),
        school_id: school.school_id
      };
      allUsers.push(teacherUser);
      userCounter++;
    }

    // Create students
    for (let i = 0; i < STUDENTS_PER_SCHOOL; i++) {
      const studentUser = {
        name: generateRandomName(userCounter),
        rfid_tag: `RFID${userCounter.toString().padStart(6, '0')}`,
        role: 'student',
        status: 'absent', // Use a valid status value
        email: `student${userCounter}@${schoolName}.edu`,
        phone: `+91${(8000000000 + userCounter).toString()}`,
        category: getRandomElement(categories),
        gender: getRandomElement(genders),
        std: getRandomElement(standards),
        password: await hashPassword(`password${userCounter}`),
        dob: formatDate(generateRandomDate(5, 18)),
        address: `${userCounter % 999 + 1}, ${getRandomElement(districts)} District, ${school.name} Area`,
        blood_group: getRandomElement(bloodGroups),
        aadhar_id: (200000000000 + userCounter).toString(),
        school_id: school.school_id
      };
      allUsers.push(studentUser);
      userCounter++;
    }
  }

  // Insert users in batches to avoid timeout
  const batchSize = 100;
  const insertedUsers = [];

  for (let i = 0; i < allUsers.length; i += batchSize) {
    const batch = allUsers.slice(i, i + batchSize);
    console.log(`  Inserting users batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allUsers.length / batchSize)}...`);
    
    const { data, error } = await supabase
      .from('users')
      .insert(batch)
      .select('id, name, role, school_id');

    if (error) {
      throw new Error(`Error inserting users batch: ${error.message}`);
    }

    insertedUsers.push(...data);
  }

  console.log(`✅ Inserted ${insertedUsers.length} users total`);
  return insertedUsers;
};

const insertAttendance = async (users) => {
  console.log('📅 Inserting attendance data...');
  
  const attendanceRecords = [];
  const today = new Date();
  
  // Generate attendance for the past 7 days
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const attendanceDate = new Date(today);
    attendanceDate.setDate(today.getDate() - dayOffset);
    
    // Skip weekends
    if (isWeekend(attendanceDate)) {
      continue;
    }
    
    console.log(`  Processing attendance for ${formatDate(attendanceDate)}...`);
    
    for (const user of users) {
      // 90% attendance rate
      if (Math.random() > 0.1) {
        const attendanceTime = generateRandomTime(8, 9.5);
        const timestamp = `${formatDate(attendanceDate)}T${attendanceTime}+00:00`;
        
        attendanceRecords.push({
          user_id: user.id,
          date: formatDate(attendanceDate),
          timestamp: timestamp
        });
      }
    }
  }

  // Insert attendance in batches
  const batchSize = 500;
  let totalInserted = 0;

  for (let i = 0; i < attendanceRecords.length; i += batchSize) {
    const batch = attendanceRecords.slice(i, i + batchSize);
    console.log(`  Inserting attendance batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(attendanceRecords.length / batchSize)}...`);
    
    const { data, error } = await supabase
      .from('attendance')
      .insert(batch);

    if (error) {
      throw new Error(`Error inserting attendance batch: ${error.message}`);
    }

    totalInserted += batch.length;
  }

  console.log(`✅ Inserted ${totalInserted} attendance records`);
  return totalInserted;
};

const displaySummary = async () => {
  console.log('\n📊 Summary Statistics:');
  
  // Schools count
  const { data: schoolsData } = await supabase
    .from('schools')
    .select('*');
  
  // Users count by role
  const { data: usersData } = await supabase
    .from('users')
    .select('role');
  
  // Attendance count
  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('id');
  
  const usersByRole = usersData.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`📚 Schools: ${schoolsData.length}`);
  console.log(`👥 Total Users: ${usersData.length}`);
  console.log(`  📖 Students: ${usersByRole.student || 0}`);
  console.log(`  👩‍🏫 Teachers: ${usersByRole.teacher || 0}`);
  console.log(`  👔 Principals: ${usersByRole.principal || 0}`);
  console.log(`📅 Attendance Records: ${attendanceData.length}`);
};

const displaySampleData = async () => {
  console.log('\n🔍 Sample Data:');
  
  // Sample schools
  const { data: sampleSchools } = await supabase
    .from('schools')
    .select('*')
    .limit(3);
  
  console.log('\n📚 Sample Schools:');
  sampleSchools.forEach(school => {
    console.log(`  ${school.name} - ${school.district}, ${school.state}`);
  });
  
  // Sample users
  const { data: sampleUsers } = await supabase
    .from('users')
    .select('name, role, email, std')
    .in('role', ['student', 'teacher', 'principal'])
    .limit(5);
  
  console.log('\n👥 Sample Users:');
  sampleUsers.forEach(user => {
    const std = user.std ? ` (${user.std})` : '';
    console.log(`  ${user.name} - ${user.role}${std} - ${user.email}`);
  });
  
  // Sample attendance with user info
  const { data: sampleAttendance } = await supabase
    .from('attendance')
    .select(`
      id,
      date,
      timestamp,
      users (
        name,
        role
      )
    `)
    .limit(5)
    .order('timestamp', { ascending: false });
  
  console.log('\n📅 Sample Attendance:');
  sampleAttendance.forEach(record => {
    const date = new Date(record.timestamp).toLocaleDateString();
    const time = new Date(record.timestamp).toLocaleTimeString();
    console.log(`  ${record.users.name} (${record.users.role}) - ${date} ${time}`);
  });
};

// Main execution function
const main = async () => {
  try {
    console.log('🚀 Starting dummy data insertion...\n');
    
    // Insert schools
    const schoolsData = await insertSchools();
    
    // Insert users
    const usersData = await insertUsers(schoolsData);
    
    // Insert attendance
    await insertAttendance(usersData);
    
    // Display summary
    await displaySummary();
    await displaySampleData();
    
    console.log('\n🎉 Dummy data insertion completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during data insertion:', error.message);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
