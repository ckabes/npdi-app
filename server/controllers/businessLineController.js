const BusinessLine = require('../models/BusinessLine');

// Get all business lines
exports.getAllBusinessLines = async (req, res) => {
  try {
    const businessLines = await BusinessLine.find()
      .sort({ code: 1 })
      .populate('metadata.extractedBy', 'firstName lastName email');

    res.json({
      success: true,
      data: businessLines,
      count: businessLines.length
    });
  } catch (error) {
    console.error('Error fetching business lines:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching business lines',
      error: error.message
    });
  }
};

// Get active business lines only (for dropdowns)
exports.getActiveBusinessLines = async (req, res) => {
  try {
    const businessLines = await BusinessLine.find({ active: true })
      .sort({ code: 1 })
      .select('code description');

    res.json({
      success: true,
      data: businessLines
    });
  } catch (error) {
    console.error('Error fetching active business lines:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active business lines',
      error: error.message
    });
  }
};

// Create or update a business line
exports.upsertBusinessLine = async (req, res) => {
  try {
    const { code, description, active } = req.body;

    if (!code || !description) {
      return res.status(400).json({
        success: false,
        message: 'Code and description are required'
      });
    }

    const businessLine = await BusinessLine.findOneAndUpdate(
      { code },
      {
        code,
        description,
        active: active !== undefined ? active : true,
        'metadata.lastExtracted': new Date(),
        'metadata.extractedBy': req.user?._id
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Business line saved successfully',
      data: businessLine
    });
  } catch (error) {
    console.error('Error upserting business line:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving business line',
      error: error.message
    });
  }
};

// Update a business line
exports.updateBusinessLine = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, description, active } = req.body;

    const businessLine = await BusinessLine.findByIdAndUpdate(
      id,
      {
        code,
        description,
        active,
        'metadata.lastExtracted': new Date(),
        'metadata.extractedBy': req.user?._id
      },
      { new: true }
    );

    if (!businessLine) {
      return res.status(404).json({
        success: false,
        message: 'Business line not found'
      });
    }

    res.json({
      success: true,
      message: 'Business line updated successfully',
      data: businessLine
    });
  } catch (error) {
    console.error('Error updating business line:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating business line',
      error: error.message
    });
  }
};

// Delete a business line
exports.deleteBusinessLine = async (req, res) => {
  try {
    const { id } = req.params;

    const businessLine = await BusinessLine.findByIdAndDelete(id);

    if (!businessLine) {
      return res.status(404).json({
        success: false,
        message: 'Business line not found'
      });
    }

    res.json({
      success: true,
      message: 'Business line deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting business line:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting business line',
      error: error.message
    });
  }
};

// Rebuild business lines from Palantir SAP data
exports.rebuildBusinessLines = async (req, res) => {
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

    console.log('[Business Lines] Starting rebuild from Palantir dataset...');

    // Get configuration to know the dataset RID
    const config = await palantirService.getConfig();

    // Query to get all unique business lines from the SAP MARA data
    // YYD_MEMBF = Business Line code, YYD_MEMBF_TEXT = Business Line description
    const query = `
      SELECT DISTINCT YYD_MEMBF, YYD_MEMBF_TEXT
      FROM \`${config.datasetRID}\`
      WHERE YYD_MEMBF IS NOT NULL
        AND TRIM(YYD_MEMBF) != ''
      ORDER BY YYD_MEMBF
    `;

    console.log('[Business Lines] Executing query to extract business lines...');
    console.log('[Business Lines] Query:', query);

    // Execute the query
    const result = await palantirService.executeQuery(query);

    console.log(`[Business Lines] Query returned ${result.rows.length} unique business lines`);

    // Process results
    const businessLineMap = new Map();
    let totalRows = result.rows.length;
    let rowsWithBusinessLine = 0;

    for (const row of result.rows) {
      const businessLineCode = row.YYD_MEMBF?.toString().trim();
      const businessLineText = row.YYD_MEMBF_TEXT?.toString().trim();

      if (businessLineCode && businessLineCode !== '') {
        rowsWithBusinessLine++;
        businessLineMap.set(businessLineCode, businessLineText || businessLineCode);
      }
    }

    console.log(`[Business Lines] Processed ${rowsWithBusinessLine} valid business lines`);

    // Clear existing business lines
    console.log('[Business Lines] Clearing existing business lines from database...');
    await BusinessLine.deleteMany({});

    // Insert new business lines
    console.log('[Business Lines] Inserting new business lines...');
    const businessLines = Array.from(businessLineMap.entries()).map(([code, description]) => ({
      code,
      description: description || code,
      active: true,
      metadata: {
        extractedFrom: `Palantir Foundry (${config.datasetRID})`,
        lastExtracted: new Date(),
        extractedBy: req.user?._id
      }
    }));

    const insertResult = await BusinessLine.insertMany(businessLines);

    console.log(`[Business Lines] ✓ Successfully inserted ${insertResult.length} business lines`);

    res.json({
      success: true,
      message: 'Business lines rebuilt successfully from Palantir dataset',
      data: {
        totalRows,
        rowsWithBusinessLine,
        uniqueBusinessLines: insertResult.length,
        businessLines: insertResult,
        source: 'Palantir Foundry',
        datasetRID: config.datasetRID,
        queryDuration: result.duration
      }
    });
  } catch (error) {
    console.error('[Business Lines] Error rebuilding business lines:', error);
    res.status(500).json({
      success: false,
      message: 'Error rebuilding business lines from Palantir',
      error: error.message
    });
  }
};

// Get rebuild metadata
exports.getRebuildMetadata = async (req, res) => {
  try {
    const lastExtracted = await BusinessLine.findOne()
      .sort({ 'metadata.lastExtracted': -1 })
      .populate('metadata.extractedBy', 'firstName lastName email')
      .select('metadata');

    const totalCount = await BusinessLine.countDocuments();
    const activeCount = await BusinessLine.countDocuments({ active: true });

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
