#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

const Attendance = require('./models/Attendance');

async function migrateToSessions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Find all attendance records that don't have sessions but have entryTime/timestamp
    const recordsToMigrate = await Attendance.find({
      $or: [
        { sessions: { $exists: false } },
        { sessions: { $size: 0 } }
      ],
      $and: [
        {
          $or: [
            { entryTime: { $exists: true } },
            { timestamp: { $exists: true } }
          ]
        }
      ]
    });

    console.log(`Found ${recordsToMigrate.length} records to migrate`);

    let migratedCount = 0;

    for (let record of recordsToMigrate) {
      const entryTime = record.entryTime || record.timestamp;
      
      if (entryTime) {
        const session = {
          entryTime: entryTime,
          exitTime: record.exitTime || null,
          autoExitSet: false
        };

        record.sessions = [session];
        
        // Update legacy fields for compatibility
        record.entryTime = entryTime;
        if (!record.timestamp) {
          record.timestamp = entryTime;
        }
        
        await record.save();
        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`Migrated ${migratedCount} records...`);
        }
      }
    }

    console.log(`✅ Migration completed! Migrated ${migratedCount} records to session structure.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToSessions().catch(console.error);
}

module.exports = migrateToSessions;
