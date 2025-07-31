const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

class UserManagementService {
  static async createUser(userData, createdBy) {
    try {
      const { username, email, password, first_name, last_name, role = 'user', department, team, created_by, permissions = [] } = userData;
      
      // Check if user already exists
      const existingUser = await db('users').where('email', email).orWhere('username', username).first();
      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert user
      const [newUserId] = await db('users').insert({
        username,
        email,
        password_hash: hashedPassword,
        first_name,
        last_name,
        role,
        department,
        team, // Include team assignment
        is_active: true,
        created_by: created_by || createdBy,
        created_at: new Date(),
        updated_at: new Date()
      }).returning('id');
      
      // Extract ID from result
      const userId = typeof newUserId === 'object' ? newUserId.id : newUserId;
      
      // Insert permissions if provided
      if (permissions.length > 0) {
        const permissionRecords = permissions.map(permission => ({
          user_id: userId,
          permission,
          granted_by: created_by || createdBy,
          granted_at: new Date()
        }));
        
        await db('user_permissions').insert(permissionRecords);
      }
      
      // Return user without password
      const newUser = await db('users')
        .select('id', 'username', 'email', 'first_name', 'last_name', 'role', 'department', 'is_active', 'created_at')
        .where('id', userId)
        .first();
        
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  static async getAllUsers() {
    try {
      const users = await db('users')
        .select(
          'users.id',
          'users.username', 
          'users.email',
          'users.first_name',
          'users.last_name',
          'users.role',
          'users.department',
          'users.team',
          'users.is_active',
          'users.last_login',
          'users.created_at',
          'creator.username as created_by_username'
        )
        .leftJoin('users as creator', 'users.created_by', 'creator.id')
        .orderBy('users.created_at', 'desc');
        
      // Get permissions for each user
      for (let user of users) {
        const permissions = await db('user_permissions')
          .select('permission')
          .where('user_id', user.id);
        user.permissions = permissions.map(p => p.permission);
      }
      
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
  
  static async updateUser(userId, updates, updatedBy) {
    try {
      const { password, permissions, ...otherUpdates } = updates;
      
      // Prepare user updates
      const userUpdates = {
        ...otherUpdates,
        updated_at: new Date()
      };
      
      // Hash password if provided
      if (password) {
        userUpdates.password_hash = await bcrypt.hash(password, 10);
      }
      
      // Update user
      await db('users').where('id', userId).update(userUpdates);
      
      // Update permissions if provided
      if (permissions !== undefined) {
        // Delete existing permissions
        await db('user_permissions').where('user_id', userId).del();
        
        // Insert new permissions
        if (permissions.length > 0) {
          const permissionRecords = permissions.map(permission => ({
            user_id: userId,
            permission,
            granted_by: updatedBy,
            granted_at: new Date()
          }));
          
          await db('user_permissions').insert(permissionRecords);
        }
      }
      
      // Return updated user
      const updatedUser = await db('users')
        .select('id', 'username', 'email', 'role', 'department', 'is_active', 'updated_at')
        .where('id', userId)
        .first();
        
      const userPermissions = await db('user_permissions')
        .select('permission')
        .where('user_id', userId);
      updatedUser.permissions = userPermissions.map(p => p.permission);
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  static async deleteUser(userId) {
    try {
      // Delete user permissions first
      await db('user_permissions').where('user_id', userId).del();
      
      // Delete user
      const deletedCount = await db('users').where('id', userId).del();
      
      if (deletedCount === 0) {
        throw new Error('User not found');
      }
      
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
  
  static async updateUserStatus(userId, isActive) {
    try {
      await db('users').where('id', userId).update({
        is_active: isActive,
        updated_at: new Date()
      });
      
      const user = await db('users')
        .select('id', 'username', 'email', 'is_active')
        .where('id', userId)
        .first();
        
      return user;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  static async updateUserPermissions(userId, permissions) {
    try {
      // Delete existing permissions
      await db('user_permissions').where('user_id', userId).del();
      
      // Insert new permissions
      if (permissions.length > 0) {
        const permissionRecords = permissions.map(permission => ({
          user_id: userId,
          permission,
          granted_by: 1, // Admin user ID
          granted_at: new Date()
        }));
        
        await db('user_permissions').insert(permissionRecords);
      }
      
      return { success: true, message: 'Permissions updated successfully' };
    } catch (error) {
      console.error('Error updating user permissions:', error);
      throw error;
    }
  }

  static async toggleUserStatus(userId, isActive) {
    try {
      await db('users').where('id', userId).update({
        is_active: isActive,
        updated_at: new Date()
      });
      
      const user = await db('users')
        .select('id', 'username', 'email', 'is_active')
        .where('id', userId)
        .first();
        
      return user;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }
  
  static async getUserPermissions(userId) {
    try {
      const permissions = await db('user_permissions')
        .select('permission', 'granted_at', 'granted_by')
        .where('user_id', userId);
        
      return permissions;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw error;
    }
  }
  
  static async getRoles() {
    try {
      // Return predefined roles
      return [
        { name: 'admin', description: 'Full system access' },
        { name: 'manager', description: 'Management access with user creation' },
        { name: 'analyst', description: 'Read/write access to advisory data' },
        { name: 'viewer', description: 'Read-only access' },
        { name: 'user', description: 'Standard user access' }
      ];
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }
  
  static async getAvailablePermissions() {
    try {
      // Return predefined permissions
      return [
        'create_users',
        'edit_users', 
        'delete_users',
        'view_users',
        'upload_files',
        'edit_entries',
        'delete_entries',
        'view_entries',
        'manage_vendors',
        'manage_products',
        'view_reports',
        'system_admin'
      ];
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  }
}

module.exports = UserManagementService;
