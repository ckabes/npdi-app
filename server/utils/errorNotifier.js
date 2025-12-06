/**
 * Error Notification System
 * Sends critical error alerts via email and webhooks (Slack, Teams, etc.)
 * Includes throttling to prevent notification spam
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

class ErrorNotifier {
  constructor() {
    // Track error frequency to prevent spam
    this.errorCount = new Map();
    this.notificationThrottle = new Map();
    this.throttleWindow = 5 * 60 * 1000; // 5 minutes between notifications for same error

    // Initialize email transporter (lazy loaded when needed)
    this.transporter = null;
  }

  /**
   * Get or create email transporter
   */
  getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    // Only create if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    return this.transporter;
  }

  /**
   * Notify about a critical error
   * @param {Error} error - The error object
   * @param {Object} context - Additional context (url, user, etc.)
   */
  async notifyCriticalError(error, context = {}) {
    const errorKey = `${error.name}:${error.message}`;

    // Throttle notifications to prevent spam
    const lastNotification = this.notificationThrottle.get(errorKey);
    if (lastNotification && Date.now() - lastNotification < this.throttleWindow) {
      logger.warn('Error notification throttled', {
        errorKey,
        timeSinceLastNotification: Math.floor((Date.now() - lastNotification) / 1000) + 's'
      });
      return;
    }

    // Track error frequency
    const count = (this.errorCount.get(errorKey) || 0) + 1;
    this.errorCount.set(errorKey, count);
    this.notificationThrottle.set(errorKey, Date.now());

    // Clean up old throttle entries every hour
    this.cleanupThrottle();

    // Send notifications
    const notifications = [];

    if (this.shouldSendEmail()) {
      notifications.push(this.sendEmailNotification(error, context, count));
    }

    if (this.shouldSendWebhook()) {
      notifications.push(this.sendWebhookNotification(error, context, count));
    }

    // Wait for all notifications to complete
    await Promise.allSettled(notifications);
  }

  /**
   * Check if email notifications are configured
   */
  shouldSendEmail() {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.ALERT_EMAIL);
  }

  /**
   * Check if webhook notifications are configured
   */
  shouldSendWebhook() {
    return !!process.env.WEBHOOK_URL;
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(error, context, occurrenceCount) {
    try {
      const transporter = this.getTransporter();
      if (!transporter) {
        logger.debug('Email notification skipped - SMTP not configured');
        return;
      }

      const emailContent = this.formatErrorEmail(error, context, occurrenceCount);

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.ALERT_EMAIL,
        subject: `🚨 NPDI App Critical Error: ${error.name}`,
        html: emailContent
      });

      logger.info('Critical error notification sent via email', {
        error: error.name,
        recipient: process.env.ALERT_EMAIL
      });
    } catch (emailError) {
      logger.error('Failed to send error notification email', {
        error: emailError.message
      });
    }
  }

  /**
   * Send webhook notification (Slack, Teams, Discord, etc.)
   */
  async sendWebhookNotification(error, context, occurrenceCount) {
    try {
      const axios = require('axios');
      const payload = this.formatWebhookPayload(error, context, occurrenceCount);

      await axios.post(process.env.WEBHOOK_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      logger.info('Critical error notification sent via webhook', {
        error: error.name
      });
    } catch (webhookError) {
      logger.error('Failed to send webhook notification', {
        error: webhookError.message
      });
    }
  }

  /**
   * Format error for email notification
   */
  formatErrorEmail(error, context, occurrenceCount) {
    const uptime = Math.floor(process.uptime());
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #dc3545; color: white; padding: 20px; }
    .section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #dc3545; }
    .section h3 { margin-top: 0; color: #dc3545; }
    pre { background: #f4f4f4; padding: 10px; overflow-x: auto; }
    .meta { display: grid; grid-template-columns: 150px 1fr; gap: 10px; }
    .meta-label { font-weight: bold; }
    .severity { display: inline-block; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
    .severity-high { background: #dc3545; color: white; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚨 Critical Error Alert</h1>
    <p>NPDI Application Error Notification</p>
  </div>

  <div class="section">
    <h3>Alert Summary</h3>
    <div class="meta">
      <span class="meta-label">Severity:</span>
      <span class="severity severity-high">CRITICAL</span>

      <span class="meta-label">Environment:</span>
      <span>${process.env.NODE_ENV || 'development'}</span>

      <span class="meta-label">Time:</span>
      <span>${new Date().toISOString()}</span>

      <span class="meta-label">Occurrences:</span>
      <span>${occurrenceCount} time(s) in last 5 minutes</span>
    </div>
  </div>

  <div class="section">
    <h3>Error Details</h3>
    <p><strong>Error Type:</strong> ${error.name}</p>
    <p><strong>Message:</strong> ${error.message}</p>
    <pre>${error.stack || 'No stack trace available'}</pre>
  </div>

  <div class="section">
    <h3>Request Context</h3>
    <pre>${JSON.stringify(context, null, 2)}</pre>
  </div>

  <div class="section">
    <h3>Server Information</h3>
    <div class="meta">
      <span class="meta-label">Process ID:</span>
      <span>${process.pid}</span>

      <span class="meta-label">Uptime:</span>
      <span>${uptime} seconds (${Math.floor(uptime / 60)} minutes)</span>

      <span class="meta-label">Memory Usage:</span>
      <span>${memUsedMB} MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)} MB</span>

      <span class="meta-label">Node Version:</span>
      <span>${process.version}</span>
    </div>
  </div>

  <div class="section">
    <h3>Recommended Actions</h3>
    <ul>
      <li>Check application logs for additional context</li>
      <li>Review recent deployments or configuration changes</li>
      <li>Verify database connectivity and external service availability</li>
      <li>Monitor error frequency to determine if issue is ongoing</li>
    </ul>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Format error for webhook notification (Slack-compatible format)
   */
  formatWebhookPayload(error, context, occurrenceCount) {
    const uptime = Math.floor(process.uptime());
    const memUsedMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    // Slack-compatible format (also works with Discord, Teams with adapters)
    return {
      text: `🚨 NPDI App Critical Error`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Critical Error Alert',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Error:*\n${error.name}`
            },
            {
              type: 'mrkdwn',
              text: `*Environment:*\n${process.env.NODE_ENV || 'development'}`
            },
            {
              type: 'mrkdwn',
              text: `*Occurrences:*\n${occurrenceCount} in last 5 min`
            },
            {
              type: 'mrkdwn',
              text: `*Time:*\n${new Date().toISOString()}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Message:*\n\`\`\`${error.message}\`\`\``
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Server Info:*\nUptime: ${uptime}s | Memory: ${memUsedMB}MB | PID: ${process.pid}`
          }
        }
      ]
    };
  }

  /**
   * Clean up old throttle entries to prevent memory leaks
   */
  cleanupThrottle() {
    const now = Date.now();
    const entries = Array.from(this.notificationThrottle.entries());

    for (const [key, timestamp] of entries) {
      // Remove entries older than 1 hour
      if (now - timestamp > 60 * 60 * 1000) {
        this.notificationThrottle.delete(key);
        this.errorCount.delete(key);
      }
    }
  }

  /**
   * Monitor database connection health
   * Call this from server startup to continuously monitor
   */
  monitorDatabaseHealth(mongoose) {
    let wasConnected = mongoose.connection.readyState === 1;

    setInterval(() => {
      const isConnected = mongoose.connection.readyState === 1;

      // Detect connection loss
      if (wasConnected && !isConnected) {
        this.notifyCriticalError(
          new Error('Database connection lost'),
          {
            readyState: mongoose.connection.readyState,
            readyStateDescription: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]
          }
        );
      }

      wasConnected = isConnected;
    }, 60000); // Check every minute
  }
}

// Export singleton instance
module.exports = new ErrorNotifier();
