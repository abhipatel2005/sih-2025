const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Create initial admin user
async function createAdminUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Check if admin user already exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@launchlog.com';
    const existingAdmin = await User.findByEmail(adminEmail);
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:', adminEmail);
      console.log('👤 Admin details:');
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   RFID: ${existingAdmin.rfidTag}`);
      console.log(`   Status: ${existingAdmin.status}`);
      return;
    }
    
    // Create admin user
    const adminUser = new User({
      name: process.env.ADMIN_NAME || 'Admin User',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'admin123456',
      rfidTag: process.env.ADMIN_RFID || 'ADMIN001',
      role: 'admin',
      status: 'active',
      phone: '+1234567890'
    });
    
    await adminUser.save();
    
    console.log('🎉 Admin user created successfully!');
    console.log('==========================================');
    console.log('👤 Admin Login Credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123456'}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   RFID: ${adminUser.rfidTag}`);
    console.log('==========================================');
    console.log('🔐 IMPORTANT: Change the admin password after first login!');
    console.log('📱 You can now use these credentials to:');
    console.log('   • Login via POST /auth/login');
    console.log('   • Create other users via POST /users');
    console.log('   • Manage the system via admin endpoints');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      console.error(`💡 ${field} already exists. Please check your configuration.`);
    }
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  console.log('👑 Creating admin user...');
  createAdminUser();
}

module.exports = { createAdminUser };
