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

const vendorService = {
  // Get all vendors
  getAllVendors: async () => {
    try {
      const response = await apiClient.get('/vendors');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch vendors' };
    }
  },

  // Create vendor
  createVendor: async (vendorData) => {
    try {
      const response = await apiClient.post('/vendors', vendorData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create vendor' };
    }
  },

  // Update vendor
  updateVendor: async (id, vendorData) => {
    try {
      const response = await apiClient.put(`/vendors/${id}`, vendorData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update vendor' };
    }
  },

  // Delete vendor
  deleteVendor: async (id) => {
    try {
      const response = await apiClient.delete(`/vendors/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete vendor' };
    }
  }
};

const productService = {
  // Get all products
  getAllProducts: async () => {
    try {
      const response = await apiClient.get('/products');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch products' };
    }
  },

  // Get products by vendor
  getProductsByVendor: async (vendorId) => {
    try {
      const response = await apiClient.get(`/products/vendor/${vendorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch vendor products' };
    }
  },

  // Create product
  createProduct: async (productData) => {
    try {
      const response = await apiClient.post('/products', productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create product' };
    }
  },

  // Update product
  updateProduct: async (id, productData) => {
    try {
      const response = await apiClient.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update product' };
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      const response = await apiClient.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete product' };
    }
  }
};

export { vendorService, productService };
