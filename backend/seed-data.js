const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
require('dotenv').config();

// Sample data with new User model fields
const sampleUsers = [
  { 
    name: 'John Doe', 
    rfidTag: '04A1B2C3',
    email: 'john.doe@launchlog.com',
    password: 'password123',
    role: 'member',
    status: 'active',
    phone: '+1234567890'
  },
  { 
    name: 'Jane Smith', 
    rfidTag: '05B2C3D4',
    email: 'jane.smith@launchlog.com',
    password: 'password123',
    role: 'mentor',
    status: 'active',
    phone: '+1234567891'
  },
  { 
    name: 'Bob Johnson', 
    rfidTag: '06C3D4E5',
    email: 'bob.johnson@launchlog.com',
    password: 'password123',
    role: 'member',
    status: 'active',
    phone: '+1234567892'
  },
  { 
    name: 'Alice Brown', 
    rfidTag: '07D4E5F6',
    email: 'alice.brown@launchlog.com',
    password: 'password123',
    role: 'member',
    status: 'active',
    phone: '+1234567893'
  },
  { 
    name: 'Charlie Wilson', 
    rfidTag: '08E5F6A7',
    email: 'charlie.wilson@launchlog.com',
    password: 'password123',
    role: 'member',
    status: 'inactive',
    phone: '+1234567894'
  },
  { 
    name: 'Diana Davis', 
    rfidTag: '09F6A7B8',
    email: 'diana.davis@launchlog.com',
    password: 'password123',
    role: 'mentor',
    status: 'active',
    phone: '+1234567895'
  },
  { 
    name: 'Eve Miller', 
    rfidTag: '0AA7B8C9',
    email: 'eve.miller@launchlog.com',
    password: 'password123',
    role: 'member',
    status: 'active',
    phone: '+1234567896'
  },
  { 
    name: 'Frank Garcia', 
    rfidTag: '0BB8C9DA',
    email: 'frank.garcia@launchlog.com',
    password: 'password123',
    role: 'member',
    status: 'active',
    phone: '+1234567897'
  }
];

// Function to generate today's sample attendance data
const generateTodaysAttendance = (users) => {
  const today = new Date();
  const attendanceData = [];
  
  users.forEach((user, index) => {
    // Generate random check-in times throughout the day
    const checkInHour = Math.floor(Math.random() * 4) + 8; // Between 8 AM and 12 PM
    const checkInMinute = Math.floor(Math.random() * 60);
    const checkInSecond = Math.floor(Math.random() * 60);
    
    const checkInTime = new Date(today);
    checkInTime.setHours(checkInHour, checkInMinute, checkInSecond, 0);
    
    attendanceData.push({
      userId: user._id,
      timestamp: checkInTime
    });
    
    // Some users might have multiple entries (check-out, breaks, etc.)
    if (Math.random() > 0.5) {
      const secondEntryHour = checkInHour + Math.floor(Math.random() * 6) + 1;
      const secondEntryMinute = Math.floor(Math.random() * 60);
      const secondEntrySecond = Math.floor(Math.random() * 60);
      
      const secondEntryTime = new Date(today);
      secondEntryTime.setHours(secondEntryHour, secondEntryMinute, secondEntrySecond, 0);
      
      attendanceData.push({
        userId: user._id,
        timestamp: secondEntryTime
      });
    }
  });
  
  return attendanceData.sort((a, b) => b.timestamp - a.timestamp);
};

// Function to seed the database
async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Attendance.deleteMany({});
    await User.deleteMany({});
    
    // Insert sample users
    console.log('👥 Inserting sample users...');
    const insertedUsers = await User.insertMany(sampleUsers);
    console.log(`✅ Inserted ${insertedUsers.length} users`);
    
    // Generate and insert today's attendance data
    console.log('📋 Generating today\'s attendance data...');
    const attendanceData = generateTodaysAttendance(insertedUsers);
    const insertedAttendance = await Attendance.insertMany(attendanceData);
    console.log(`✅ Inserted ${insertedAttendance.length} attendance records for today`);
    
    // Display summary
    console.log('\n📊 Database seeded successfully!');
    console.log('==========================================');
    console.log(`👥 Users created: ${insertedUsers.length}`);
    console.log(`📋 Attendance records: ${insertedAttendance.length}`);
    console.log('==========================================');
    
    console.log('\n👥 Sample Users:');
    insertedUsers.forEach(user => {
      console.log(`   • ${user.name} (RFID: ${user.rfidTag})`);
    });
    
    console.log('\n🕐 Today\'s Attendance (latest first):');
    const populatedAttendance = await Attendance.find({})
      .populate('userId', 'name rfidTag')
      .sort({ timestamp: -1 });
    
    populatedAttendance.forEach(record => {
      const time = record.timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      console.log(`   • ${record.userId.name} checked in at ${time}`);
    });
    
    console.log('\n🚀 You can now test your frontend at http://localhost:5173');
    console.log('🔗 Backend API available at http://localhost:3000/attendance/today');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    if (error.code === 11000) {
      console.error('💡 Duplicate key error - users might already exist. Run the script again to clear and re-seed.');
    }
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Add some additional sample attendance for testing search functionality
async function addMoreTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const users = await User.find({});
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Add yesterday's data
    const yesterdayAttendance = users.slice(0, 5).map(user => ({
      userId: user._id,
      timestamp: new Date(yesterday.setHours(9, 30, 0, 0))
    }));
    
    await Attendance.insertMany(yesterdayAttendance);
    console.log('✅ Added yesterday\'s attendance data for testing');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error.message);
  }
}

// Run the seeding function
if (require.main === module) {
  console.log('🌱 Starting database seeding process...');
  seedDatabase();
}

module.exports = { seedDatabase, addMoreTestData };
