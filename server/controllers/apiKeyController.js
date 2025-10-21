const ApiKey = require('../models/ApiKey');

/**
 * Generate a new API key
 */
exports.generateApiKey = async (req, res) => {
  try {
    const { name, description, application, expiresInDays, permissions, ipWhitelist, rateLimit } = req.body;
    const createdBy = req.body.createdBy || req.user?.email || 'admin';

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'API key name is required'
      });
    }

    // Generate the key
    const key = ApiKey.generateKey();
    const keyHash = ApiKey.hashKey(key);
    const keyPrefix = key.substring(0, 8);

    // Calculate expiration date if specified
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
    }

    // Create the API key record (only store hash, never plain text)
    const apiKey = new ApiKey({
      name,
      description: description || '',
      keyHash,
      keyPrefix,
      createdBy,
      application: application || '',
      expiresAt,
      permissions: permissions || ['read'],
      ipWhitelist: ipWhitelist || [],
      rateLimit: rateLimit || { requestsPerHour: 1000 }
    });

    await apiKey.save();

    // Return the full key only once
    // SECURITY: The key is NOT stored in the database - only the hash is stored
    // This is the ONLY time the full key will ever be available
    res.status(201).json({
      success: true,
      message: 'API key generated successfully',
      data: {
        id: apiKey._id,
        name: apiKey.name,
        description: apiKey.description,
        key: key, // CRITICAL: This is the only time the full key is returned - not stored in DB
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
        application: apiKey.application
      },
      warning: 'IMPORTANT: Save this API key securely. It cannot be retrieved again. Only the hash is stored in the database.'
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate API key',
      error: error.message
    });
  }
};

/**
 * Get all API keys (without exposing the actual keys)
 */
exports.getAllApiKeys = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;

    const filter = {};
    if (!includeInactive || includeInactive === 'false') {
      filter.isActive = true;
    }

    const apiKeys = await ApiKey.find(filter)
      .select('-keyHash')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API keys',
      error: error.message
    });
  }
};

/**
 * Get single API key by ID
 */
exports.getApiKeyById = async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await ApiKey.findById(id)
      .select('-keyHash')
      .lean();

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    res.json({
      success: true,
      data: apiKey
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API key',
      error: error.message
    });
  }
};

/**
 * Update API key (name, description, status, etc.)
 */
exports.updateApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, permissions, ipWhitelist, rateLimit, application } = req.body;

    const apiKey = await ApiKey.findById(id);

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Update fields
    if (name !== undefined) apiKey.name = name;
    if (description !== undefined) apiKey.description = description;
    if (isActive !== undefined) apiKey.isActive = isActive;
    if (permissions !== undefined) apiKey.permissions = permissions;
    if (ipWhitelist !== undefined) apiKey.ipWhitelist = ipWhitelist;
    if (rateLimit !== undefined) apiKey.rateLimit = rateLimit;
    if (application !== undefined) apiKey.application = application;

    await apiKey.save();

    res.json({
      success: true,
      message: 'API key updated successfully',
      data: apiKey.toJSON()
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update API key',
      error: error.message
    });
  }
};

/**
 * Revoke/deactivate an API key
 */
exports.revokeApiKey = async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await ApiKey.findById(id);

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    apiKey.isActive = false;
    await apiKey.save();

    res.json({
      success: true,
      message: 'API key revoked successfully',
      data: apiKey.toJSON()
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke API key',
      error: error.message
    });
  }
};

/**
 * Delete an API key permanently
 */
exports.deleteApiKey = async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await ApiKey.findByIdAndDelete(id);

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete API key',
      error: error.message
    });
  }
};

/**
 * Get API key usage statistics
 */
exports.getApiKeyStatistics = async (req, res) => {
  try {
    const stats = await ApiKey.aggregate([
      {
        $facet: {
          total: [
            { $count: 'count' }
          ],
          active: [
            { $match: { isActive: true } },
            { $count: 'count' }
          ],
          byPermissions: [
            { $unwind: '$permissions' },
            { $group: { _id: '$permissions', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          recentlyUsed: [
            { $match: { lastUsedAt: { $exists: true } } },
            { $sort: { lastUsedAt: -1 } },
            { $limit: 10 },
            {
              $project: {
                name: 1,
                keyPrefix: 1,
                lastUsedAt: 1,
                usageCount: 1,
                application: 1
              }
            }
          ],
          totalUsage: [
            {
              $group: {
                _id: null,
                total: { $sum: '$usageCount' }
              }
            }
          ],
          expiringKeys: [
            {
              $match: {
                isActive: true,
                expiresAt: {
                  $exists: true,
                  $gte: new Date(),
                  $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
                }
              }
            },
            { $sort: { expiresAt: 1 } },
            {
              $project: {
                name: 1,
                keyPrefix: 1,
                expiresAt: 1,
                application: 1
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalKeys: stats[0].total[0]?.count || 0,
        activeKeys: stats[0].active[0]?.count || 0,
        byPermissions: stats[0].byPermissions,
        recentlyUsed: stats[0].recentlyUsed,
        totalUsage: stats[0].totalUsage[0]?.total || 0,
        expiringKeys: stats[0].expiringKeys
      }
    });
  } catch (error) {
    console.error('Error fetching API key statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API key statistics',
      error: error.message
    });
  }
};

/**
 * Validate an API key (for testing purposes)
 */
exports.validateApiKey = async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'API key is required'
      });
    }

    const keyHash = ApiKey.hashKey(key);
    const apiKey = await ApiKey.findOne({ keyHash });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found',
        valid: false
      });
    }

    const isValid = apiKey.isValid();

    res.json({
      success: true,
      valid: isValid,
      data: {
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        isActive: apiKey.isActive,
        isExpired: apiKey.isExpired(),
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        lastUsedAt: apiKey.lastUsedAt,
        usageCount: apiKey.usageCount
      }
    });
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate API key',
      error: error.message
    });
  }
};
