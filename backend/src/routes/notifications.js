const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');
const { auth } = require('../middlewares/auth');

/**
 * @route GET /api/notifications
 * @desc Get notifications for the logged-in user
 * @access Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        // Get notifications for the user
        const notifications = await NotificationService.getUserNotifications(req.user.id, limit);

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
        const count = await NotificationService.getUnreadCount(req.user.id);
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
 * @desc Mark a notification as read
 * @access Private
 */
router.put('/:id/read', auth, async (req, res) => {
    try {
        const { id } = req.params;
        await NotificationService.markAsRead(id, req.user.id);
        
        res.json({
            message: 'Notification marked as read'
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
 * @desc Mark all notifications as read for the user
 * @access Private
 */
router.put('/read-all', auth, async (req, res) => {
    try {
        await NotificationService.markAllAsRead(req.user.id);
        
        res.json({
            message: 'All notifications marked as read'
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
