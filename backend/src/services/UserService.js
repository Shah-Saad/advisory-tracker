const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UserService {
  static async getAllUsers() {
    return await User.findAllWithRoles();
  }

  static async getUserById(id) {
    const user = await User.findWithRole(id);
    if (!user) {
      throw new Error('User not found');
    }
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async createUser(userData, createdBy = null) {
    const { password, role, team, role_id, team_id, ...otherData } = userData;
    
    // Check if user already exists
    const existingUser = await User.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    let finalRoleId = role_id;
    let finalTeamId = team_id;

    // If role name is provided instead of role_id, look it up
    if (role && !role_id) {
      const Role = require('../models/Role');
      const roleRecord = await Role.findBy({ name: role });
      if (roleRecord.length === 0) {
        throw new Error(`Role '${role}' not found`);
      }
      finalRoleId = roleRecord[0].id;
    }

    // If team name is provided instead of team_id, look it up
    if (team && !team_id) {
      const Team = require('../models/Team');
      const teamRecord = await Team.findBy({ name: team });
      if (teamRecord.length === 0) {
        throw new Error(`Team '${team}' not found`);
      }
      finalTeamId = teamRecord[0].id;
    }

    // Verify role exists if provided
    if (finalRoleId) {
      const Role = require('../models/Role');
      const roleRecord = await Role.findById(finalRoleId);
      if (!roleRecord) {
        throw new Error('Role not found');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Only pass valid database columns
    const validUserData = {
      username: otherData.username,
      email: otherData.email,
      first_name: otherData.first_name,
      last_name: otherData.last_name,
      department: otherData.department,
      role_id: finalRoleId,
      team_id: finalTeamId,
      password_hash: hashedPassword,
      is_active: true
    };

    const newUser = await User.create(validUserData);

    // Return user without password
    return await this.getUserById(newUser.id);
  }

  static async updateUser(id, userData, updatedBy = null) {
    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const { password, role_id, ...otherData } = userData;

    // Verify role exists if being updated
    if (role_id && role_id !== existingUser.role_id) {
      const role = await Role.findById(role_id);
      if (!role) {
        throw new Error('Role not found');
      }
    }

    // Prepare update data
    const updateData = {
      ...otherData,
      updated_by: updatedBy
    };

    // Add role_id if provided
    if (role_id !== undefined) {
      updateData.role_id = role_id;
    }

    // Hash password if provided
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 12);
    }

    await User.update(id, updateData);
    return await this.getUserById(id);
  }

  static async deleteUser(id) {
    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    return await User.delete(id);
  }

  static async authenticateUser(usernameOrEmail, password) {
    // Try to find user by email first, then by username
    let user = await User.findByEmail(usernameOrEmail);
    if (!user) {
      // Try finding by username
      const users = await User.findBy({ username: usernameOrEmail });
      if (users.length > 0) {
        user = users[0];
      }
    }
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('Account is not active');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Get user with role information
    const userWithRole = await User.findWithRole(user.id);
    
    // Get user permissions
    const permissions = await User.getUserPermissions(user.id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: userWithRole.role_name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = userWithRole;

    return {
      token,
      user: {
        ...userWithoutPassword,
        role: userWithRole.role_name, // Add explicit role field for frontend compatibility
        permissions: permissions.map(p => p.name)
      }
    };
  }

  static async getUserPermissions(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await User.getUserPermissions(userId);
  }

  static async hasPermission(userId, permissionName) {
    return await User.hasPermission(userId, permissionName);
  }

  static async changeUserStatus(id, status, updatedBy = null) {
    const allowedStatuses = ['active', 'inactive', 'suspended'];
    if (!allowedStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    return await this.updateUser(id, { status }, updatedBy);
  }
}

module.exports = UserService;
