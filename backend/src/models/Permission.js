const BaseModel = require('./BaseModel');

class Permission extends BaseModel {
  static tableName = 'permissions';

  static async findByName(name) {
    return this.findOneBy({ name });
  }

  static async findByCategory(category) {
    return this.findBy({ category });
  }

  static async findByRoleId(roleId) {
    const db = require('../config/db');
    return db(this.tableName)
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .where('role_permissions.role_id', roleId)
      .select('permissions.*');
  }
}

module.exports = Permission;
