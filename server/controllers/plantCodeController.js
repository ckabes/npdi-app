const PlantCode = require('../models/PlantCode');

// Get all plant codes
exports.getAllPlantCodes = async (req, res) => {
  try {
    const plantCodes = await PlantCode.find()
      .sort({ code: 1 })
      .populate('metadata.extractedBy', 'name email');

    res.json({
      success: true,
      data: plantCodes,
      count: plantCodes.length
    });
  } catch (error) {
    console.error('Error fetching plant codes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plant codes',
      error: error.message
    });
  }
};

// Get active plant codes only (for dropdowns)
exports.getActivePlantCodes = async (req, res) => {
  try {
    const plantCodes = await PlantCode.find({ active: true })
      .sort({ code: 1 })
      .select('code description');

    res.json({
      success: true,
      data: plantCodes
    });
  } catch (error) {
    console.error('Error fetching active plant codes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active plant codes',
      error: error.message
    });
  }
};

// Create or update a plant code
exports.upsertPlantCode = async (req, res) => {
  try {
    const { code, description, active } = req.body;

    if (!code || !description) {
      return res.status(400).json({
        success: false,
        message: 'Code and description are required'
      });
    }

    const plantCode = await PlantCode.findOneAndUpdate(
      { code: code.toUpperCase() },
      {
        code: code.toUpperCase(),
        description: description.trim(),
        active: active !== undefined ? active : true
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Plant code saved successfully',
      data: plantCode
    });
  } catch (error) {
    console.error('Error saving plant code:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving plant code',
      error: error.message
    });
  }
};

// Update a plant code
exports.updatePlantCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, description, active } = req.body;

    const plantCode = await PlantCode.findByIdAndUpdate(
      id,
      {
        code: code?.toUpperCase(),
        description: description?.trim(),
        active
      },
      { new: true, runValidators: true }
    );

    if (!plantCode) {
      return res.status(404).json({
        success: false,
        message: 'Plant code not found'
      });
    }

    res.json({
      success: true,
      message: 'Plant code updated successfully',
      data: plantCode
    });
  } catch (error) {
    console.error('Error updating plant code:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating plant code',
      error: error.message
    });
  }
};

// Delete a plant code
exports.deletePlantCode = async (req, res) => {
  try {
    const { id } = req.params;

    const plantCode = await PlantCode.findByIdAndDelete(id);

    if (!plantCode) {
      return res.status(404).json({
        success: false,
        message: 'Plant code not found'
      });
    }

    res.json({
      success: true,
      message: 'Plant code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plant code:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting plant code',
      error: error.message
    });
  }
};

// Rebuild plant codes from Palantir SAP data
exports.rebuildPlantCodes = async (req, res) => {
  try {
    const palantirService = require('../services/palantirService');

    // Check if Palantir is enabled
    const isEnabled = await palantirService.isEnabled();
    if (!isEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Palantir integration is not enabled. Please configure Palantir in System Settings.'
      });
    }

    console.log('[Plant Codes] Starting rebuild from Palantir dataset...');

    // Get configuration to know the dataset RID
    const config = await palantirService.getConfig();

    // Query to get all unique plant codes from the SAP MARA data
    // ORG_PPL = Plant code, ORG_PPL_TEXT = Plant description
    const query = `
      SELECT DISTINCT ORG_PPL, ORG_PPL_TEXT
      FROM \`${config.datasetRID}\`
      WHERE ORG_PPL IS NOT NULL
        AND TRIM(ORG_PPL) != ''
      ORDER BY ORG_PPL
    `;

    console.log('[Plant Codes] Executing query to extract plant codes...');
    console.log('[Plant Codes] Query:', query);

    // Execute the query
    const result = await palantirService.executeQuery(query);

    console.log(`[Plant Codes] Query returned ${result.rows.length} unique plant codes`);

    // Process results
    const plantMap = new Map();
    let totalRows = result.rows.length;
    let rowsWithPlant = 0;

    for (const row of result.rows) {
      const plantCode = row.ORG_PPL?.toString().trim();
      const plantText = row.ORG_PPL_TEXT?.toString().trim();

      if (plantCode && plantCode !== '') {
        rowsWithPlant++;
        plantMap.set(plantCode, plantText || plantCode);
      }
    }

    console.log(`[Plant Codes] Processed ${rowsWithPlant} valid plant codes`);

    // Clear existing plant codes
    console.log('[Plant Codes] Clearing existing plant codes from database...');
    await PlantCode.deleteMany({});

    // Insert new plant codes
    console.log('[Plant Codes] Inserting new plant codes...');
    const plantCodes = Array.from(plantMap.entries()).map(([code, description]) => ({
      code,
      description: description || code,
      active: true,
      metadata: {
        extractedFrom: `Palantir Foundry (${config.datasetRID})`,
        lastExtracted: new Date(),
        extractedBy: req.user?._id
      }
    }));

    const insertResult = await PlantCode.insertMany(plantCodes);

    console.log(`[Plant Codes] ✓ Successfully inserted ${insertResult.length} plant codes`);

    res.json({
      success: true,
      message: 'Plant codes rebuilt successfully from Palantir dataset',
      data: {
        totalRows,
        rowsWithPlant,
        uniquePlantCodes: insertResult.length,
        plantCodes: insertResult,
        source: 'Palantir Foundry',
        datasetRID: config.datasetRID,
        queryDuration: result.duration
      }
    });
  } catch (error) {
    console.error('[Plant Codes] Error rebuilding plant codes:', error);
    res.status(500).json({
      success: false,
      message: 'Error rebuilding plant codes from Palantir',
      error: error.message
    });
  }
};

// Get rebuild metadata
exports.getRebuildMetadata = async (req, res) => {
  try {
    const lastExtracted = await PlantCode.findOne()
      .sort({ 'metadata.lastExtracted': -1 })
      .populate('metadata.extractedBy', 'name email')
      .select('metadata');

    const totalCount = await PlantCode.countDocuments();
    const activeCount = await PlantCode.countDocuments({ active: true });

    res.json({
      success: true,
      data: {
        lastExtracted: lastExtracted?.metadata?.lastExtracted,
        extractedBy: lastExtracted?.metadata?.extractedBy,
        extractedFrom: lastExtracted?.metadata?.extractedFrom,
        totalCount,
        activeCount
      }
    });
  } catch (error) {
    console.error('Error fetching rebuild metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rebuild metadata',
      error: error.message
    });
  }
};
