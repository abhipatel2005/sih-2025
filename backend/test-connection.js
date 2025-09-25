require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', process.env.SUPABASE_URL);
    console.log('Service key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase error:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Users table accessible:', data);
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
