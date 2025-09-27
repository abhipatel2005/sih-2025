require('dotenv').config();
const User = require('./models/User');

// Create initial admin user
async function createAdminUser() {
  try {
    console.log('🔌 Connecting to Supabase...');
    
    // Test Supabase connection
    const { supabase } = require('./config/supabase');
    const { data, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) throw error;
    
    console.log('✅ Connected to Supabase successfully!');
    
    // Get the first available school for admin association
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('school_id')
      .limit(1);

    if (schoolError || !schools || schools.length === 0) {
      console.error('❌ No schools found. Please create a school first.');
      return;
    }

    const school_id = schools[0].school_id;
    console.log('🏫 Using school ID:', school_id);
    
    // Check if admin user already exists
    const adminEmail = process.env.ADMIN_EMAIL || 'testadmin@example.com';
    const existingAdmin = await User.findByEmail(adminEmail);
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:', adminEmail);
      console.log('👤 Admin details:');
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   RFID: ${existingAdmin.rfid_tag}`);
      console.log(`   Status: ${existingAdmin.status}`);
      return;
    }
    
    // Create admin user
    const adminUser = new User({
      name: process.env.ADMIN_NAME || 'Test Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'admin123',
      rfidTag: process.env.ADMIN_RFID || 'TESTADMIN999',
      role: 'admin',
      phone: '+1234567890',
      school_id: school_id
    });
    
    await adminUser.save();
    
    console.log('🎉 Admin user created successfully!');
    console.log('==========================================');
    console.log('👤 Admin Login Credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   RFID: ${adminUser.rfid_tag}`);
    console.log('==========================================');
    console.log('🔐 IMPORTANT: Change the admin password after first login!');
    console.log('📱 You can now use these credentials to:');
    console.log('   • Login via POST /auth/login');
    console.log('   • Create other users via POST /users');
    console.log('   • Manage the system via admin endpoints');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === '23505') {
      console.error('💡 Email or RFID already exists. Please check your configuration.');
    } else {
      console.error('💡 Please ensure:');
      console.error('   1. SUPABASE_URL is set correctly in your .env file');
      console.error('   2. SUPABASE_SERVICE_ROLE_KEY is set correctly in your .env file');
      console.error('   3. The users table exists in your Supabase database');
      console.error('   4. Run the schema.sql file in your Supabase database first');
    }
  } finally {
    console.log('\n🔌 Setup complete');
    process.exit(0);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  console.log('👑 Creating admin user...');
  createAdminUser();
}

module.exports = { createAdminUser };
