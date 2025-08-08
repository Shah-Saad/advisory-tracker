const db = require('../config/db');
const EmailService = require('./EmailService');

class NotificationService {
  /**
   * Create notification record in database
   * @param {Object} notificationData - Notification data
   */
  static async createNotification(notificationData) {
    try {
      // If no specific admin_id is provided, notify all admins
      if (!notificationData.admin_id) {
        const admins = await db('users')
          .join('roles', 'users.role_id', 'roles.id')
          .where('roles.name', 'admin')
          .select('users.id');
        
        const notifications = [];
        for (const admin of admins) {
          const [notification] = await db('notifications')
            .insert({
              user_id: notificationData.user_id,
              admin_id: admin.id,
              type: notificationData.type,
              title: notificationData.title,
              message: notificationData.message,
              data: JSON.stringify(notificationData.data || {}),
              entry_id: notificationData.entry_id,
              is_read: false,
              created_at: new Date()
            })
            .returning('*');
          
          notifications.push(notification);
        }
        return notifications;
      } else {
        const [notification] = await db('notifications')
          .insert({
            user_id: notificationData.user_id,
            admin_id: notificationData.admin_id,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: JSON.stringify(notificationData.data || {}),
            entry_id: notificationData.entry_id,
            is_read: false,
            created_at: new Date()
          })
          .returning('*');
        
        return notification;
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications for admin
   * @param {number} adminId - Admin user ID
   */
  static async getUnreadNotifications(adminId) {
    try {
      const notifications = await db('notifications')
        .leftJoin('users', 'notifications.user_id', 'users.id')
        .leftJoin('sheet_entries', 'notifications.entry_id', 'sheet_entries.id')
        .select(
          'notifications.*',
          'users.username as user_username',
          'users.email as user_email',
          'sheet_entries.product_name',
          'sheet_entries.oem_vendor',
          'sheet_entries.risk_level'
        )
        .where('notifications.admin_id', adminId)
        .where('notifications.is_read', false)
        .orderBy('notifications.created_at', 'desc');
      
      return notifications;
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   */
  static async markAsRead(notificationId) {
    try {
      await db('notifications')
        .where('id', notificationId)
        .update({ is_read: true, read_at: new Date() });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for an admin
   * @param {number} adminId - Admin user ID
   */
  static async markAllAsRead(adminId) {
    try {
      await db('notifications')
        .where('admin_id', adminId)
        .where('is_read', false)
        .update({ is_read: true, read_at: new Date() });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Handle entry update notification
   * @param {Object} entry - Updated entry
   * @param {Object} user - User who made the update
   */
  static async handleEntryUpdate(entry, user) {
    try {
      // Get all admin users
      const admins = await db('users')
        .select('users.*')
        .join('roles', 'users.role_id', 'roles.id')
        .where('roles.name', 'admin');

      for (const admin of admins) {
        // Create notification record
        const notificationData = {
          user_id: user.id,
          admin_id: admin.id,
          type: 'entry_update',
          title: `Entry Updated: ${entry.product_name || 'Advisory Entry'}`,
          message: `${user.username || user.email} updated an entry`,
          entry_id: entry.id
        };

        await NotificationService.createNotification(notificationData);

        // Send email notification if admin email is configured
        if (admin.email && process.env.EMAIL_USER) {
          try {
            await EmailService.sendEntryUpdateNotification(entry, user, admin.email);
            console.log(`Email notification sent to admin: ${admin.email}`);
          } catch (emailError) {
            console.error('Error sending email notification:', emailError);
          }
        }
      }

      console.log(`Notifications created for entry update by user: ${user.username || user.email}`);
    } catch (error) {
      console.error('Error handling entry update notification:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for admin
   * @param {number} adminId - Admin user ID
   */
  static async getNotificationStats(adminId) {
    try {
      const stats = await db('notifications')
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('COUNT(CASE WHEN is_read = false THEN 1 END) as unread'),
          db.raw('COUNT(CASE WHEN is_read = true THEN 1 END) as read')
        )
        .where('admin_id', adminId)
        .first();

      return {
        total: parseInt(stats.total) || 0,
        unread: parseInt(stats.unread) || 0,
        read: parseInt(stats.read) || 0
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Get recent notifications for admin dashboard
   * @param {number} adminId - Admin user ID
   * @param {number} limit - Number of notifications to return
   */
  static async getRecentNotifications(adminId, limit = 10) {
    try {
      const notifications = await db('notifications')
        .leftJoin('users', 'notifications.user_id', 'users.id')
        .leftJoin('sheet_entries', 'notifications.entry_id', 'sheet_entries.id')
        .select(
          'notifications.*',
          'users.username as user_username',
          'users.email as user_email',
          'sheet_entries.product_name',
          'sheet_entries.oem_vendor',
          'sheet_entries.risk_level'
        )
        .where('notifications.admin_id', adminId)
        .orderBy('notifications.created_at', 'desc')
        .limit(limit);
      
      return notifications;
    } catch (error) {
      console.error('Error getting recent notifications:', error);
      throw error;
    }
  }

  /**
   * Delete a specific notification
   * @param {number} notificationId - Notification ID
   */
  static async deleteNotification(notificationId) {
    try {
      const deletedCount = await db('notifications')
        .where('id', notificationId)
        .del();
      
      if (deletedCount === 0) {
        throw new Error('Notification not found');
      }
      
      return { message: 'Notification deleted successfully' };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for an admin
   * @param {number} adminId - Admin user ID
   */
  static async deleteAllNotifications(adminId) {
    try {
      const deletedCount = await db('notifications')
        .where('admin_id', adminId)
        .del();
      
      return { message: `${deletedCount} notifications deleted successfully` };
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
