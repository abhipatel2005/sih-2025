const { supabase } = require('./config/supabase');

async function runDirectMigration() {
  try {
    console.log('Starting direct attendance status migration...');
    
    // Step 1: Check if status column exists
    console.log('\n1. Checking current attendance table structure...');
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('attendance')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error checking table structure:', sampleError);
      return;
    }
    
    console.log('Sample record structure:', Object.keys(sampleRecord[0] || {}));
    
    // Step 2: Add status column if it doesn't exist (this needs to be done manually in Supabase SQL editor)
    console.log('\n2. Adding status column...');
    console.log('⚠️  Please run this SQL directly in Supabase SQL editor:');
    console.log('ALTER TABLE attendance ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT \'present\' CHECK (status IN (\'present\', \'absent\', \'late\', \'excused\'));');
    
    // Step 3: Update existing records
    console.log('\n3. Updating existing attendance records with default status...');
    
    // Get all records without status or with empty status
    const { data: recordsToUpdate, error: fetchError } = await supabase
      .from('attendance')
      .select('id, status')
      .is('status', null);
    
    if (fetchError) {
      console.log('Trying to fetch records without status filter...');
      
      // Try updating all records to have 'present' status
      const { data: updateResult, error: updateError } = await supabase
        .from('attendance')
        .update({ status: 'present' })
        .select('id');
        
      if (updateError) {
        console.error('Error updating records:', updateError.message);
        console.log('\n⚠️  Please run this SQL directly in Supabase SQL editor:');
        console.log('UPDATE attendance SET status = \'present\' WHERE status IS NULL OR status = \'\';');
      } else {
        console.log(`✓ Updated ${updateResult?.length || 0} records with default 'present' status`);
      }
    } else {
      console.log(`Found ${recordsToUpdate?.length || 0} records to update`);
      
      if (recordsToUpdate && recordsToUpdate.length > 0) {
        const { error: batchUpdateError } = await supabase
          .from('attendance')
          .update({ status: 'present' })
          .is('status', null);
          
        if (batchUpdateError) {
          console.error('Error in batch update:', batchUpdateError);
        } else {
          console.log('✓ Successfully updated records with default status');
        }
      }
    }
    
    // Step 4: Verify the results
    console.log('\n4. Verifying migration results...');
    const { data: verificationRecords, error: verifyError } = await supabase
      .from('attendance')
      .select('id, date, status, users(name)')
      .limit(10);
    
    if (verifyError) {
      console.error('Error verifying results:', verifyError);
    } else {
      console.log('Sample records after migration:');
      console.table(verificationRecords);
    }
    
    console.log('\n5. Manual steps still needed:');
    console.log('Please run the following SQL commands in Supabase SQL editor:');
    console.log('');
    console.log('-- Add status column if not exists');
    console.log('ALTER TABLE attendance ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT \'present\' CHECK (status IN (\'present\', \'absent\', \'late\', \'excused\'));');
    console.log('');
    console.log('-- Update any null status values');
    console.log('UPDATE attendance SET status = \'present\' WHERE status IS NULL OR status = \'\';');
    console.log('');
    console.log('-- Create indexes for better performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);');
    console.log('CREATE INDEX IF NOT EXISTS idx_attendance_user_status ON attendance(user_id, status);');
    console.log('');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runDirectMigration();
