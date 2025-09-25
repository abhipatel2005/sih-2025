const { supabase } = require('./config/supabase');
const bcrypt = require('bcrypt');

async function createTestAdmin() {
  try {
    console.log('Creating test admin user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123456', 10);
    
    // Check if school exists first, if not create one
    let { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('school_id')
      .eq('name', 'Test School')
      .single();
      
    if (schoolError || !school) {
      console.log('Creating test school...');
      const { data: newSchool, error: createSchoolError } = await supabase
        .from('schools')
        .insert({
          name: 'Test School',
          district: 'Test District',
          state: 'Test State'
        })
        .select('school_id')
        .single();
        
      if (createSchoolError) {
        console.error('Error creating school:', createSchoolError);
        return;
      }
      school = newSchool;
    }
    
    // Create admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .insert({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
        rfid_tag: 'ADMIN001',
        school_id: school.school_id
      })
      .select()
      .single();
      
    if (adminError) {
      if (adminError.code === '23505') {
        console.log('✓ Admin user already exists');
        return;
      }
      console.error('Error creating admin:', adminError);
      return;
    }
    
    console.log('✓ Admin user created successfully!');
    console.log('Email: admin@test.com');
    console.log('Password: admin123456');
    
  } catch (error) {
    console.error('Failed to create admin:', error);
  }
}

createTestAdmin();
