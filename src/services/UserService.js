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
    const { password, role_id, ...otherData } = userData;
    
    // Check if user already exists
    const existingUser = await User.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Verify role exists if provided
    if (role_id) {
      const role = await Role.findById(role_id);
      if (!role) {
        throw new Error('Role not found');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = await User.create({
      ...otherData,
      role_id,
      password: hashedPassword,
      status: 'active',
      created_by: createdBy
    });

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
      updateData.password = await bcrypt.hash(password, 12);
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

  static async authenticateUser(email, password) {
    const user = await User.findByEmail(email);
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
