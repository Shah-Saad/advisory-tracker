const db = require('../config/db');

class NotificationService {
  static async createNotification(notificationData) {
    try {
      const { user_id, admin_id, type, title, message, data } = notificationData;
      
      const notification = await db('notifications').insert({
        user_id,
        admin_id,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        created_at: db.fn.now(),
        read_at: null
      }).returning('*');

      console.log(`✅ Notification created: ${type} for user ${user_id}`);
      return notification[0];
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId, limit = 50) {
    try {
      const notifications = await db('notifications')
        .where('user_id', userId)
        .where('type', 'patching_reminder') // Only show patching reminder notifications to users
        .orderBy('created_at', 'desc')
        .limit(limit);

      return notifications.map(notification => ({
        ...notification,
        data: notification.data ? (typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data) : null
      }));
    } catch (error) {
      console.error('❌ Error getting user notifications:', error);
      throw error;
    }
  }

  static async getAdminNotifications(adminId, limit = 50) {
    try {
      const notifications = await db('notifications')
        .where('admin_id', adminId)
        .orderBy('created_at', 'desc')
        .limit(limit);

      return notifications.map(notification => ({
        ...notification,
        data: notification.data ? (typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data) : null
      }));
    } catch (error) {
      console.error('❌ Error getting admin notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      // Delete the notification instead of just marking as read
      // For users, only allow deleting patching_reminder notifications
      await db('notifications')
        .where({ id: notificationId, user_id: userId, type: 'patching_reminder' })
        .del();

      console.log(`✅ Notification ${notificationId} deleted (marked as read)`);
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      // Delete all unread notifications instead of just marking as read
      // For users, only delete patching_reminder notifications
      await db('notifications')
        .where({ user_id: userId, read_at: null, type: 'patching_reminder' })
        .del();

      console.log(`✅ All unread patching reminder notifications deleted for user ${userId}`);
    } catch (error) {
      console.error('❌ Error deleting all notifications:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      const result = await db('notifications')
        .where({ user_id: userId, read_at: null })
        .where('type', 'patching_reminder') // Only count patching reminder notifications for users
        .count('* as count')
        .first();

      return parseInt(result.count);
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId, userId) {
    try {
      await db('notifications')
        .where({ id: notificationId, user_id: userId })
        .del();

      console.log(`✅ Notification ${notificationId} deleted`);
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
