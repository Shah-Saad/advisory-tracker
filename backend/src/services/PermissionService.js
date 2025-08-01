const Permission = require('../models/Permission');

class PermissionService {
  static async getAllPermissions() {
    return await Permission.findAll();
  }

  static async getPermissionById(id) {
    const permission = await Permission.findById(id);
    if (!permission) {
      throw new Error('Permission not found');
    }
    return permission;
  }

  static async getPermissionsByCategory(category) {
    return await Permission.findByCategory(category);
  }

  static async createPermission(permissionData) {
    // Check if permission with same name already exists
    const existingPermission = await Permission.findByName(permissionData.name);
    if (existingPermission) {
      throw new Error('Permission with this name already exists');
    }

    return await Permission.create(permissionData);
  }

  static async updatePermission(id, permissionData) {
    // Check if permission exists
    const existingPermission = await Permission.findById(id);
    if (!existingPermission) {
      throw new Error('Permission not found');
    }

    // Check if name is being changed and if new name conflicts
    if (permissionData.name && permissionData.name !== existingPermission.name) {
      const conflictingPermission = await Permission.findByName(permissionData.name);
      if (conflictingPermission) {
        throw new Error('Permission with this name already exists');
      }
    }

    return await Permission.update(id, permissionData);
  }

  static async deletePermission(id) {
    // Check if permission exists
    const existingPermission = await Permission.findById(id);
    if (!existingPermission) {
      throw new Error('Permission not found');
    }

    // Check if permission is being used by any roles
    const RolePermission = require('../models/RolePermission');
    const rolesWithPermission = await RolePermission.findByPermissionId(id);
    if (rolesWithPermission.length > 0) {
      throw new Error('Cannot delete permission that is assigned to roles');
    }

    return await Permission.delete(id);
  }
}

module.exports = PermissionService;
