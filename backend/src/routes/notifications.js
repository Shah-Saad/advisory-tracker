const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');
const { auth } = require('../middlewares/auth');

/**
 * @route GET /api/notifications
 * @desc Get notifications for the logged-in admin
 * @access Private (Admin only)
 */
router.get('/', auth, async (req, res) => {
    try {
        // Only admins can access notifications
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Admin access required.' 
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const unreadOnly = req.query.unread === 'true';

        let notifications;
        if (unreadOnly) {
            notifications = await NotificationService.getUnreadNotifications(req.user.id);
        } else {
            notifications = await NotificationService.getRecentNotifications(req.user.id, limit);
        }

        res.json({
            message: 'Notifications retrieved successfully',
            data: notifications,
            count: notifications.length
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve notifications', 
            error: error.message 
        });
    }
});

/**
 * @route GET /api/notifications/stats
 * @desc Get notification statistics for admin
 * @access Private (Admin only)
 */
router.get('/stats', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Admin access required.' 
            });
        }

        const stats = await NotificationService.getNotificationStats(req.user.id);
        res.json({
            message: 'Notification stats retrieved successfully',
            data: stats
        });
    } catch (error) {
        console.error('Error getting notification stats:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve notification stats', 
            error: error.message 
        });
    }
});

/**
 * @route PUT /api/notifications/:id/read
 * @desc Delete a notification (remove when marked as read)
 * @access Private (Admin only)
 */
router.put('/:id/read', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Admin access required.' 
            });
        }

        const { id } = req.params;
        await NotificationService.deleteNotification(id);
        
        res.json({
            message: 'Notification removed'
        });
    } catch (error) {
        console.error('Error removing notification:', error);
        res.status(500).json({ 
            message: 'Failed to remove notification', 
            error: error.message 
        });
    }
});

/**
 * @route PUT /api/notifications/read-all
 * @desc Delete all notifications for the admin (remove when marked as read)
 * @access Private (Admin only)
 */
router.put('/read-all', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Admin access required.' 
            });
        }

        await NotificationService.deleteAllNotifications(req.user.id);
        
        res.json({
            message: 'All notifications removed'
        });
    } catch (error) {
        console.error('Error removing all notifications:', error);
        res.status(500).json({ 
            message: 'Failed to mark all notifications as read', 
            error: error.message 
        });
    }
});

/**
 * @route GET /api/notifications/unread
 * @desc Get only unread notifications for admin
 * @access Private (Admin only)
 */
router.get('/unread', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Admin access required.' 
            });
        }

        const notifications = await NotificationService.getUnreadNotifications(req.user.id);
        
        res.json({
            message: 'Unread notifications retrieved successfully',
            data: notifications,
            count: notifications.length
        });
    } catch (error) {
        console.error('Error getting unread notifications:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve unread notifications', 
            error: error.message 
        });
    }
});

module.exports = router;
