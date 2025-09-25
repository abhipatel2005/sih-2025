const { supabase } = require('./config/supabase');
const bcrypt = require('bcrypt');

async function updateUserPassword() {
  try {
    const email = 'principal1@sunrisepublicschool.edu';
    const newPassword = 'admin123';
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    const { data, error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', email)
      .select();
    
    if (error) {
      console.error('Error updating password:', error);
      return;
    }
    
    console.log('✓ Password updated successfully for:', email);
    console.log('New password:', newPassword);
    
  } catch (error) {
    console.error('Failed:', error);
  }
}

updateUserPassword();
