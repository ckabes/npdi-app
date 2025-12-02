const express = require('express');
const router = express.Router();
const businessLineController = require('../controllers/businessLineController');

// Public route - get active business lines (needed by frontend selector)
router.get('/active', businessLineController.getActiveBusinessLines);

// Admin routes - require authentication
// Note: Add authentication middleware here when ready
router.get('/', businessLineController.getAllBusinessLines);
router.get('/metadata', businessLineController.getRebuildMetadata);
router.post('/', businessLineController.upsertBusinessLine);
router.put('/:id', businessLineController.updateBusinessLine);
router.delete('/:id', businessLineController.deleteBusinessLine);
router.post('/rebuild', businessLineController.rebuildBusinessLines);

module.exports = router;
