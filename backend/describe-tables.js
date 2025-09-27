const { supabase } = require('./config/supabase');

async function describeTable(tableName) {
  try {
    console.log(`🔍 Describing table: ${tableName}`);
    
    // Get table columns using information_schema
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: tableName })
      .select();
    
    if (error) {
      console.log(`❌ Error getting table info for ${tableName}:`, error);
      
      // Try alternative approach - query the table with limit 0 to see columns
      console.log('🔄 Trying alternative approach...');
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log('❌ Alternative approach failed:', sampleError);
        return;
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log(`✅ Table ${tableName} columns (from sample data):`);
        console.log(Object.keys(sampleData[0]).join(', '));
      } else {
        console.log(`⚠️  Table ${tableName} exists but has no data to show columns`);
      }
      
    } else {
      console.log(`✅ Table ${tableName} columns:`, data);
    }
    
  } catch (error) {
    console.error(`❌ Error describing table ${tableName}:`, error);
  }
}

async function describeTables() {
  const tables = ['users', 'schools', 'attendance'];
  
  for (const table of tables) {
    await describeTable(table);
    console.log(''); // Empty line for readability
  }
}

if (require.main === module) {
  describeTables();
}

module.exports = { describeTable, describeTables };
