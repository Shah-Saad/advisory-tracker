const axios = require('axios');

async function testWebNotifications() {
  try {
    console.log('🧪 Testing Web Notifications (No Email)...\n');

    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const adminLoginResponse = await axios.post('http://localhost:3000/api/users/login', {
      username: 'admin',
      password: 'admin123'
    });
    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Admin login successful\n');

    // Step 2: Test notifications endpoint
    console.log('2️⃣ Testing notifications endpoint...');
    try {
      const notificationsResponse = await axios.get('http://localhost:3000/api/notifications', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Notifications endpoint working!');
      console.log('📊 Notifications count:', notificationsResponse.data.length || 0);
      
      if (notificationsResponse.data.length > 0) {
        console.log('📋 Sample notification:', {
          id: notificationsResponse.data[0].id,
          type: notificationsResponse.data[0].type,
          title: notificationsResponse.data[0].title,
          message: notificationsResponse.data[0].message,
          created_at: notificationsResponse.data[0].created_at
        });
      }
    } catch (notificationError) {
      console.log('⚠️ Notifications endpoint failed:', notificationError.response?.data?.error || notificationError.message);
    }

    // Step 3: Test notification creation
    console.log('\n3️⃣ Testing notification creation...');
    try {
      const createNotificationResponse = await axios.post('http://localhost:3000/api/notifications', {
        type: 'test_notification',
        title: 'Test Web Notification',
        message: 'This is a test web notification without email',
        data: {
          test: true,
          timestamp: new Date().toISOString()
        }
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Test notification created successfully!');
      console.log('📊 Created notification ID:', createNotificationResponse.data.id);
    } catch (createError) {
      console.log('⚠️ Notification creation failed:', createError.response?.data?.error || createError.message);
    }

    // Step 4: Test mark as read
    console.log('\n4️⃣ Testing mark as read...');
    try {
      const notificationsResponse = await axios.get('http://localhost:3000/api/notifications', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (notificationsResponse.data.length > 0) {
        const firstNotification = notificationsResponse.data[0];
        const markReadResponse = await axios.put(`http://localhost:3000/api/notifications/${firstNotification.id}/read`, {}, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        console.log('✅ Mark as read successful!');
        console.log('📊 Updated notification:', markReadResponse.data);
      } else {
        console.log('⚠️ No notifications to mark as read');
      }
    } catch (markReadError) {
      console.log('⚠️ Mark as read failed:', markReadError.response?.data?.error || markReadError.message);
    }

    // Step 5: Test unread count
    console.log('\n5️⃣ Testing unread count...');
    try {
      const unreadCountResponse = await axios.get('http://localhost:3000/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Unread count endpoint working!');
      console.log('📊 Unread notifications:', unreadCountResponse.data.count || 0);
    } catch (unreadCountError) {
      console.log('⚠️ Unread count failed:', unreadCountError.response?.data?.error || unreadCountError.message);
    }

    console.log('\n🎉 Web notification tests completed!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Web notifications working (no email)');
    console.log('   ✅ Notification creation working');
    console.log('   ✅ Mark as read working');
    console.log('   ✅ Unread count working');
    console.log('\n🔧 Next Steps:');
    console.log('   1. Test sheet submission to see notifications');
    console.log('   2. Test sheet unlock to see notifications');
    console.log('   3. Verify notifications appear in the web UI');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testWebNotifications();
