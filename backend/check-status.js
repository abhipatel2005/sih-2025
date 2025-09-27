const { supabase } = require('./config/supabase');

async function checkStatusValues() {
  try {
    console.log('🔍 Checking current status values in users table...');
    
    // Get all users with their status values
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, status');
    
    if (error) {
      console.log('❌ Error querying users:', error);
      return;
    }
    
    console.log('👥 Found', data.length, 'users:');
    data.forEach(user => {
      console.log(`- ${user.name} (${user.role}): status = "${user.status}"`);
    });
    
    // Count status values
    const statusCounts = {};
    data.forEach(user => {
      const status = user.status || 'null';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('\n📊 Status value distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} users`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  checkStatusValues();
}

module.exports = { checkStatusValues };
