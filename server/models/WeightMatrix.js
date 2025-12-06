const mongoose = require('mongoose');

/**
 * WeightMatrix Model
 * Stores gross weight mappings for different package sizes
 * Based on SAP MARA table fields: BRGEW (gross weight) and GEWEI (weight unit)
 */
const weightMatrixSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    // Package size format examples: "100G", "1L", "500MG", "50ML"
  },
  grossWeight: {
    type: Number,
    required: true,
    // BRGEW field from MARA table
  },
  weightUnit: {
    type: String,
    required: true,
    enum: ['MG', 'G', 'KG', 'UG'],
    // GEWEI field from MARA table
  },
  // Normalized values for comparison (calculated fields)
  normalizedSize: {
    value: Number,
    unit: String
  },
  normalizedGrossWeight: {
    value: Number,  // Gross weight converted to grams for comparison
    unit: {
      type: String,
      default: 'G'
    }
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    default: 'system'
  }
});

// Index for fast lookups (size field already indexed via unique: true)
weightMatrixSchema.index({ 'normalizedSize.value': 1, 'normalizedSize.unit': 1 });

// Pre-save hook to update timestamp
weightMatrixSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('WeightMatrix', weightMatrixSchema);
