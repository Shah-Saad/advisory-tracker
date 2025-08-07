import apiClient from './api';

const entryLockingService = {
  // Lock an entry for editing
  lockEntry: async (entryId) => {
    try {
      const response = await apiClient.post(`/entry-locking/${entryId}/lock`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to lock entry' };
    }
  },

  // Unlock an entry
  unlockEntry: async (entryId) => {
    try {
      const response = await apiClient.post(`/entry-locking/${entryId}/unlock`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to unlock entry' };
    }
  },

  // Complete an entry with updated data
  completeEntry: async (entryId, entryData) => {
    try {
      const response = await apiClient.put(`/entry-locking/${entryId}/complete`, entryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to complete entry' };
    }
  },

  // Get available entries for a sheet
  getAvailableEntries: async (sheetId, teamId = null) => {
    try {
      const params = teamId ? { teamId } : {};
      // Add cache-busting timestamp to prevent browser caching issues
      params._t = Date.now();
      const response = await apiClient.get(`/entry-locking/sheet/${sheetId}/available`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get available entries' };
    }
  },

  // Get entries locked by current user
  getMyLockedEntries: async () => {
    try {
      const response = await apiClient.get('/entry-locking/my-locked');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get locked entries' };
    }
  },

  // Admin function to release expired locks
  releaseExpiredLocks: async () => {
    try {
      const response = await apiClient.post('/entry-locking/release-expired');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to release expired locks' };
    }
  }
};

export default entryLockingService;
