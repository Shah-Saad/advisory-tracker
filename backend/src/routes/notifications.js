const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');
const { auth } = require('../middlewares/auth');
const { checkImplementationDates } = require('../../scripts/implementation_reminder');
const db = require('../config/db'); // Fixed import path

/**
 * @route GET /api/notifications
 * @desc Get notifications for the logged-in user
 * @access Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        // Get notifications based on user role
        let notifications;
        if (req.user.role === 'admin') {
            notifications = await NotificationService.getAdminNotifications(req.user.id, limit);
        } else {
            notifications = await NotificationService.getUserNotifications(req.user.id, limit);
        }

        res.json(notifications);
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve notifications', 
            error: error.message 
        });
    }
});

/**
 * @route GET /api/notifications/unread-count
 * @desc Get unread notification count for the user
 * @access Private
 */
router.get('/unread-count', auth, async (req, res) => {
    try {
        let count;
        if (req.user.role === 'admin') {
            // For admins, count all unread notifications
            const result = await db('notifications')
                .where({ admin_id: req.user.id, read_at: null })
                .count('* as count')
                .first();
            count = parseInt(result.count);
        } else {
            // For users, only count patching reminder notifications
            count = await NotificationService.getUnreadCount(req.user.id);
        }
        
        res.json({ count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve unread count', 
            error: error.message 
        });
    }
});

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark a notification as read (deletes it)
 * @access Private
 */
router.put('/:id/read', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (req.user.role === 'admin') {
            // For admins, delete any notification
            await db('notifications')
                .where({ id: id, admin_id: req.user.id })
                .del();
        } else {
            // For users, only delete patching reminder notifications
            await NotificationService.markAsRead(id, req.user.id);
        }
        
        res.json({
            message: 'Notification marked as read and removed'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ 
            message: 'Failed to mark notification as read', 
            error: error.message 
        });
    }
});

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read for the user (deletes them)
 * @access Private
 */
router.put('/read-all', auth, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            // For admins, delete all unread notifications
            await db('notifications')
                .where({ admin_id: req.user.id, read_at: null })
                .del();
        } else {
            // For users, only delete patching reminder notifications
            await NotificationService.markAllAsRead(req.user.id);
        }
        
        res.json({
            message: 'All notifications marked as read and removed'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ 
            message: 'Failed to mark all notifications as read', 
            error: error.message 
        });
    }
});

/**
 * @route POST /api/notifications/check-patching-reminders
 * @desc Check for patching reminders and create notifications if needed
 * @access Private
 */
router.post('/check-patching-reminders', auth, async (req, res) => {
    try {
        console.log('🔍 Checking for patching reminders...');
        
        // Run the patching reminder check
        await checkImplementationDates();
        
        // Get updated notifications for the user
        const notifications = await NotificationService.getUserNotifications(req.user.id, 10);
        const unreadCount = await NotificationService.getUnreadCount(req.user.id);
        
        res.json({
            message: 'Patching reminders checked successfully',
            notifications,
            unreadCount,
            checked: true
        });
    } catch (error) {
        console.error('Error checking patching reminders:', error);
        res.status(500).json({ 
            message: 'Failed to check patching reminders', 
            error: error.message 
        });
    }
});

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete a specific notification
 * @access Private
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        await NotificationService.deleteNotification(id, req.user.id);
        
        res.json({
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ 
            message: 'Failed to delete notification', 
            error: error.message 
        });
    }
});

module.exports = router;
