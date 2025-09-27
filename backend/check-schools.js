const { supabase } = require('./config/supabase');

async function checkSchools() {
  console.log('🔍 Checking schools...');
  
  try {
    // Get all schools
    const { data: schools, error } = await supabase
      .from('schools')
      .select('*')
      .limit(10);
      
    if (error) {
      console.error('❌ Error fetching schools:', error);
      return;
    }
    
    console.log('🏫 Available schools:', JSON.stringify(schools, null, 2));
    console.log(`📊 Total schools found: ${schools?.length || 0}`);
    
    if (schools && schools.length > 0) {
      console.log('🎯 First school ID for admin creation:', schools[0].id);
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
}

checkSchools();
