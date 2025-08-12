const fs = require('fs');
const path = require('path');

console.log('📧 Email Notification Setup for Advisory Tracker\n');

console.log('This script will help you set up email notifications for the Advisory Tracker system.\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found. Creating one from template...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from template');
  } else {
    console.log('❌ env.example file not found. Please create a .env file manually.');
    process.exit(1);
  }
}

console.log('📝 Email Configuration Steps:\n');

console.log('1️⃣ Gmail Setup:');
console.log('   - Go to your Google Account settings');
console.log('   - Enable 2-Factor Authentication');
console.log('   - Generate an App Password for "Mail"');
console.log('   - Use this password in EMAIL_PASSWORD\n');

console.log('2️⃣ Environment Variables:');
console.log('   Edit your .env file and set these values:');
console.log('   EMAIL_USER=your-email@gmail.com');
console.log('   EMAIL_PASSWORD=your-app-specific-password');
console.log('   FRONTEND_URL=http://localhost:3001\n');

console.log('3️⃣ Test Configuration:');
console.log('   Run: node scripts/test_email.js\n');

console.log('📋 Available Email Notifications:');
console.log('   ✅ Entry Update Notifications');
console.log('   ✅ Welcome Notifications');
console.log('   ✅ Sheet Submission Notifications');
console.log('   ✅ Sheet Unlock Notifications');
console.log('   ✅ Team Assignment Notifications\n');

console.log('🔧 Troubleshooting:');
console.log('   - Check EMAIL_SETUP.md for detailed instructions');
console.log('   - Verify Gmail app password is correct');
console.log('   - Ensure 2FA is enabled on Gmail account');
console.log('   - Check if emails are going to spam folder\n');

console.log('📚 Documentation:');
console.log('   - See EMAIL_SETUP.md for complete setup guide');
console.log('   - Check EmailService.js for email templates');
console.log('   - Review NotificationService.js for notification logic\n');

console.log('🎉 Setup complete! Follow the steps above to configure email notifications.');
