const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Import models
const Attendance = require('./models/Attendance');

async function migrateAttendanceData() {
  try {
    console.log('🔄 Starting attendance data migration...');
    
    // Find all attendance records that need migration (have timestamp but no entryTime)
    const recordsToMigrate = await Attendance.find({
      timestamp: { $exists: true },
      entryTime: { $exists: false }
    });
    
    console.log(`📊 Found ${recordsToMigrate.length} records to migrate`);
    
    let migratedCount = 0;
    
    for (const record of recordsToMigrate) {
      try {
        // Set the new fields based on existing data
        record.user = record.userId;
        record.entryTime = record.timestamp;
        record.date = new Date(record.timestamp.getFullYear(), record.timestamp.getMonth(), record.timestamp.getDate());
        
        await record.save();
        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`✅ Migrated ${migratedCount}/${recordsToMigrate.length} records`);
        }
      } catch (error) {
        console.error(`❌ Error migrating record ${record._id}:`, error.message);
      }
    }
    
    console.log(`🎉 Migration completed! Migrated ${migratedCount} records`);
    
    // Verify migration
    const newSchemaCount = await Attendance.countDocuments({ entryTime: { $exists: true } });
    const totalCount = await Attendance.countDocuments({});
    
    console.log(`📈 Verification: ${newSchemaCount}/${totalCount} records now have entryTime`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateAttendanceData();
}

module.exports = { migrateAttendanceData };
