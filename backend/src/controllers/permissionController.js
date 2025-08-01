const PermissionService = require('../services/PermissionService');

const permissionController = {
  // Get all permissions
  async getAllPermissions(req, res) {
    try {
      const permissions = await PermissionService.getAllPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get permission by ID
  async getPermissionById(req, res) {
    try {
      const { id } = req.params;
      const permission = await PermissionService.getPermissionById(id);
      res.json(permission);
    } catch (error) {
      const statusCode = error.message === 'Permission not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get permissions by category
  async getPermissionsByCategory(req, res) {
    try {
      const { category } = req.params;
      const permissions = await PermissionService.getPermissionsByCategory(category);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Create new permission
  async createPermission(req, res) {
    try {
      const permission = await PermissionService.createPermission(req.body);
      res.status(201).json(permission);
    } catch (error) {
      const statusCode = error.message.includes('already exists') ? 409 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Update permission
  async updatePermission(req, res) {
    try {
      const { id } = req.params;
      const permission = await PermissionService.updatePermission(id, req.body);
      res.json(permission);
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Permission not found') statusCode = 404;
      else if (error.message.includes('already exists')) statusCode = 409;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Delete permission
  async deletePermission(req, res) {
    try {
      const { id } = req.params;
      await PermissionService.deletePermission(id);
      res.status(204).send();
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Permission not found') statusCode = 404;
      else if (error.message.includes('assigned to roles')) statusCode = 400;
      res.status(statusCode).json({ error: error.message });
    }
  }
};

module.exports = permissionController;
