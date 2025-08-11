const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/users');
const userManagementRoutes = require('./routes/userManagement');
const adminRoutes = require('./routes/admin');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const teamRoutes = require('./routes/teams');
const sheetRoutes = require('./routes/sheets');
const sheetEntryRoutes = require('./routes/sheetEntries');

const productRoutes = require('./routes/products');
const vendorRoutes = require('./routes/vendors');
const notificationRoutes = require('./routes/notifications');
const passwordRoutes = require('./routes/password');
const generationRoutes = require('./routes/generation');
const reportsRoutes = require('./routes/reports');
const teamResponseRoutes = require('./routes/team-responses');
const dashboardRoutes = require('./routes/dashboard');
const { router: sseRoutes } = require('./routes/sse');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin/users', userManagementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/sheets', sheetRoutes);
app.use('/api/sheet-entries', sheetEntryRoutes);

app.use('/api/products', productRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/team-responses', teamResponseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/generation', generationRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sse', sseRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Advisory Tracker API is running' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
