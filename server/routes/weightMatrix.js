const express = require('express');
const router = express.Router();
const WeightMatrix = require('../models/WeightMatrix');

/**
 * Utility function to parse size string
 */
function parseSize(sizeStr) {
  if (!sizeStr || typeof sizeStr !== 'string') return null;

  const match = sizeStr.trim().match(/^(\d+\.?\d*)([A-Z]+)$/i);
  if (!match) return null;

  return {
    value: parseFloat(match[1]),
    unit: match[2].toUpperCase()
  };
}

/**
 * Normalize size for comparison
 */
function normalizeSizeValue(value, unit) {
  const weightConversions = {
    'UG': 0.000001,
    'MG': 0.001,
    'G': 1,
    'KG': 1000
  };

  const volumeConversions = {
    'UL': 0.001,
    'ML': 1,
    'L': 1000
  };

  if (weightConversions[unit]) {
    return { value: value * weightConversions[unit], unit: 'G' };
  }

  if (volumeConversions[unit]) {
    return { value: value * volumeConversions[unit], unit: 'ML' };
  }

  return { value, unit };
}

/**
 * GET /api/weight-matrix
 * Get all weight matrix entries (paginated)
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      WeightMatrix.find()
        .sort({ size: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WeightMatrix.countDocuments()
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching weight matrix:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weight matrix data',
      error: error.message
    });
  }
});

/**
 * GET /api/weight-matrix/search
 * Search weight matrix entries
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query required'
      });
    }

    const entries = await WeightMatrix.find({
      size: { $regex: q, $options: 'i' }
    })
      .sort({ size: 1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: entries
    });
  } catch (error) {
    console.error('Error searching weight matrix:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search weight matrix',
      error: error.message
    });
  }
});

/**
 * GET /api/weight-matrix/lookup/:packageSize
 * Find closest matching gross weight for a package size
 *
 * Example: /api/weight-matrix/lookup/100G
 * Returns the weight matrix entry with exact or closest match
 */
router.get('/lookup/:packageSize', async (req, res) => {
  try {
    const { packageSize } = req.params;

    // Try exact match first
    const exactMatch = await WeightMatrix.findOne({
      size: { $regex: `^${packageSize}$`, $options: 'i' }
    }).lean();

    if (exactMatch) {
      return res.json({
        success: true,
        match: 'exact',
        data: exactMatch
      });
    }

    // Parse the input size
    const parsedInput = parseSize(packageSize);

    if (!parsedInput) {
      return res.json({
        success: true,
        match: 'none',
        message: 'Could not parse package size format. Expected format: "100G", "1L", etc.',
        data: null
      });
    }

    const normalizedInput = normalizeSizeValue(parsedInput.value, parsedInput.unit);

    // Find entries with the same normalized unit
    const candidates = await WeightMatrix.find({
      'normalizedSize.unit': normalizedInput.unit
    }).lean();

    if (candidates.length === 0) {
      return res.json({
        success: true,
        match: 'none',
        message: `No entries found for unit type: ${normalizedInput.unit}`,
        data: null
      });
    }

    // Find closest match by normalized value
    let closestMatch = candidates[0];
    let minDifference = Math.abs(candidates[0].normalizedSize.value - normalizedInput.value);

    for (const candidate of candidates) {
      const difference = Math.abs(candidate.normalizedSize.value - normalizedInput.value);
      if (difference < minDifference) {
        minDifference = difference;
        closestMatch = candidate;
      }
    }

    res.json({
      success: true,
      match: 'approximate',
      difference: minDifference,
      data: closestMatch
    });

  } catch (error) {
    console.error('Error looking up weight matrix:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lookup weight matrix',
      error: error.message
    });
  }
});

/**
 * POST /api/weight-matrix
 * Create a new weight matrix entry
 */
router.post('/', async (req, res) => {
  try {
    const { size, grossWeight, weightUnit } = req.body;

    // Validate required fields
    if (!size || !grossWeight || !weightUnit) {
      return res.status(400).json({
        success: false,
        message: 'size, grossWeight, and weightUnit are required'
      });
    }

    // Check for duplicate
    const existing = await WeightMatrix.findOne({ size });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Entry for size "${size}" already exists`
      });
    }

    // Parse and normalize
    const parsedSize = parseSize(size);
    const normalizedSize = parsedSize ? normalizeSizeValue(parsedSize.value, parsedSize.unit) : null;

    const convertToGrams = (value, unit) => {
      const conversions = { 'UG': 0.000001, 'MG': 0.001, 'G': 1, 'KG': 1000 };
      return value * (conversions[unit] || 1);
    };

    const normalizedGrossWeight = {
      value: convertToGrams(grossWeight, weightUnit),
      unit: 'G'
    };

    const entry = new WeightMatrix({
      size,
      grossWeight,
      weightUnit,
      normalizedSize,
      normalizedGrossWeight,
      createdBy: req.user?.email || 'manual'
    });

    await entry.save();

    res.status(201).json({
      success: true,
      message: 'Weight matrix entry created',
      data: entry
    });

  } catch (error) {
    console.error('Error creating weight matrix entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create weight matrix entry',
      error: error.message
    });
  }
});

/**
 * PUT /api/weight-matrix/:id
 * Update a weight matrix entry
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { size, grossWeight, weightUnit } = req.body;

    const entry = await WeightMatrix.findById(id);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Weight matrix entry not found'
      });
    }

    // Update fields
    if (size) entry.size = size;
    if (grossWeight) entry.grossWeight = grossWeight;
    if (weightUnit) entry.weightUnit = weightUnit;

    // Recalculate normalized values
    const parsedSize = parseSize(entry.size);
    if (parsedSize) {
      entry.normalizedSize = normalizeSizeValue(parsedSize.value, parsedSize.unit);
    }

    const convertToGrams = (value, unit) => {
      const conversions = { 'UG': 0.000001, 'MG': 0.001, 'G': 1, 'KG': 1000 };
      return value * (conversions[unit] || 1);
    };

    entry.normalizedGrossWeight = {
      value: convertToGrams(entry.grossWeight, entry.weightUnit),
      unit: 'G'
    };

    await entry.save();

    res.json({
      success: true,
      message: 'Weight matrix entry updated',
      data: entry
    });

  } catch (error) {
    console.error('Error updating weight matrix entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update weight matrix entry',
      error: error.message
    });
  }
});

/**
 * DELETE /api/weight-matrix/:id
 * Delete a weight matrix entry
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await WeightMatrix.findByIdAndDelete(id);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Weight matrix entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Weight matrix entry deleted'
    });

  } catch (error) {
    console.error('Error deleting weight matrix entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete weight matrix entry',
      error: error.message
    });
  }
});

module.exports = router;
