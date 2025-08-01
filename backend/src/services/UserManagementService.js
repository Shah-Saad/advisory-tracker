const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

class UserManagementService {
  static async createUser(userData, createdBy) {
    try {
      const { username, email, password, first_name, last_name, role, team, role_id, team_id, permissions = [] } = userData;
      
      // Check if user already exists
      const existingUser = await db('users').where('email', email).orWhere('username', username).first();
      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      let finalRoleId = role_id;
      let finalTeamId = team_id;

      // If role name is provided instead of role_id, look it up
      if (role && !role_id) {
        const roleRecord = await db('roles').where('name', role).first();
        if (!roleRecord) {
          throw new Error(`Role '${role}' not found`);
        }
        finalRoleId = roleRecord.id;
      }

      // If team name is provided instead of team_id, look it up
      if (team && !team_id) {
        // Map frontend team names to backend team names
        const teamMapping = {
          'generation': 'Generation',
          'distribution': 'Distribution', 
          'transmission': 'Transmission'
        };
        
        const mappedTeamName = teamMapping[team.toLowerCase()] || team;
        
        const teamRecord = await db('teams').where('name', mappedTeamName).first();
        if (!teamRecord) {
          // Default to 'Generation' team if specified team not found
          console.warn(`Team '${team}' not found, defaulting to 'Generation' team`);
          const defaultTeam = await db('teams').where('name', 'Generation').first();
          if (defaultTeam) {
            finalTeamId = defaultTeam.id;
          }
        } else {
          finalTeamId = teamRecord.id;
        }
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert user with only valid database columns
      const [newUserId] = await db('users').insert({
        username,
        email,
        password_hash: hashedPassword,
        first_name,
        last_name,
        role_id: finalRoleId,
        team_id: finalTeamId,
        is_active: true,
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
          granted_by: createdBy,
          granted_at: new Date()
        }));
        
        await db('user_permissions').insert(permissionRecords);
      }
      
      // Return user without password
      const newUser = await db('users')
        .select('users.id', 'users.username', 'users.email', 'users.first_name', 'users.last_name', 'roles.name as role', 'users.is_active', 'users.created_at')
        .leftJoin('roles', 'users.role_id', 'roles.id')
        .where('users.id', userId)
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
          'roles.name as role',
          'teams.name as team',
          'users.is_active',
          'users.last_login',
          'users.created_at'
        )
        .leftJoin('roles', 'users.role_id', 'roles.id')
        .leftJoin('teams', 'users.team_id', 'teams.id')
        .orderBy('users.created_at', 'desc');
        
      // Map backend role names to frontend role names
      const roleMapping = {
        'team_member': 'user',
        'team_lead': 'manager', 
        'admin': 'admin'
      };
      
      // Map backend team names to frontend team names
      const teamMapping = {
        'Generation': 'generation',
        'Distribution': 'distribution', 
        'Transmission': 'transmission'
      };
        
      // Get permissions for each user and map role names
      for (let user of users) {
        const permissions = await db('user_permissions')
          .select('permission')
          .where('user_id', user.id);
        user.permissions = permissions.map(p => p.permission);
        
        // Map role name to frontend compatible name
        user.role = roleMapping[user.role] || user.role;
        
        // Map team name to frontend compatible name
        user.team = teamMapping[user.team] || user.team;
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
        .select('users.id', 'users.username', 'users.email', 'roles.name as role', 'users.is_active', 'users.updated_at')
        .leftJoin('roles', 'users.role_id', 'roles.id')
        .where('users.id', userId)
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
      const roles = await db('roles').select('id', 'name', 'description').where('is_active', true);
      return roles;
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

  /**
   * Assign a sheet to specific users
   * @param {number} sheetId - Sheet ID
   * @param {Array} userIds - Array of user IDs to assign the sheet to
   * @param {number} assignedBy - User ID who is making the assignment
   * @returns {Object} Assignment results
   */
  static async assignSheetToUsers(sheetId, userIds, assignedBy) {
    try {
      console.log(`Assigning sheet ${sheetId} to users:`, userIds);
      
      // Verify the sheet exists
      const sheet = await db('sheets').where('id', sheetId).first();
      if (!sheet) {
        throw new Error(`Sheet with ID ${sheetId} not found`);
      }
      
      // Get valid users and their teams
      const users = await db('users')
        .select('users.id', 'users.username', 'users.team_id', 'teams.name as team_name')
        .leftJoin('teams', 'users.team_id', 'teams.id')
        .whereIn('users.id', userIds)
        .where('users.is_active', true);
      
      if (users.length === 0) {
        throw new Error('No valid users found for assignment');
      }
      
      const assignments = [];
      const teamSheetAssignments = new Map(); // Track team assignments to avoid duplicates
      
      for (const user of users) {
        try {
          // If user has a team, create team_sheet assignment (if not already exists)
          if (user.team_id) {
            if (!teamSheetAssignments.has(user.team_id)) {
              const existingTeamAssignment = await db('team_sheets')
                .where({
                  sheet_id: sheetId,
                  team_id: user.team_id
                })
                .first();
              
              if (!existingTeamAssignment) {
                const [teamAssignment] = await db('team_sheets')
                  .insert({
                    sheet_id: sheetId,
                    team_id: user.team_id,
                    status: 'assigned',
                    assigned_at: new Date(),
                    created_at: new Date(),
                    updated_at: new Date()
                  })
                  .returning('*');
                
                console.log(`Created team assignment for sheet ${sheetId} to team ${user.team_name}`);
                teamSheetAssignments.set(user.team_id, teamAssignment);
              } else {
                console.log(`Sheet ${sheetId} already assigned to team ${user.team_name}`);
                teamSheetAssignments.set(user.team_id, existingTeamAssignment);
              }
            }
          }
          
          // Track the assignment for the user
          assignments.push({
            user_id: user.id,
            username: user.username,
            team_id: user.team_id,
            team_name: user.team_name,
            assigned_via_team: !!user.team_id
          });
          
        } catch (assignmentError) {
          console.error(`Error creating assignment for user ${user.username}:`, assignmentError.message);
        }
      }
      
      // Update the sheet status to distributed if it wasn't already
      if (sheet.status !== 'distributed') {
        await db('sheets')
          .where('id', sheetId)
          .update({
            status: 'distributed',
            distributed_at: new Date(),
            updated_at: new Date()
          });
      }
      
      console.log(`Sheet ${sheetId} assigned to ${assignments.length} users across ${teamSheetAssignments.size} teams`);
      
      return {
        success: true,
        message: `Sheet assigned to ${assignments.length} users successfully`,
        assignments: assignments,
        usersAssigned: assignments.length,
        teamsInvolved: teamSheetAssignments.size,
        teamAssignments: Array.from(teamSheetAssignments.values())
      };
      
    } catch (error) {
      console.error('Error assigning sheet to users:', error);
      throw new Error(`Failed to assign sheet to users: ${error.message}`);
    }
  }

  static async getTeams() {
    try {
      const teams = await db('teams').select('id', 'name', 'description').where('is_active', true);
      return teams;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }
}

module.exports = UserManagementService;
