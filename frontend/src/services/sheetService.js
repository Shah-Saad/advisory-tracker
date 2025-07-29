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
  uploadSheet: async (file, month, year) => {
    try {
      const formData = new FormData();
      formData.append('sheet_file', file);
      if (month) formData.append('month', month);
      if (year) formData.append('year', year);

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
  }
};

export default sheetService;
