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
      console.log('🔄 sheetService: Making API call to /sheet-entries...');
      const response = await apiClient.get('/sheet-entries');
      console.log('✅ sheetService: API call successful, received:', response.data.length, 'entries');
      console.log('📊 sheetService: Sample data:', response.data.slice(0, 2));
      return response.data;
    } catch (error) {
      console.error('❌ sheetService: API call failed:', error);
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
      // Convert filters object to query parameters for GET request
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const response = await apiClient.get(`/sheet-entries/filter?${queryParams.toString()}`);
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

  // Update team response
  updateTeamResponse: async (responseId, data) => {
    try {
      const response = await apiClient.put(`/team-responses/responses/${responseId}/status`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update team response' };
    }
  },

  // Update status and comments only (works even after sheet submission)
  updateStatusAndComments: async (responseId, data) => {
    try {
      const response = await apiClient.put(`/team-responses/responses/${responseId}/status-comments`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update status and comments' };
    }
  },

  // Save draft - new method for saving all form data
  saveTeamResponseDraft: async (responseId, data) => {
    try {
      console.log('🔄 Calling saveTeamResponseDraft with:', { responseId, data });
      const response = await apiClient.put(`/team-responses/responses/${responseId}/draft`, data);
      console.log('✅ saveTeamResponseDraft response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ saveTeamResponseDraft error:', error);
      console.error('❌ Error response:', error.response?.data);
      throw error.response?.data || { message: 'Failed to save draft' };
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

  // Admin: Unlock team sheet (reset from completed back to in_progress)
  unlockTeamSheet: async (sheetId, teamId, reason = '') => {
    try {
      const response = await apiClient.put(`/team-responses/admin/sheets/${sheetId}/teams/${teamId}/unlock`, {
        reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to unlock team sheet' };
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

  // Get team-specific sheet data (for team members using numeric teamId)
  getTeamSheetData: async (sheetId, teamId) => {
    try {
      const response = await apiClient.get(`/sheets/${sheetId}/team-id/${teamId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch team sheet data' };
    }
  },

  // Get only edited entries for a team sheet
  getEditedEntries: async (sheetId) => {
    try {
      const response = await apiClient.get(`/team-responses/sheets/${sheetId}/edited-entries`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch edited entries' };
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
  },

  // Admin-only: Delete sheet
  deleteSheet: async (sheetId) => {
    try {
      const response = await apiClient.delete(`/sheets/${sheetId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete sheet' };
    }
  },

  // Admin-only: Get detailed team sheet data (using teamKey string)
  getAdminTeamSheetData: async (sheetId, teamKey) => {
    try {
      const response = await apiClient.get(`/admin/team-sheets/${sheetId}/${teamKey}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch team sheet data' };
    }
  }
};

export default sheetService;
