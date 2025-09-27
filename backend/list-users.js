const { supabase } = require('./config/supabase');

async function listUsers() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, rfid_tag')
      .limit(10);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Existing users:');
    console.table(users);
    
  } catch (error) {
    console.error('Failed:', error);
  }
}

listUsers();
