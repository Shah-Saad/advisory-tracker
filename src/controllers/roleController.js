const RoleService = require('../services/RoleService');

const roleController = {
  // Get all roles
  async getAllRoles(req, res) {
    try {
      const roles = await RoleService.getAllRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get role by ID
  async getRoleById(req, res) {
    try {
      const { id } = req.params;
      const role = await RoleService.getRoleById(id);
      res.json(role);
    } catch (error) {
      const statusCode = error.message === 'Role not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Create new role
  async createRole(req, res) {
    try {
      const role = await RoleService.createRole(req.body);
      res.status(201).json(role);
    } catch (error) {
      const statusCode = error.message.includes('already exists') ? 409 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Update role
  async updateRole(req, res) {
    try {
      const { id } = req.params;
      const role = await RoleService.updateRole(id, req.body);
      res.json(role);
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Role not found') statusCode = 404;
      else if (error.message.includes('already exists')) statusCode = 409;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Delete role
  async deleteRole(req, res) {
    try {
      const { id } = req.params;
      await RoleService.deleteRole(id);
      res.status(204).send();
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Role not found') statusCode = 404;
      else if (error.message.includes('assigned to users')) statusCode = 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Assign permission to role
  async assignPermissionToRole(req, res) {
    try {
      const { roleId, permissionId } = req.params;
      const result = await RoleService.assignPermissionToRole(roleId, permissionId);
      res.status(201).json(result);
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      else if (error.message.includes('already assigned')) statusCode = 409;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Remove permission from role
  async removePermissionFromRole(req, res) {
    try {
      const { roleId, permissionId } = req.params;
      await RoleService.removePermissionFromRole(roleId, permissionId);
      res.status(204).send();
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get role permissions
  async getRolePermissions(req, res) {
    try {
      const { id } = req.params;
      const permissions = await RoleService.getRolePermissions(id);
      res.json(permissions);
    } catch (error) {
      const statusCode = error.message === 'Role not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  }
};

module.exports = roleController;
