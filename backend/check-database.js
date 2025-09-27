const { supabase } = require('./config/supabase');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Try to query users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Users table error:', error);
      console.log('📋 The users table may not exist or may have schema issues.');
      console.log('💡 Please run the schema.sql file in your Supabase dashboard first.');
      return false;
    } else {
      console.log('✅ Users table exists');
      console.log('📊 Sample data:', data);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Database check error:', error);
    return false;
  }
}

async function checkTables() {
  console.log('🔍 Checking all tables...');
  
  const tables = ['users', 'schools', 'attendance'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);
      
      if (error) {
        console.log(`❌ Table '${table}' error:`, error.message);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    } catch (error) {
      console.log(`❌ Table '${table}' check failed:`, error.message);
    }
  }
}

if (require.main === module) {
  checkDatabase().then(() => checkTables());
}

module.exports = { checkDatabase, checkTables };
