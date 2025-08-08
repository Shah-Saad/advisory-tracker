// Constants used throughout the application

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3
};

// File Upload Configuration
export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['xlsx', 'xls', 'csv'],
  ALLOWED_MIME_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]
};

// Pagination Configuration
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100]
};

// Risk Levels
export const RISK_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

export const RISK_LEVEL_OPTIONS = [
  RISK_LEVELS.LOW,
  RISK_LEVELS.MEDIUM,
  RISK_LEVELS.HIGH,
  RISK_LEVELS.CRITICAL
];

// Status Options
export const STATUS_OPTIONS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  NOT_APPLICABLE: 'Not Applicable',
  FAILED: 'Failed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

export const YES_NO_OPTIONS = ['Yes', 'No'];

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  DISTRIBUTION: 'distribution',
  TRANSMISSION: 'transmission', 
  GENERAL: 'general'
};

// Months
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  INPUT: 'YYYY-MM-DD',
  FULL: 'MMMM DD, YYYY HH:mm:ss'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: `File size exceeds ${FILE_CONFIG.MAX_SIZE / 1024 / 1024}MB limit.`,
  INVALID_FILE_TYPE: `Only ${FILE_CONFIG.ALLOWED_TYPES.join(', ')} files are allowed.`,
  UPLOAD_FAILED: 'File upload failed. Please try again.',
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  UPLOAD_SUCCESS: 'File uploaded successfully',
  UPDATE_SUCCESS: 'Updated successfully',
  DELETE_SUCCESS: 'Deleted successfully',
  SAVE_SUCCESS: 'Saved successfully'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  FILTERS: 'saved_filters',
  PREFERENCES: 'user_preferences'
};

// Table Columns Configuration
export const TABLE_COLUMNS = {
  BASIC: [
    { key: 'oem_vendor', label: 'Vendor', sortable: true },
    { key: 'source', label: 'Source', sortable: true },
    { key: 'risk_level', label: 'Risk Level', sortable: true },
    { key: 'cve', label: 'CVE', sortable: false },
    { key: 'deployed_in_ke', label: 'Deployed in KE', sortable: true },
    { key: 'month', label: 'Month', sortable: true },
    { key: 'year', label: 'Year', sortable: true }
  ],
  EXTENDED: [
    { key: 'oem_vendor', label: 'Vendor', sortable: true },
    { key: 'source', label: 'Source', sortable: true },
    { key: 'risk_level', label: 'Risk Level', sortable: true },
    { key: 'cve', label: 'CVE', sortable: false },
    { key: 'deployed_in_ke', label: 'Deployed in KE', sortable: true },
    { key: 'month', label: 'Month', sortable: true },
    { key: 'year', label: 'Year', sortable: true }
  ]
};

// Navigation Menu Items
export const MENU_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'fas fa-tachometer-alt',
    path: '/dashboard',
    roles: [USER_ROLES.ADMIN, USER_ROLES.DISTRIBUTION, USER_ROLES.TRANSMISSION, USER_ROLES.GENERAL]
  },
  {
    key: 'upload',
    label: 'Upload Sheet',
    icon: 'fas fa-upload',
    path: '/upload',
    roles: [USER_ROLES.ADMIN, USER_ROLES.DISTRIBUTION, USER_ROLES.TRANSMISSION, USER_ROLES.GENERAL]
  },
  {
    key: 'entries',
    label: 'All Entries',
    icon: 'fas fa-list',
    path: '/entries',
    roles: [USER_ROLES.ADMIN, USER_ROLES.DISTRIBUTION, USER_ROLES.TRANSMISSION, USER_ROLES.GENERAL]
  },
  {
    key: 'filters',
    label: 'Advanced Filters',
    icon: 'fas fa-filter',
    path: '/filters',
    roles: [USER_ROLES.ADMIN, USER_ROLES.DISTRIBUTION, USER_ROLES.TRANSMISSION, USER_ROLES.GENERAL]
  }
];

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#0d6efd',
  SECONDARY: '#6c757d',
  SUCCESS: '#198754',
  DANGER: '#dc3545',
  WARNING: '#ffc107',
  INFO: '#0dcaf0',
  LIGHT: '#f8f9fa',
  DARK: '#212529'
};

// Risk Level Colors
export const RISK_COLORS = {
  [RISK_LEVELS.LOW]: CHART_COLORS.SUCCESS,
  [RISK_LEVELS.MEDIUM]: CHART_COLORS.WARNING,
  [RISK_LEVELS.HIGH]: CHART_COLORS.DANGER,
  [RISK_LEVELS.CRITICAL]: '#8b0000' // Dark red
};

// Breakpoints for responsive design
export const BREAKPOINTS = {
  XS: 0,
  SM: 576,
  MD: 768,
  LG: 992,
  XL: 1200,
  XXL: 1400
};

// Animation Durations (in milliseconds)
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
};

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CVE: /^CVE-\d{4}-\d{4,7}$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/
};

// Default Values
export const DEFAULTS = {
  CURRENT_YEAR: new Date().getFullYear(),
  CURRENT_MONTH: MONTHS[new Date().getMonth()],
  PAGE_SIZE: PAGINATION.DEFAULT_PAGE_SIZE,
  SORT_DIRECTION: 'desc',
  SORT_FIELD: 'created_at'
};

export default {
  API_CONFIG,
  FILE_CONFIG,
  PAGINATION,
  RISK_LEVELS,
  RISK_LEVEL_OPTIONS,
  STATUS_OPTIONS,
  YES_NO_OPTIONS,
  USER_ROLES,
  MONTHS,
  DATE_FORMATS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STORAGE_KEYS,
  TABLE_COLUMNS,
  MENU_ITEMS,
  CHART_COLORS,
  RISK_COLORS,
  BREAKPOINTS,
  ANIMATIONS,
  REGEX_PATTERNS,
  DEFAULTS
};
