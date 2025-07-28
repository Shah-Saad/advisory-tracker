const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 3000;

// Test database connection
const startServer = async () => {
  try {
    // Test the database connection
    await db.raw('SELECT 1');
    console.log('Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`Advisory Tracker API server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.destroy(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  db.destroy(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});
