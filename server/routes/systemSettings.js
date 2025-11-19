const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getSystemSettings,
  updateSystemSettings,
  testSmtpConnection,
  testPubChemConnection,
  testAzureOpenAI,
  getSettingsSection
} = require('../controllers/systemSettingsController');

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// System settings routes
router.route('/')
  .get(getSystemSettings)
  .put(updateSystemSettings);

// Test connections
router.post('/test-smtp', testSmtpConnection);
router.post('/test-pubchem', testPubChemConnection);
router.post('/test-azure-openai', testAzureOpenAI);

// Get specific section
router.get('/:section', getSettingsSection);

module.exports = router;
