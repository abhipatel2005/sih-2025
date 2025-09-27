const { supabase } = require('./config/supabase');
const fs = require('fs');
const path = require('path');

async function fixStatusField() {
  try {
    console.log('🔧 Fixing user status field...');
    
    // Read the migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'database', 'fix_status_field.sql'), 
      'utf8'
    );
    
    // Split by semicolons to handle multiple statements
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('execute_sql', { sql_query: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          console.log('Statement was:', statement);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('🎉 Status field migration completed!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Alternative: Execute statements using raw SQL if RPC doesn't work
async function fixStatusFieldDirect() {
  try {
    console.log('🔧 Fixing user status field (direct approach)...');
    
    // Drop old constraint
    console.log('1. Dropping old constraint...');
    let { error } = await supabase.rpc('exec', {
      sql: "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check"
    });
    
    if (error && !error.message.includes('does not exist')) {
      console.error('Error dropping constraint:', error);
    } else {
      console.log('✅ Old constraint dropped');
    }
    
    // Add new constraint
    console.log('2. Adding new constraint...');
    ({ error } = await supabase.rpc('exec', {
      sql: "ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive') OR status IS NULL)"
    }));
    
    if (error) {
      console.error('Error adding constraint:', error);
    } else {
      console.log('✅ New constraint added');
    }
    
    // Update existing data
    console.log('3. Updating existing data...');
    ({ error } = await supabase
      .from('users')
      .update({ status: 'active' })
      .in('status', ['present', '', null]));
    
    if (error) {
      console.error('Error updating to active:', error);
    } else {
      console.log('✅ Updated records to active status');
    }
    
    ({ error } = await supabase
      .from('users')
      .update({ status: 'inactive' })
      .in('status', ['absent', 'late']));
    
    if (error) {
      console.error('Error updating to inactive:', error);
    } else {
      console.log('✅ Updated records to inactive status');
    }
    
    console.log('🎉 Status field migration completed!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  fixStatusFieldDirect();
}

module.exports = { fixStatusField, fixStatusFieldDirect };
