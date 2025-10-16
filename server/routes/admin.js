const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const apiKeyController = require('../controllers/apiKeyController');

// Get comprehensive admin statistics
router.get('/stats', adminController.getAdminStats);

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
