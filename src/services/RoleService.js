const Role = require('../models/Role');
const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');

class RoleService {
  static async getAllRoles() {
    return await Role.findAllWithPermissions();
  }

  static async getRoleById(id) {
    const role = await Role.findWithPermissions(id);
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  }

  static async createRole(roleData) {
    // Check if role with same name already exists
    const existingRole = await Role.findByName(roleData.name);
    if (existingRole) {
      throw new Error('Role with this name already exists');
    }

    return await Role.create(roleData);
  }

  static async updateRole(id, roleData) {
    // Check if role exists
    const existingRole = await Role.findById(id);
    if (!existingRole) {
      throw new Error('Role not found');
    }

    // Check if name is being changed and if new name conflicts
    if (roleData.name && roleData.name !== existingRole.name) {
      const conflictingRole = await Role.findByName(roleData.name);
      if (conflictingRole) {
        throw new Error('Role with this name already exists');
      }
    }

    return await Role.update(id, roleData);
  }

  static async deleteRole(id) {
    // Check if role exists
    const existingRole = await Role.findById(id);
    if (!existingRole) {
      throw new Error('Role not found');
    }

    // Check if role is being used by any users
    const User = require('../models/User');
    const usersWithRole = await User.findByRoleId(id);
    if (usersWithRole.length > 0) {
      throw new Error('Cannot delete role that is assigned to users');
    }

    return await Role.delete(id);
  }

  static async assignPermissionToRole(roleId, permissionId) {
    // Verify role exists
    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Verify permission exists
    const permission = await Permission.findById(permissionId);
    if (!permission) {
      throw new Error('Permission not found');
    }

    return await RolePermission.assignPermissionToRole(roleId, permissionId);
  }

  static async removePermissionFromRole(roleId, permissionId) {
    // Verify role exists
    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Verify permission exists
    const permission = await Permission.findById(permissionId);
    if (!permission) {
      throw new Error('Permission not found');
    }

    return await RolePermission.removePermissionFromRole(roleId, permissionId);
  }

  static async getRolePermissions(roleId) {
    // Verify role exists
    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    return await Permission.findByRoleId(roleId);
  }
}

module.exports = RoleService;
