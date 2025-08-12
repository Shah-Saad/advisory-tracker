const EmailService = require('../src/services/EmailService');

async function testEmailNotifications() {
  console.log('🧪 Testing Email Notification System...\n');

  try {
    // Test 1: Basic email sending
    console.log('1️⃣ Testing basic email sending...');
    const basicResult = await EmailService.sendEmail(
      'test@example.com', // Replace with your test email
      'Test Email from Advisory Tracker',
      '<h2>Test Email</h2><p>This is a test email from the Advisory Tracker system.</p>',
      'Test Email\n\nThis is a test email from the Advisory Tracker system.'
    );
    
    if (basicResult.success) {
      console.log('✅ Basic email test successful!');
      console.log('   Message ID:', basicResult.messageId);
    } else {
      console.log('❌ Basic email test failed:', basicResult.error);
    }

    // Test 2: Entry update notification
    console.log('\n2️⃣ Testing entry update notification...');
    const mockEntry = {
      id: 1,
      product_name: 'Test Product',
      oem_vendor: 'Test Vendor',
      risk_level: 'High',
      deployed_in_ke: 'Y',
      cve: 'CVE-2024-1234'
    };

    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'testuser@example.com',
      role: 'user'
    };

    const entryUpdateResult = await EmailService.sendEntryUpdateNotification(
      mockEntry,
      mockUser,
      'admin@example.com' // Replace with admin email
    );

    if (entryUpdateResult.success) {
      console.log('✅ Entry update notification test successful!');
      console.log('   Message ID:', entryUpdateResult.messageId);
    } else {
      console.log('❌ Entry update notification test failed:', entryUpdateResult.error);
    }

    // Test 3: Welcome notification
    console.log('\n3️⃣ Testing welcome notification...');
    const mockNewUser = {
      username: 'newuser',
      email: 'newuser@example.com',
      role: 'user'
    };

    const welcomeResult = await EmailService.sendWelcomeNotification(mockNewUser);

    if (welcomeResult.success) {
      console.log('✅ Welcome notification test successful!');
      console.log('   Message ID:', welcomeResult.messageId);
    } else {
      console.log('❌ Welcome notification test failed:', welcomeResult.error);
    }

    // Test 4: Sheet submission notification
    console.log('\n4️⃣ Testing sheet submission notification...');
    const mockSheet = {
      id: 1,
      title: 'Test Advisory Sheet'
    };

    const mockTeam = {
      id: 1,
      name: 'Distribution Team'
    };

    const submissionResult = await EmailService.sendSheetSubmissionNotification(
      mockSheet,
      mockTeam,
      mockUser,
      'admin@example.com' // Replace with admin email
    );

    if (submissionResult.success) {
      console.log('✅ Sheet submission notification test successful!');
      console.log('   Message ID:', submissionResult.messageId);
    } else {
      console.log('❌ Sheet submission notification test failed:', submissionResult.error);
    }

    // Test 5: Sheet unlock notification
    console.log('\n5️⃣ Testing sheet unlock notification...');
    const mockAdmin = {
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin'
    };

    const unlockResult = await EmailService.sendSheetUnlockNotification(
      mockSheet,
      mockTeam,
      mockAdmin,
      'Additional information needed',
      'team@example.com' // Replace with team member email
    );

    if (unlockResult.success) {
      console.log('✅ Sheet unlock notification test successful!');
      console.log('   Message ID:', unlockResult.messageId);
    } else {
      console.log('❌ Sheet unlock notification test failed:', unlockResult.error);
    }

    // Test 6: Team assignment notification
    console.log('\n6️⃣ Testing team assignment notification...');
    const assignmentResult = await EmailService.sendTeamAssignmentNotification(
      mockSheet,
      mockTeam,
      'team@example.com' // Replace with team member email
    );

    if (assignmentResult.success) {
      console.log('✅ Team assignment notification test successful!');
      console.log('   Message ID:', assignmentResult.messageId);
    } else {
      console.log('❌ Team assignment notification test failed:', assignmentResult.error);
    }

    console.log('\n🎉 Email notification tests completed!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Check your email inbox for test messages');
    console.log('   2. Verify email templates look correct');
    console.log('   3. Update environment variables with real email addresses');
    console.log('   4. Test with actual system events');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check EMAIL_USER and EMAIL_PASSWORD environment variables');
    console.log('   2. Verify Gmail app password is correct');
    console.log('   3. Ensure 2FA is enabled on Gmail account');
    console.log('   4. Check if emails are going to spam folder');
  }
}

// Check if email configuration is set up
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.log('⚠️  Email configuration not found!');
  console.log('Please set up the following environment variables:');
  console.log('   EMAIL_USER=your-email@gmail.com');
  console.log('   EMAIL_PASSWORD=your-app-specific-password');
  console.log('   FRONTEND_URL=http://localhost:3001');
  console.log('\nSee EMAIL_SETUP.md for detailed instructions.');
} else {
  testEmailNotifications();
}
