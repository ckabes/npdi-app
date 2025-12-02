const ProductHierarchy = require('../models/ProductHierarchy');
const ProductHierarchyParser = require('../services/productHierarchyParser');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get the active (current) product hierarchy
 */
exports.getActiveHierarchy = async (req, res) => {
  try {
    const hierarchy = await ProductHierarchy.getActive();

    if (!hierarchy) {
      return res.status(404).json({
        success: false,
        message: 'No product hierarchy found. Please upload a CSV file.'
      });
    }

    res.json({
      success: true,
      data: {
        metadata: hierarchy.metadata,
        divisions: hierarchy.divisions
      }
    });
  } catch (error) {
    console.error('Error fetching product hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product hierarchy',
      error: error.message
    });
  }
};

/**
 * Get all hierarchy versions (for admin viewing)
 */
exports.getHierarchyVersions = async (req, res) => {
  try {
    const hierarchies = await ProductHierarchy.find()
      .select('metadata stats isActive createdAt')
      .populate('metadata.uploadedBy', 'firstName lastName email')
      .sort({ 'metadata.version': -1 })
      .limit(20);

    res.json({
      success: true,
      data: hierarchies
    });
  } catch (error) {
    console.error('Error fetching hierarchy versions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hierarchy versions',
      error: error.message
    });
  }
};

/**
 * Upload and process a new CSV file
 */
exports.uploadCSV = async (req, res) => {
  let tempFilePath = null;

  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a CSV file.'
      });
    }

    // Validate file type
    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload a CSV file.'
      });
    }

    tempFilePath = req.file.path;
    console.log(`Processing CSV file: ${req.file.originalname} (${req.file.size} bytes)`);

    // Parse the CSV file
    const parser = new ProductHierarchyParser();
    const hierarchyData = await parser.parseCSV(tempFilePath);

    // Get uploaded by user ID from request (assumes authentication middleware)
    const uploadedBy = req.user ? req.user._id : null;

    // Create new version in database
    const newHierarchy = await ProductHierarchy.createNewVersion(hierarchyData, uploadedBy);

    // Clean up temp file
    await fs.unlink(tempFilePath);

    console.log(`Successfully created hierarchy version ${newHierarchy.metadata.version}`);

    res.json({
      success: true,
      message: 'Product hierarchy uploaded successfully',
      data: {
        version: newHierarchy.metadata.version,
        totalRecords: newHierarchy.stats.totalRecords,
        divisionsCount: newHierarchy.stats.divisionsCount,
        uploadedAt: newHierarchy.metadata.generatedAt
      }
    });
  } catch (error) {
    console.error('Error uploading CSV:', error);

    // Clean up temp file if it exists
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (unlinkError) {
        console.error('Error cleaning up temp file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process CSV file',
      error: error.message
    });
  }
};

/**
 * Get hierarchy statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    const activeHierarchy = await ProductHierarchy.getActive();

    if (!activeHierarchy) {
      return res.status(404).json({
        success: false,
        message: 'No active hierarchy found'
      });
    }

    const totalVersions = await ProductHierarchy.countDocuments();

    res.json({
      success: true,
      data: {
        currentVersion: activeHierarchy.metadata.version,
        totalVersions,
        stats: activeHierarchy.stats,
        lastUpdated: activeHierarchy.metadata.generatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};
