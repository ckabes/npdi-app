require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

const productRoutes = require('./routes/products');
const formConfigRoutes = require('./routes/formConfig');
const userRoutes = require('./routes/users');
const permissionRoutes = require('./routes/permissions');
const systemSettingsRoutes = require('./routes/systemSettings');
const userPreferencesRoutes = require('./routes/userPreferences');
const templateRoutes = require('./routes/templates');
const adminRoutes = require('./routes/admin');
const ticketApiRoutes = require('./routes/ticketApi');
const weightMatrixRoutes = require('./routes/weightMatrix');
const plantCodeRoutes = require('./routes/plantCodes');
const productHierarchyRoutes = require('./routes/productHierarchy');
const businessLineRoutes = require('./routes/businessLines');
const parserConfigRoutes = require('./routes/parserConfig');
const metricsRoutes = require('./routes/metrics');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176'
  ],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
app.use(logger.httpLogger.bind(logger));

// Get all active profiles for login page (development profiles from file)
app.get('/api/profiles', async (req, res) => {
  try {
    const profilesFile = path.join(__dirname, 'data/devProfiles.json');

    // Ensure data directory exists
    const dataDir = path.dirname(profilesFile);
    await fs.mkdir(dataDir, { recursive: true });

    // Check if file exists, create if not
    try {
      await fs.access(profilesFile);
    } catch {
      const defaultProfiles = [
        {
          id: 'product-manager',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@milliporesigma.com',
          role: 'PRODUCT_MANAGER',
          sbu: 'Life Science',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'pm-ops',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@milliporesigma.com',
          role: 'PM_OPS',
          sbu: 'Process Solutions',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'admin',
          firstName: 'Mike',
          lastName: 'Wilson',
          email: 'mike.wilson@milliporesigma.com',
          role: 'ADMIN',
          sbu: 'Electronics',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
      await fs.writeFile(profilesFile, JSON.stringify(defaultProfiles, null, 2), 'utf8');
    }

    const data = await fs.readFile(profilesFile, 'utf8');
    const profiles = JSON.parse(data);

    // Filter only active profiles and format for login page
    const activeProfiles = profiles
      .filter(profile => profile.isActive)
      .map(profile => ({
        id: profile.id,
        name: `${profile.firstName} ${profile.lastName}`,
        role: profile.role,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        sbu: profile.sbu,
        userId: profile.id
      }));

    res.json(activeProfiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    // Fallback to empty array in case of error
    res.json([]);
  }
});

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/form-config', formConfigRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/system-settings', systemSettingsRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/weight-matrix', weightMatrixRoutes);
app.use('/api/plant-codes', plantCodeRoutes);
app.use('/api/business-lines', businessLineRoutes);
app.use('/api/product-hierarchy', productHierarchyRoutes);
app.use('/api/parser-config', parserConfigRoutes);
app.use('/api/metrics', metricsRoutes);

// Public API v1 for external applications
app.use('/api/v1/tickets', ticketApiRoutes);

// Enhanced health check endpoint for systemd monitoring
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.2.0',
    uptime: Math.floor(process.uptime()),
    checks: {}
  };

  // Database connectivity check
  try {
    if (mongoose.connection.readyState === 1) {
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      const latency = Date.now() - startTime;
      health.checks.database = {
        status: 'healthy',
        latency: `${latency}ms`,
        state: 'connected'
      };
    } else {
      health.checks.database = {
        status: 'disconnected',
        state: mongoose.connection.readyState
      };
      health.status = 'DEGRADED';
    }
  } catch (error) {
    health.checks.database = {
      status: 'error',
      error: error.message
    };
    health.status = 'UNHEALTHY';
  }

  // Memory usage check
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);

  health.checks.memory = {
    status: heapUsedMB < 500 ? 'healthy' : heapUsedMB < 800 ? 'warning' : 'critical',
    heapUsedMB,
    heapTotalMB,
    rssMB,
    heapUsagePercent: Math.round((heapUsedMB / heapTotalMB) * 100)
  };

  // If memory is critical, mark overall status as degraded
  if (health.checks.memory.status === 'critical') {
    health.status = 'DEGRADED';
  }

  // Return appropriate status code
  const statusCode = health.status === 'OK' ? 200 : health.status === 'DEGRADED' ? 503 : 503;
  res.status(statusCode).json(health);
});

// Liveness probe - simple check that process is alive
app.get('/api/health/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// Readiness probe - check if app is ready to serve traffic
app.get('/api/health/ready', async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: 'connected'
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        reason: 'database not connected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      reason: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Enhanced error handling middleware with logging
app.use((error, req, res, next) => {
  // Log the error with context
  logger.error('Server error', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: req.body
  });

  // Determine status code
  const statusCode = error.statusCode || error.status || 500;

  // Send response
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : error.message,
    ...(process.env.NODE_ENV === 'development' && {
      error: error.message,
      stack: error.stack
    })
  });
});

// Start server and save reference for graceful shutdown
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Process ID: ${process.pid}`);
});

// ============================================================================
// Graceful Shutdown Handlers for systemd
// ============================================================================

/**
 * Graceful shutdown handler
 * Ensures all connections are properly closed before process exits
 * This is critical for systemd service management
 */
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed - no longer accepting connections');

    // Close database connection
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });
  });

  // Force shutdown after 30 seconds if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Graceful shutdown timeout - forcing exit');
    process.exit(1);
  }, 30000);
};

// Handle systemd stop/restart signals
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received from systemd');
  gracefulShutdown('SIGTERM');
});

// Handle Ctrl+C in development
process.on('SIGINT', () => {
  logger.info('SIGINT signal received (Ctrl+C)');
  gracefulShutdown('SIGINT');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception - Application will terminate', {
    error: error.message,
    stack: error.stack
  });

  // Give time for logs to flush, then exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection - Application will terminate', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: String(promise)
  });

  // Give time for logs to flush, then exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Log successful startup
logger.info('Application started successfully');
logger.info('Graceful shutdown handlers registered');