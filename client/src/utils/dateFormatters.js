/**
 * Date Formatting Utilities
 *
 * Provides consistent date and time formatting across the application.
 * Eliminates duplicate date formatting logic in components.
 */

/**
 * Format date with standard localization
 *
 * @param {string|Date} dateString - Date to format
 * @param {Object} options - Additional Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 *
 * @example
 * formatDate('2025-12-05T10:30:00Z')
 * // Returns: "Dec 5, 2025, 10:30 AM"
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';

  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  });
};

/**
 * Format date without time
 *
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 *
 * @example
 * formatDateOnly('2025-12-05T10:30:00Z')
 * // Returns: "Dec 5, 2025"
 */
export const formatDateOnly = (dateString) => {
  if (!dateString) return 'N/A';

  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format full date and time with seconds
 *
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted datetime string
 *
 * @example
 * formatDateTime('2025-12-05T10:30:45Z')
 * // Returns: "December 5, 2025, 10:30:45 AM"
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';

  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Format date as relative time (e.g., "2 hours ago")
 *
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Relative time string
 *
 * @example
 * formatTimeAgo(Date.now() - 3600000)
 * // Returns: "1 hour ago"
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'N/A';

  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);

  // Define time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  // Find the appropriate interval
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
};

/**
 * Format time only (no date)
 *
 * @param {string|Date} dateString - Date to extract time from
 * @returns {string} Formatted time string
 *
 * @example
 * formatTimeOnly('2025-12-05T10:30:00Z')
 * // Returns: "10:30 AM"
 */
export const formatTimeOnly = (dateString) => {
  if (!dateString) return 'N/A';

  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date for ISO 8601 (YYYY-MM-DD)
 *
 * @param {string|Date} dateString - Date to format
 * @returns {string} ISO formatted date string
 *
 * @example
 * formatDateISO('2025-12-05T10:30:00Z')
 * // Returns: "2025-12-05"
 */
export const formatDateISO = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

/**
 * Calculate and format duration between two dates
 *
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date (defaults to now)
 * @returns {string} Duration string
 *
 * @example
 * formatDuration('2025-12-01T10:00:00Z', '2025-12-05T10:00:00Z')
 * // Returns: "4 days"
 */
export const formatDuration = (startDate, endDate = new Date()) => {
  if (!startDate) return 'N/A';

  const start = new Date(startDate);
  const end = new Date(endDate);
  const seconds = Math.floor((end - start) / 1000);

  if (seconds < 0) return 'Not started';

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''}`;
    }
  }

  return 'Less than a minute';
};
