const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');

/**
 * Middleware to authenticate API requests using API keys
 * API keys should be passed in the X-API-Key header
 * Keys are validated against the database
 */

/**
 * API Key authentication middleware (database-backed)
 */
async function authenticateApiKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      // Check if we should allow unauthenticated access in development
      const hasAnyKeys = await ApiKey.countDocuments() > 0;

      if (process.env.NODE_ENV === 'development' && !hasAnyKeys) {
        console.warn('⚠️  API authentication disabled in development mode. No API keys configured.');
        return next();
      }

      return res.status(401).json({
        success: false,
        message: 'API key is required. Please provide an API key in the X-API-Key header.'
      });
    }

    // Hash the provided key and look it up in the database
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const apiKeyRecord = await ApiKey.findOne({ keyHash });

    if (!apiKeyRecord) {
      return res.status(403).json({
        success: false,
        message: 'Invalid API key. Access denied.'
      });
    }

    // Check if the key is valid (active and not expired)
    if (!apiKeyRecord.isValid()) {
      const reason = apiKeyRecord.isExpired() ? 'expired' : 'inactive';
      return res.status(403).json({
        success: false,
        message: `API key is ${reason}. Access denied.`
      });
    }

    // Check IP whitelist if configured
    if (apiKeyRecord.ipWhitelist && apiKeyRecord.ipWhitelist.length > 0) {
      const clientIp = req.ip || req.connection.remoteAddress;
      if (!apiKeyRecord.ipWhitelist.includes(clientIp)) {
        return res.status(403).json({
          success: false,
          message: 'API key not authorized from this IP address.'
        });
      }
    }

    // Record usage (don't await to avoid slowing down the request)
    apiKeyRecord.recordUsage().catch(err => {
      console.error('Error recording API key usage:', err);
    });

    // Attach API key info to request for downstream use
    req.apiKey = {
      id: apiKeyRecord._id,
      name: apiKeyRecord.name,
      permissions: apiKeyRecord.permissions,
      application: apiKeyRecord.application
    };

    // Log API usage
    console.log(`API access: ${req.method} ${req.path} - Key: ${apiKeyRecord.keyPrefix}... (${apiKeyRecord.name})`);

    next();
  } catch (error) {
    console.error('Error in API authentication:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
}

/**
 * Permission check middleware
 * Usage: checkPermission('write')
 */
function checkPermission(requiredPermission) {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.apiKey.permissions.includes(requiredPermission) && !req.apiKey.permissions.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required: ${requiredPermission}`
      });
    }

    next();
  };
}

module.exports = {
  authenticateApiKey,
  checkPermission
};
