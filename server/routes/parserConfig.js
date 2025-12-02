const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllConfigurations,
  getConfigurationByType,
  getVersion,
  upsertEntry,
  deleteEntry,
  bulkImport,
  exportConfiguration,
  resetToDefaults,
  searchEntries
} = require('../controllers/parserConfigController');

// Version endpoint is public for cache checking
router.get('/version', getVersion);

// All other routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Get all configurations
router.get('/', getAllConfigurations);

// Configuration type specific routes
router.get('/:configType', getConfigurationByType);
router.get('/:configType/export', exportConfiguration);
router.get('/:configType/search', searchEntries);
router.post('/:configType/entry', upsertEntry);
router.post('/:configType/bulk', bulkImport);
router.post('/:configType/reset', resetToDefaults);
router.delete('/:configType/entry/:key', deleteEntry);

module.exports = router;
