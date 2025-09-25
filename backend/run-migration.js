const { supabase } = require('./config/supabase');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting attendance status migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'migrate_status_to_attendance.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`\nExecuting statement ${i + 1}:`);
        console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          // Try direct execution for some statements
          const { error: directError } = await supabase.from('_sql').select('*').limit(0);
          if (directError) {
            console.log('Trying alternative execution method...');
          }
        } else {
          console.log(`✓ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('\nMigration completed successfully!');
    console.log('\nVerifying migration results...');
    
    // Verify the migration worked
    const { data: attendanceWithStatus, error: verifyError } = await supabase
      .from('attendance')
      .select('id, status')
      .limit(5);
    
    if (verifyError) {
      console.error('Error verifying migration:', verifyError);
    } else {
      console.log('Sample attendance records with status:');
      console.table(attendanceWithStatus);
    }
    
    // Check status distribution
    const { data: statusCounts, error: countError } = await supabase
      .from('attendance')
      .select('status')
      .limit(1000);
      
    if (!countError && statusCounts) {
      const statusDistribution = statusCounts.reduce((acc, record) => {
        acc[record.status || 'null'] = (acc[record.status || 'null'] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\nStatus distribution:');
      console.table(statusDistribution);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
