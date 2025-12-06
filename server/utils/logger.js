/**
 * Custom Logging System
 * Zero-dependency logging with file rotation and multiple log levels
 * No external libraries required - uses only Node.js built-in modules
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.maxFiles = 30; // Keep 30 days of logs

    // Log levels
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      HTTP: 3,
      DEBUG: 4
    };

    // Current log level from environment or default to INFO
    this.currentLevel = this.levels[process.env.LOG_LEVEL?.toUpperCase()] ?? this.levels.INFO;

    // Ensure log directory exists
    this.ensureLogDirectory();

    // Rotate logs daily at midnight
    this.scheduleLogRotation();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get current date in YYYY-MM-DD format for log filenames
   */
  getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get formatted timestamp for log entries
   */
  getTimestamp() {
    const now = new Date();
    return now.toISOString();
  }

  /**
   * Format log message with metadata
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaString}\n`;
  }

  /**
   * Write log entry to file
   */
  writeToFile(filename, content) {
    const filepath = path.join(this.logDir, filename);

    try {
      // Check file size and rotate if needed
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        if (stats.size > this.maxFileSize) {
          this.rotateLog(filename);
        }
      }

      // Append to log file
      fs.appendFileSync(filepath, content, 'utf8');
    } catch (error) {
      // Fallback to console if file write fails
      console.error('Failed to write to log file:', error);
      console.log(content);
    }
  }

  /**
   * Rotate log file when it exceeds max size
   */
  rotateLog(filename) {
    const filepath = path.join(this.logDir, filename);
    const timestamp = Date.now();
    const rotatedPath = path.join(this.logDir, `${filename}.${timestamp}`);

    try {
      fs.renameSync(filepath, rotatedPath);
      this.cleanOldLogs();
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  /**
   * Clean up old rotated log files
   */
  cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir);
      const logFiles = files
        .filter(f => f.includes('.log.'))
        .map(f => ({
          name: f,
          path: path.join(this.logDir, f),
          time: fs.statSync(path.join(this.logDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      // Remove files beyond max count
      if (logFiles.length > this.maxFiles) {
        logFiles.slice(this.maxFiles).forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }

  /**
   * Schedule daily log rotation at midnight
   */
  scheduleLogRotation() {
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // Next day
      0, 0, 0 // Midnight
    );
    const msToMidnight = night.getTime() - now.getTime();

    setTimeout(() => {
      this.cleanOldLogs();
      // Schedule for next day
      this.scheduleLogRotation();
    }, msToMidnight);
  }

  /**
   * Log a message at specified level
   */
  log(level, message, meta = {}) {
    const levelValue = this.levels[level];

    // Skip if below current log level
    if (levelValue > this.currentLevel) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, meta);
    const dateString = this.getCurrentDateString();

    // Write to appropriate log files
    if (level === 'ERROR') {
      // Errors go to both error log and combined log
      this.writeToFile(`error-${dateString}.log`, formattedMessage);
      this.writeToFile(`combined-${dateString}.log`, formattedMessage);

      // Also output to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.error('\x1b[31m%s\x1b[0m', formattedMessage.trim()); // Red
      }
    } else {
      // All other levels go to combined log
      this.writeToFile(`combined-${dateString}.log`, formattedMessage);

      // Output to console in development
      if (process.env.NODE_ENV !== 'production') {
        const colors = {
          WARN: '\x1b[33m', // Yellow
          INFO: '\x1b[32m', // Green
          HTTP: '\x1b[35m', // Magenta
          DEBUG: '\x1b[37m'  // White
        };
        console.log(`${colors[level]}%s\x1b[0m`, formattedMessage.trim());
      }
    }
  }

  // Convenience methods for each log level
  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  http(message, meta = {}) {
    this.log('HTTP', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  /**
   * Express middleware for HTTP request logging
   */
  httpLogger(req, res, next) {
    const start = Date.now();

    // Log when response finishes
    res.on('finish', () => {
      const duration = Date.now() - start;
      const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

      this.http(message, {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    });

    next();
  }
}

// Export singleton instance
module.exports = new Logger();
