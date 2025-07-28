const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { requirePermission, requireOwnershipOrAdmin } = require('../middlewares/rbac');

// Public routes
router.post('/login', userController.login);

// Protected routes - require authentication
router.use(auth);

// User profile routes (self-access)
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Admin-only user management routes
router.get('/', requirePermission('manage_users'), userController.getAllUsers);
router.post('/', requirePermission('manage_users'), userController.createUser);

// User-specific routes (self or admin access)
router.get('/:id', requireOwnershipOrAdmin(), userController.getUserById);
router.put('/:id', requireOwnershipOrAdmin(), userController.updateUser);
router.delete('/:id', requirePermission('manage_users'), userController.deleteUser);

// Admin-only status management
router.patch('/:id/status', requirePermission('manage_users'), userController.changeUserStatus);

// Permission checking
router.get('/:id/permissions', requireOwnershipOrAdmin(), userController.getUserPermissions);

module.exports = router;
