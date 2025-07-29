const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const UserManagementService = require('../services/UserManagementService');

// Middleware to ensure only admins can access these routes
router.use(requireAuth);
router.use(requireRole('admin'));

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await UserManagementService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create a new user
router.post('/users', async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, role, department } = req.body;
    
    // Validate required fields
    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userData = {
      username,
      email,
      password,
      first_name,
      last_name,
      role: role || 'user',
      department,
      created_by: req.user.id
    };

    const newUser = await UserManagementService.createUser(userData, req.user.id);
    res.status(201).json({ 
      message: 'User created successfully', 
      user: { ...newUser, password: undefined } // Don't return password
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user status (activate/deactivate)
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean value' });
    }

    await UserManagementService.updateUserStatus(id, isActive);
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Update user details
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated this way
    delete updateData.password;
    delete updateData.created_at;
    delete updateData.updated_at;
    
    const updatedUser = await UserManagementService.updateUser(id, updateData);
    res.json({ 
      message: 'User updated successfully', 
      user: { ...updatedUser, password: undefined } 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await UserManagementService.deleteUser(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user permissions
router.get('/users/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const permissions = await UserManagementService.getUserPermissions(id);
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
});

// Update user permissions
router.put('/users/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }

    await UserManagementService.updateUserPermissions(id, permissions);
    res.json({ message: 'User permissions updated successfully' });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    res.status(500).json({ error: 'Failed to update user permissions' });
  }
});

module.exports = router;
