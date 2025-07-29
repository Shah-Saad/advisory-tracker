// Test script to create a notification and test email functionality
const express = require('express');
const NotificationService = require('./src/services/NotificationService');
const EmailService = require('./src/services/EmailService');

async function testNotificationSystem() {
  try {
    console.log('Testing notification system...');
    
    // Test creating a notification
    const notification = await NotificationService.createNotification(
      'test', // type
      'Test Notification', // title
      'This is a test notification to verify the system is working.', // message
      1, // user_id (assuming admin user)
      1 // entry_id (optional)
    );
    
    console.log('Notification created:', notification);
    
    // Test email service
    const emailService = new EmailService();
    
    // Test email configuration
    const testEmailResult = await emailService.sendEmail(
      'shahsaad2302@gmail.com', // test recipient
      'Advisory Tracker - Test Notification',
      `
      <h2>Test Notification</h2>
      <p>This is a test email to verify the email notification system is working.</p>
      <p><strong>Notification ID:</strong> ${notification.id}</p>
      <p><strong>Created:</strong> ${new Date().toLocaleString()}</p>
      `,
      'This is a test email to verify the email notification system is working.'
    );
    
    console.log('Test email sent:', testEmailResult);
    
    // Fetch notifications for admin
    const notifications = await NotificationService.getNotificationsForUser(1);
    console.log('Fetched notifications:', notifications);
    
    console.log('Notification system test completed successfully!');
    
  } catch (error) {
    console.error('Error testing notification system:', error);
  }
}

// Run the test
testNotificationSystem();

module.exports = { testNotificationSystem };
