require('dotenv').config();

// Test the email service directly
const emailService = require('./services/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service...');
  
  console.log('Email service configured:', emailService.isConfigured);
  
  if (!emailService.isConfigured) {
    console.log('⚠️ Email service not configured. Add EMAIL_USER and EMAIL_PASS to .env file.');
    return;
  }
  
  try {
    const result = await emailService.sendPasswordEmail(
      'test@example.com',
      'Test User', 
      'TEST123'
    );
    
    console.log('Email send result:', result);
  } catch (error) {
    console.error('Email test error:', error.message);
  }
}

testEmailService();