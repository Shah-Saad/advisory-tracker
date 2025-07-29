// Utility functions for the application

// Date formatting utilities
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
};

// Risk level utilities
export const getRiskColor = (riskLevel) => {
  switch (riskLevel?.toLowerCase()) {
    case 'high':
    case 'critical':
      return '#dc3545';
    case 'medium':
      return '#ffc107';
    case 'low':
      return '#198754';
    default:
      return '#6c757d';
  }
};

export const getRiskBadgeClass = (riskLevel) => {
  switch (riskLevel?.toLowerCase()) {
    case 'high':
    case 'critical':
      return 'bg-danger';
    case 'medium':
      return 'bg-warning text-dark';
    case 'low':
      return 'bg-success';
    default:
      return 'bg-secondary';
  }
};

// File utilities
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename) => {
  return filename.split('.').pop()?.toLowerCase();
};

export const isValidFileType = (filename, allowedTypes = ['xlsx', 'xls', 'csv']) => {
  const extension = getFileExtension(filename);
  return allowedTypes.includes(extension);
};

// String utilities
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Status utilities
export const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'approved':
    case 'yes':
      return 'bg-success';
    case 'in progress':
    case 'pending':
      return 'bg-warning text-dark';
    case 'failed':
    case 'rejected':
    case 'no':
      return 'bg-danger';
    case 'not applicable':
    case 'n/a':
      return 'bg-secondary';
    default:
      return 'bg-light text-dark';
  }
};

// Array utilities
export const sortArray = (array, field, direction = 'asc') => {
  return [...array].sort((a, b) => {
    let aValue = a[field] || '';
    let bValue = b[field] || '';
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

export const filterArray = (array, searchTerm) => {
  if (!searchTerm) return array;
  
  return array.filter(item =>
    Object.values(item).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
};

// Validation utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidCVE = (cve) => {
  const cveRegex = /^CVE-\d{4}-\d{4,7}$/;
  return cveRegex.test(cve);
};

// URL utilities
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  
  return searchParams.toString();
};

// Local storage utilities
export const setLocalStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getLocalStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const removeLocalStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Error handling utilities
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  return 'An unexpected error occurred';
};

// Export utilities
export const downloadAsCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export default {
  formatDate,
  formatDateTime,
  getRiskColor,
  getRiskBadgeClass,
  formatFileSize,
  getFileExtension,
  isValidFileType,
  truncateText,
  capitalizeFirst,
  getStatusBadgeClass,
  sortArray,
  filterArray,
  isValidEmail,
  isValidCVE,
  buildQueryString,
  setLocalStorageItem,
  getLocalStorageItem,
  removeLocalStorageItem,
  getErrorMessage,
  downloadAsCSV
};
