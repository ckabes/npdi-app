const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const productHierarchyController = require('../controllers/productHierarchyController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Store in temp directory
    cb(null, '/tmp');
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'gph-upload-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Public route - get active hierarchy (needed by frontend selector)
router.get('/active', productHierarchyController.getActiveHierarchy);

// Admin routes - require authentication
// Note: Add authentication middleware here when ready
router.get('/versions', productHierarchyController.getHierarchyVersions);
router.get('/statistics', productHierarchyController.getStatistics);
router.post('/upload', upload.single('file'), productHierarchyController.uploadCSV);

module.exports = router;
