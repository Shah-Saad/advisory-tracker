const BaseModel = require('./BaseModel');

class Role extends BaseModel {
  static tableName = 'roles';

  static async findByName(name) {
    return this.findOneBy({ name });
  }

  static async findWithPermissions(roleId) {
    const db = require('../config/db');
    return db(this.tableName)
      .leftJoin('role_permissions', 'roles.id', 'role_permissions.role_id')
      .leftJoin('permissions', 'role_permissions.permission_id', 'permissions.id')
      .select(
        'roles.*',
        db.raw('ARRAY_AGG(permissions.name) as permissions')
      )
      .where('roles.id', roleId)
      .groupBy('roles.id')
      .first();
  }

  static async findAllWithPermissions() {
    const db = require('../config/db');
    return db(this.tableName)
      .leftJoin('role_permissions', 'roles.id', 'role_permissions.role_id')
      .leftJoin('permissions', 'role_permissions.permission_id', 'permissions.id')
      .select(
        'roles.*',
        db.raw('ARRAY_AGG(permissions.name) as permissions')
      )
      .groupBy('roles.id');
  }
}

module.exports = Role;
