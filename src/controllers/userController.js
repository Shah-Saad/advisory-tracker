const UserService = require('../services/UserService');

const userController = {
  // Get all users (Admin only)
  async getAllUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);
      res.json(user);
    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Create new user (Admin only)
  async createUser(req, res) {
    try {
      const createdBy = req.user ? req.user.id : null;
      const user = await UserService.createUser(req.body, createdBy);
      res.status(201).json(user);
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'User with this email already exists') statusCode = 409;
      else if (error.message === 'Role not found') statusCode = 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Update user (Admin or self)
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updatedBy = req.user ? req.user.id : null;
      
      // Check if user is updating themselves or if they're admin
      const requestingUserId = req.user.id;
      const userPermissions = await UserService.getUserPermissions(requestingUserId);
      const canManageUsers = userPermissions.some(p => p.name === 'manage_users');
      
      if (requestingUserId !== parseInt(id) && !canManageUsers) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const user = await UserService.updateUser(id, req.body, updatedBy);
      res.json(user);
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'User not found') statusCode = 404;
      else if (error.message === 'Role not found') statusCode = 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Delete user (Admin only)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await UserService.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await UserService.authenticateUser(email, password);
      res.json(result);
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Invalid credentials') statusCode = 401;
      else if (error.message === 'Account is not active') statusCode = 403;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = await UserService.getUserById(req.user.id);
      const permissions = await UserService.getUserPermissions(req.user.id);
      res.json({
        ...user,
        permissions: permissions.map(p => p.name)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update current user profile
  async updateProfile(req, res) {
    try {
      // Remove sensitive fields that users shouldn't be able to update
      const { role_id, status, created_by, updated_by, ...allowedFields } = req.body;
      
      const user = await UserService.updateUser(req.user.id, allowedFields, req.user.id);
      res.json(user);
    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Change user status (Admin only)
  async changeUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedBy = req.user ? req.user.id : null;
      
      const user = await UserService.changeUserStatus(id, status, updatedBy);
      res.json(user);
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'User not found') statusCode = 404;
      else if (error.message === 'Invalid status') statusCode = 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get user permissions
  async getUserPermissions(req, res) {
    try {
      const { id } = req.params;
      const permissions = await UserService.getUserPermissions(id);
      res.json(permissions);
    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  }
};

module.exports = userController;
