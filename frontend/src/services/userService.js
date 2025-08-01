import apiClient from './api';

export const userService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/admin/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create user' };
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user' };
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  },

  // Assign sheet to specific users
  assignSheetToUsers: async (sheetId, userIds) => {
    try {
      const response = await apiClient.post(`/admin/sheets/${sheetId}/assign-to-users`, {
        userIds: userIds
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to assign sheet to users' };
    }
  },

  // Get user permissions
  getUserPermissions: async (userId) => {
    try {
      const response = await apiClient.get(`/admin/users/${userId}/permissions`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user permissions' };
    }
  },

  // Update user permissions
  updateUserPermissions: async (userId, permissions) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/permissions`, {
        permissions: permissions
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user permissions' };
    }
  }
};

export default userService;
