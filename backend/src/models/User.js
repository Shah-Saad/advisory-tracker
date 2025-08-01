const BaseModel = require('./BaseModel');

class User extends BaseModel {
  static tableName = 'users';

  static async findByEmail(email) {
    return this.findOneBy({ email });
  }

  static async findWithRole(userId) {
    const db = require('../config/db');
    return db(this.tableName)
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .select(
        'users.*',
        'roles.name as role_name',
        'roles.description as role_description'
      )
      .where('users.id', userId)
      .first();
  }

  static async findAllWithRoles() {
    const db = require('../config/db');
    return db(this.tableName)
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.team',
        'users.is_active',
        'users.created_at',
        'users.updated_at',
        'roles.name as role_name',
        'roles.description as role_description'
      );
  }

  static async findByTeam(team) {
    return this.findBy({ team });
  }

  static async findByRoleId(roleId) {
    return this.findBy({ role_id: roleId });
  }

  static async getUserPermissions(userId) {
    const db = require('../config/db');
    return db('permissions')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .join('roles', 'role_permissions.role_id', 'roles.id')
      .join('users', 'roles.id', 'users.role_id')
      .where('users.id', userId)
      .select('permissions.name', 'permissions.description', 'permissions.resource', 'permissions.action');
  }

  static async hasPermission(userId, permissionName) {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some(permission => permission.name === permissionName);
  }
}

module.exports = User;