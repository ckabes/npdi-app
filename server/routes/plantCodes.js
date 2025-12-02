const express = require('express');
const router = express.Router();
const plantCodeController = require('../controllers/plantCodeController');
const { protect, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Public routes (authenticated users)
router.get('/active', plantCodeController.getActivePlantCodes);

// Admin-only routes
router.get('/', requireAdmin, plantCodeController.getAllPlantCodes);
router.get('/metadata', requireAdmin, plantCodeController.getRebuildMetadata);
router.post('/', requireAdmin, plantCodeController.upsertPlantCode);
router.put('/:id', requireAdmin, plantCodeController.updatePlantCode);
router.delete('/:id', requireAdmin, plantCodeController.deletePlantCode);
router.post('/rebuild', requireAdmin, plantCodeController.rebuildPlantCodes);

module.exports = router;
