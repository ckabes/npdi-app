/**
 * Error Handling Utilities
 *
 * Provides consistent error handling patterns across all controllers
 * to reduce code duplication and improve maintainability.
 */

/**
 * Async handler wrapper to catch errors in async route handlers
 * Eliminates the need for try-catch blocks in every controller method
 *
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 *
 * @example
 * const getAll = asyncHandler(async (req, res) => {
 *   const items = await Model.find();
 *   res.json({ success: true, items });
 * });
 */
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Send standardized error response
 *
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - User-friendly error message
 * @param {Error|null} error - Original error object (optional)
 * @returns {Object} JSON response
 *
 * @example
 * sendErrorResponse(res, 500, 'Error fetching items', error);
 */
exports.sendErrorResponse = (res, statusCode, message, error = null) => {
  console.error(`Error: ${message}`, error);
  return res.status(statusCode).json({
    success: false,
    message,
    error: error?.message
  });
};

/**
 * Send standardized "not found" response
 *
 * @param {Object} res - Express response object
 * @param {string} resource - Name of the resource that wasn't found
 * @returns {Object} JSON response
 *
 * @example
 * if (!ticket) return handleNotFound(res, 'Ticket');
 */
exports.handleNotFound = (res, resource) => {
  return res.status(404).json({
    success: false,
    message: `${resource} not found`
  });
};

/**
 * Send standardized success response
 *
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Success message (optional)
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} JSON response
 *
 * @example
 * sendSuccessResponse(res, { items }, 'Items fetched successfully');
 */
exports.sendSuccessResponse = (res, data, message = null, statusCode = 200) => {
  const response = {
    success: true,
    ...data
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send standardized validation error response
 *
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 * @returns {Object} JSON response
 *
 * @example
 * const errors = validationResult(req);
 * if (!errors.isEmpty()) {
 *   return sendValidationError(res, errors.array());
 * }
 */
exports.sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors
  });
};
