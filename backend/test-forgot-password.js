const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testForgotPassword() {
  try {
    console.log('🧪 Testing Forgot Password API...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email: 'test@example.com' // Use a test email
    });

    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Data:', response.data);
    
  } catch (error) {
    console.error('❌ Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testForgotPassword();