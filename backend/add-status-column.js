const { supabase } = require('./config/supabase');

async function addStatusColumn() {
  try {
    console.log('🔧 Adding status column to users table...');
    
    // Since we can't use DDL through Supabase client directly, 
    // we'll need to manually add the column via Supabase dashboard
    // But let's try to add records with default status first
    
    console.log('📊 Checking current users...');
    const { data: users, error: getUsersError } = await supabase
      .from('users')
      .select('id, name, email, role');
    
    if (getUsersError) {
      console.error('❌ Error getting users:', getUsersError);
      return;
    }
    
    console.log(`✅ Found ${users.length} users`);
    
    // The column needs to be added via SQL in Supabase dashboard
    console.log('\n⚠️  MANUAL ACTION REQUIRED:');
    console.log('📝 Please run this SQL in your Supabase SQL editor:');
    console.log('');
    console.log('ALTER TABLE users ADD COLUMN status VARCHAR DEFAULT \'active\' CHECK (status IN (\'active\', \'inactive\') OR status IS NULL);');
    console.log('');
    console.log('💡 After running the SQL, all existing users will have status = \'active\' by default');
    
    // Try to query with status to see if the column exists
    console.log('\n🔍 Testing if status column exists...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id, status')
      .limit(1);
    
    if (testError) {
      if (testError.code === '42703') {
        console.log('❌ Status column does not exist yet - please run the SQL above');
      } else {
        console.log('❌ Error testing status column:', testError);
      }
    } else {
      console.log('✅ Status column exists!');
      console.log('📊 Sample status values:', testData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  addStatusColumn();
}

module.exports = { addStatusColumn };
