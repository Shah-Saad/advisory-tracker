const BaseModel = require('./BaseModel');

class RolePermission extends BaseModel {
  static tableName = 'role_permissions';

  static async assignPermissionToRole(roleId, permissionId) {
    const existing = await this.findOneBy({ role_id: roleId, permission_id: permissionId });
    if (existing) {
      throw new Error('Permission already assigned to role');
    }
    return this.create({ role_id: roleId, permission_id: permissionId });
  }

  static async removePermissionFromRole(roleId, permissionId) {
    const db = require('../config/db');
    return db(this.tableName)
      .where({ role_id: roleId, permission_id: permissionId })
      .del();
  }

  static async findByRoleId(roleId) {
    return this.findBy({ role_id: roleId });
  }

  static async findByPermissionId(permissionId) {
    return this.findBy({ permission_id: permissionId });
  }
}

module.exports = RolePermission;
