import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const sheetService = {
  // Upload sheet file
  uploadSheet: async (file, month, year, distributeToTeams = false) => {
    try {
      const formData = new FormData();
      formData.append('sheet_file', file);
      if (month) formData.append('month', month);
      if (year) formData.append('year', year);
      if (distributeToTeams) formData.append('distributeToTeams', 'true');

      const response = await apiClient.post('/sheet-entries/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Upload failed' };
    }
  },

  // Get all entries
  getAllEntries: async () => {
    try {
      const response = await apiClient.get('/sheet-entries');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch entries' };
    }
  },

  // Get single entry by ID
  getEntryById: async (id) => {
    try {
      const response = await apiClient.get(`/sheet-entries/${id}`);
      return response.data.data; // Return just the entry data
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch entry' };
    }
  },

  // Filter entries
  filterEntries: async (filters) => {
    try {
      const response = await apiClient.post('/sheet-entries/filter', { filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to filter entries' };
    }
  },

  // Get entry statistics
  getStatistics: async () => {
    try {
      const response = await apiClient.get('/sheet-entries/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch statistics' };
    }
  },

  // Update entry
  updateEntry: async (id, data) => {
    try {
      const response = await apiClient.put(`/sheet-entries/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update entry' };
    }
  },

  // Delete entry
  deleteEntry: async (id) => {
    try {
      const response = await apiClient.delete(`/sheet-entries/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete entry' };
    }
  },

  // Team member: Get sheets assigned to user's team
  getMyTeamSheets: async (status = null) => {
    try {
      const url = status ? `/sheets/my-team?status=${status}` : '/sheets/my-team';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch team sheets' };
    }
  },

  // Team member: Start working on a team sheet
  startTeamSheet: async (sheetId) => {
    try {
      const response = await apiClient.post(`/sheets/${sheetId}/start`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to start team sheet' };
    }
  },

  // Team member: Complete a team sheet
  completeTeamSheet: async (sheetId) => {
    try {
      const response = await apiClient.post(`/sheets/${sheetId}/complete`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to complete team sheet' };
    }
  },

  // Team member: Submit team sheet with responses
  submitTeamSheet: async (sheetId, responses) => {
    try {
      const response = await apiClient.post(`/sheets/${sheetId}/submit`, {
        responses: responses
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit team sheet' };
    }
  },

  // Get entries for a specific sheet (for team members)
  getSheetEntries: async (sheetId) => {
    try {
      const response = await apiClient.get(`/sheet-entries/sheet/${sheetId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch sheet entries' };
    }
  },

  // Admin-only: Get all sheets
  getAllSheets: async () => {
    try {
      const response = await apiClient.get('/sheets');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch sheets' };
    }
  },

  // Admin-only: Get sheet with team-specific versions
  getSheetByTeams: async (sheetId) => {
    try {
      const response = await apiClient.get(`/sheets/${sheetId}/team-views`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch team views' };
    }
  },

  // Admin-only: Get specific team's version of a sheet
  getSheetForTeam: async (sheetId, teamId) => {
    try {
      const response = await apiClient.get(`/sheets/${sheetId}/team/${teamId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch team sheet' };
    }
  },

  // Admin-only: Get all sheets with team status summary
  getAllSheetsWithTeamStatus: async () => {
    try {
      console.log('🔍 Fetching sheets with team status from:', `${API_BASE_URL}/sheets/team-status-summary`);
      const token = localStorage.getItem('token');
      console.log('🔑 Token available:', !!token);
      
      const response = await apiClient.get('/sheets/team-status-summary');
      console.log('✅ Successfully fetched sheets:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching sheets with team status:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      throw error.response?.data || { message: 'Failed to fetch sheets with team status' };
    }
  },

  // Admin-only: Distribute sheet to operational teams
  distributeToOperationalTeams: async (sheetId) => {
    try {
      const response = await apiClient.post(`/admin/sheets/${sheetId}/distribute-to-teams`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to distribute sheet to teams' };
    }
  },

  // Admin-only: Distribute sheet to specific teams
  distributeToSpecificTeams: async (sheetId, teamNames) => {
    try {
      const response = await apiClient.post(`/admin/sheets/${sheetId}/distribute-to-teams`, {
        teams: teamNames
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to distribute sheet to specific teams' };
    }
  }
};

export default sheetService;
