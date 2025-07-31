const express = require('express');
const UserManagementService = require('../services/UserManagementService');
const { requireAuth, requireRole, requirePermission } = require('../middlewares/auth');
const router = express.Router();

// Get all users (admin only)
router.get('/', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const users = await UserManagementService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user (admin/manager only)
router.post('/', requireAuth, requirePermission('create_users'), async (req, res) => {
  try {
    const newUser = await UserManagementService.createUser(req.body, req.user.id);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

// Update user (admin/manager only)
router.put('/:id', requireAuth, requirePermission('edit_users'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updatedUser = await UserManagementService.updateUser(userId, req.body, req.user.id);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Prevent self-deletion
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const result = await UserManagementService.deleteUser(userId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Toggle user active status (admin/manager only)
router.patch('/:id/status', requireAuth, requirePermission('edit_users'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { isActive } = req.body;
    
    // Prevent self-deactivation
    if (userId === req.user.id && !isActive) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    const user = await UserManagementService.toggleUserStatus(userId, isActive);
    res.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get user permissions
router.get('/:id/permissions', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const permissions = await UserManagementService.getUserPermissions(userId);
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
});

// Get available roles
router.get('/roles', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const roles = await UserManagementService.getRoles();
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Get available permissions
router.get('/permissions', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const permissions = await UserManagementService.getAvailablePermissions();
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

module.exports = router;
