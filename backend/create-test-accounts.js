const { supabase } = require('./config/supabase');
const bcrypt = require('bcrypt');

async function createTestAccounts() {
  try {
    console.log('Creating test accounts...');
    
    // Hash passwords
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);
    
    // Create a test teacher
    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .upsert({
        name: 'Test Teacher',
        email: 'test.teacher@school.edu',
        password: teacherPassword,
        role: 'teacher',
        rfid_tag: 'TEACHER_TEST_001',
        phone: '1234567890',
        school_id: 'a5604b0d-8291-45e2-a09a-db1344f9d916'
      }, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select()
      .single();
      
    if (teacherError) {
      console.error('Error creating teacher:', teacherError);
    } else {
      console.log('✅ Test teacher created:', teacher.email);
    }
    
    // Create a few test students
    const students = [
      {
        name: 'Student One',
        email: 'student1@school.edu',
        password: studentPassword,
        role: 'student',
        rfid_tag: 'STUDENT_TEST_001',
        std: '10',
        phone: '1234567891',
        school_id: 'a5604b0d-8291-45e2-a09a-db1344f9d916'
      },
      {
        name: 'Student Two',
        email: 'student2@school.edu',
        password: studentPassword,
        role: 'student',
        rfid_tag: 'STUDENT_TEST_002',
        std: '10',
        phone: '1234567892',
        school_id: 'a5604b0d-8291-45e2-a09a-db1344f9d916'
      }
    ];
    
    for (const student of students) {
      const { data, error } = await supabase
        .from('users')
        .upsert(student, { 
          onConflict: 'email',
          ignoreDuplicates: false 
        })
        .select()
        .single();
        
      if (error) {
        console.error(`Error creating student ${student.email}:`, error);
      } else {
        console.log(`✅ Test student created: ${data.email}`);
      }
    }
    
    console.log('✅ Test accounts created successfully!');
    console.log('📧 Teacher login: test.teacher@school.edu / teacher123');
    console.log('📧 Student logins: student1@school.edu / student123, student2@school.edu / student123');
    
  } catch (error) {
    console.error('Error creating test accounts:', error);
  }
}

createTestAccounts();
