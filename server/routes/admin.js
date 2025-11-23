const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const apiKeyController = require('../controllers/apiKeyController');
const palantirService = require('../services/palantirService');

// Get comprehensive admin statistics
router.get('/stats', adminController.getAdminStats);

// Palantir Integration Routes
router.post('/palantir/test-connection', async (req, res) => {
  try {
    // Clear cache to ensure fresh settings are loaded
    palantirService.clearCache();

    const result = await palantirService.testConnection();
    res.json(result);
  } catch (error) {
    console.error('Palantir test connection error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// API Key Management Routes
router.post('/api-keys', apiKeyController.generateApiKey);
router.get('/api-keys', apiKeyController.getAllApiKeys);
router.get('/api-keys/statistics', apiKeyController.getApiKeyStatistics);
router.get('/api-keys/:id', apiKeyController.getApiKeyById);
router.put('/api-keys/:id', apiKeyController.updateApiKey);
router.patch('/api-keys/:id/revoke', apiKeyController.revokeApiKey);
router.delete('/api-keys/:id', apiKeyController.deleteApiKey);
router.post('/api-keys/validate', apiKeyController.validateApiKey);

module.exports = router;
