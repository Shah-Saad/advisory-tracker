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
    // Map frontend role names to backend role names
    const roleMapping = {
      'user': 'team_member',
      'manager': 'team_lead',
      'admin': 'admin'
    };
    
    // Map frontend team names to backend team names
    const teamMapping = {
      'generation': 'Generation',
      'distribution': 'Distribution', 
      'transmission': 'Transmission'
    };
    
    const userData = {
      ...req.body,
      role: roleMapping[req.body.role] || 'team_member',
      team: req.body.team ? (teamMapping[req.body.team.toLowerCase()] || req.body.team) : undefined
    };
    
    const newUser = await UserManagementService.createUser(userData, req.user.id);
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
    const backendRoles = await UserManagementService.getRoles();
    
    // Map backend role names to frontend role names
    const roleMapping = {
      'team_member': 'user',
      'team_lead': 'manager', 
      'admin': 'admin'
    };
    
    const frontendRoles = backendRoles.map(role => ({
      ...role,
      name: roleMapping[role.name] || role.name
    }));
    
    res.json(frontendRoles);
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

// Get available teams
router.get('/teams', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const backendTeams = await UserManagementService.getTeams();
    
    // Map backend team names to frontend team names
    const teamMapping = {
      'Generation': 'generation',
      'Distribution': 'distribution', 
      'Transmission': 'transmission'
    };
    
    const frontendTeams = backendTeams.map(team => ({
      ...team,
      name: teamMapping[team.name] || team.name.toLowerCase()
    }));
    
    res.json(frontendTeams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

module.exports = router;
