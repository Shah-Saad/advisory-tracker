// Test email functionality
const EmailService = require('./src/services/EmailService');

async function testEmail() {
  try {
    console.log('Testing email service...');
    
    const testEntry = {
      id: 123,
      product_name: 'Test Product',
      oem_vendor: 'Test Vendor',
      risk_level: 'High'
    };
    
    const testUser = {
      username: 'test_user',
      email: 'test@example.com'
    };
    
    // Test email send
    const result = await EmailService.sendEntryUpdateNotification(
      testEntry,
      testUser,
      'shahsaad2302@gmail.com'  // Send to the configured email
    );
    
    console.log('✅ Email sent successfully:', result);
    
  } catch (error) {
    console.error('❌ Error testing email:', error);
  }
}

testEmail();
