/**
 * Application Metrics Endpoint
 * Provides system and application metrics for monitoring tools
 * Requires authentication via X-Metrics-Token header
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ProductTicket = require('../models/ProductTicket');
const logger = require('../utils/logger');

/**
 * Simple token authentication for metrics endpoint
 * Use environment variable METRICS_TOKEN to protect this endpoint
 */
const authenticate = (req, res, next) => {
  const token = req.headers['x-metrics-token'];
  const expectedToken = process.env.METRICS_TOKEN;

  // If no token is configured, allow access in development only
  if (!expectedToken) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({
        error: 'Metrics endpoint requires METRICS_TOKEN to be configured'
      });
    }
    logger.warn('Metrics endpoint accessed without authentication (development mode)');
    return next();
  }

  if (token === expectedToken) {
    next();
  } else {
    logger.warn('Unauthorized metrics access attempt', { ip: req.ip });
    res.status(401).json({ error: 'Unauthorized' });
  }
};

/**
 * GET /api/metrics
 * Returns comprehensive application metrics
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const startTime = Date.now();

    // System metrics
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics = {
      timestamp: new Date().toISOString(),

      // System information
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptime: Math.floor(process.uptime()),
        uptimeFormatted: formatUptime(process.uptime())
      },

      // Memory metrics (in MB)
      memory: {
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
        externalMB: Math.round(memUsage.external / 1024 / 1024),
        heapUsagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },

      // CPU metrics (in microseconds)
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        totalMs: Math.round((cpuUsage.user + cpuUsage.system) / 1000)
      },

      // Database metrics
      database: {
        connected: mongoose.connection.readyState === 1,
        readyState: mongoose.connection.readyState,
        readyStateDescription: getMongooseReadyState(mongoose.connection.readyState),
        collections: mongoose.connection.collections
          ? Object.keys(mongoose.connection.collections).length
          : 0,
        host: mongoose.connection.host || 'unknown'
      },

      // Application metrics
      tickets: await getTicketMetrics(),

      // Performance
      performance: {
        queryExecutionTime: Date.now() - startTime
      }
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Error generating metrics', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/metrics/prometheus
 * Returns metrics in Prometheus text format for scraping
 */
router.get('/prometheus', authenticate, async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    const ticketMetrics = await getTicketMetrics();

    // Prometheus text format
    const metrics = [
      '# HELP npdi_app_uptime_seconds Application uptime in seconds',
      '# TYPE npdi_app_uptime_seconds gauge',
      `npdi_app_uptime_seconds ${Math.floor(uptime)}`,
      '',
      '# HELP npdi_app_memory_heap_used_bytes Heap memory used in bytes',
      '# TYPE npdi_app_memory_heap_used_bytes gauge',
      `npdi_app_memory_heap_used_bytes ${memUsage.heapUsed}`,
      '',
      '# HELP npdi_app_memory_heap_total_bytes Total heap memory in bytes',
      '# TYPE npdi_app_memory_heap_total_bytes gauge',
      `npdi_app_memory_heap_total_bytes ${memUsage.heapTotal}`,
      '',
      '# HELP npdi_app_tickets_total Total number of tickets',
      '# TYPE npdi_app_tickets_total gauge',
      `npdi_app_tickets_total ${ticketMetrics.total}`,
      '',
      '# HELP npdi_app_tickets_by_status Tickets grouped by status',
      '# TYPE npdi_app_tickets_by_status gauge'
    ];

    // Add ticket status metrics
    ticketMetrics.byStatus.forEach(item => {
      metrics.push(`npdi_app_tickets_by_status{status="${item._id}"} ${item.count}`);
    });

    metrics.push('');
    metrics.push('# HELP npdi_app_database_connected Database connection status (1=connected, 0=disconnected)');
    metrics.push('# TYPE npdi_app_database_connected gauge');
    metrics.push(`npdi_app_database_connected ${mongoose.connection.readyState === 1 ? 1 : 0}`);

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics.join('\n'));
  } catch (error) {
    logger.error('Error generating Prometheus metrics', { error: error.message });
    res.status(500).send('# Error generating metrics');
  }
});

/**
 * Helper function to get ticket metrics
 */
async function getTicketMetrics() {
  try {
    // Get ticket counts by status
    const byStatus = await ProductTicket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get ticket counts by priority
    const byPriority = await ProductTicket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Get total count
    const total = await ProductTicket.countDocuments();

    // Get recent error count (tickets with errors in last hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentErrors = await ProductTicket.countDocuments({
      updatedAt: { $gte: oneHourAgo },
      status: 'ERROR'
    });

    // Get created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const createdToday = await ProductTicket.countDocuments({
      createdAt: { $gte: today }
    });

    return {
      total,
      byStatus,
      byPriority,
      recentErrors,
      createdToday
    };
  } catch (error) {
    logger.error('Error fetching ticket metrics', { error: error.message });
    return {
      total: 0,
      byStatus: [],
      byPriority: [],
      recentErrors: 0,
      createdToday: 0
    };
  }
}

/**
 * Helper function to format uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Helper function to get mongoose connection state description
 */
function getMongooseReadyState(state) {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[state] || 'unknown';
}

module.exports = router;
