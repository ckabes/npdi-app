const mongoose = require('mongoose');

// Schema for storing the product hierarchy data
// This stores the entire hierarchy structure as a JSON document for efficient querying
const ProductHierarchySchema = new mongoose.Schema({
  // Metadata about the hierarchy
  metadata: {
    source: {
      type: String,
      default: 'LS Product Hierarchy.csv'
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    totalDivisions: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      default: 'Product Hierarchy for Life Science division'
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    version: {
      type: Number,
      default: 1
    }
  },

  // The full hierarchy structure: divisions → units → fields → lines → groups → mainGroups → prodhTree
  divisions: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Status tracking
  isActive: {
    type: Boolean,
    default: true
  },

  // Statistics for quick reference
  stats: {
    totalRecords: {
      type: Number,
      default: 0
    },
    divisionsCount: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  collection: 'producthierarchies'
});

// Index for efficient querying
ProductHierarchySchema.index({ 'metadata.version': -1 });
ProductHierarchySchema.index({ isActive: 1, 'metadata.version': -1 });

// Static method to get the active (latest) hierarchy
ProductHierarchySchema.statics.getActive = async function() {
  return await this.findOne({ isActive: true }).sort({ 'metadata.version': -1 });
};

// Static method to create a new version and deactivate old ones
ProductHierarchySchema.statics.createNewVersion = async function(hierarchyData, uploadedBy) {
  // Deactivate all existing hierarchies
  await this.updateMany({}, { isActive: false });

  // Get the latest version number
  const latestVersion = await this.findOne().sort({ 'metadata.version': -1 });
  const newVersion = latestVersion ? latestVersion.metadata.version + 1 : 1;

  // Create the new hierarchy with incremented version
  const newHierarchy = new this({
    metadata: {
      ...hierarchyData.metadata,
      version: newVersion,
      uploadedBy,
      generatedAt: new Date()
    },
    divisions: hierarchyData.divisions,
    isActive: true,
    stats: hierarchyData.stats || {}
  });

  return await newHierarchy.save();
};

const ProductHierarchy = mongoose.model('ProductHierarchy', ProductHierarchySchema);

module.exports = ProductHierarchy;
