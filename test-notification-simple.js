// Simple test for notification system
const NotificationService = require('./src/services/NotificationService');
const db = require('./src/config/db');

async function testNotification() {
  try {
    console.log('Testing notification creation...');
    
    // Create a test notification
    const testNotification = await NotificationService.createNotification({
      user_id: 2, // assuming user ID 2 exists
      admin_id: 1, // assuming admin ID 1 exists
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working',
      entry_id: null
    });
    
    console.log('Test notification created:', testNotification);
    
    // Get stats
    const stats = await NotificationService.getNotificationStats(1);
    console.log('Notification stats:', stats);
    
    // Get notifications
    const notifications = await NotificationService.getRecentNotifications(1, 5);
    console.log('Recent notifications:', notifications);
    
    console.log('✅ Notification system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing notification system:', error);
  } finally {
    // Close database connection
    db.destroy();
  }
}

testNotification();
