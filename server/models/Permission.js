const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['PRODUCT_MANAGER', 'PM_OPS', 'ADMIN'],
    required: true,
    unique: true
  },
  privileges: {
    tickets: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    drafts: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    skuVariants: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    skuAssignment: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    chemicalProperties: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    hazardClassification: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    corpbaseData: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    pricingData: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    comments: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    statusHistory: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    adminPanel: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
permissionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get privileges for a role
permissionSchema.statics.getPrivilegesForRole = async function(role) {
  const permissions = await this.findOne({ role });
  return permissions ? permissions.privileges : null;
};

// Static method to initialize default privileges
permissionSchema.statics.initializeDefaultPermissions = async function() {
  const defaultPermissions = [
    {
      role: 'PRODUCT_MANAGER',
      privileges: {
        tickets: { view: true, edit: true },
        drafts: { view: true, edit: true },
        skuVariants: { view: true, edit: true },
        skuAssignment: { view: false, edit: false },
        chemicalProperties: { view: true, edit: true },
        hazardClassification: { view: true, edit: true },
        corpbaseData: { view: true, edit: true },
        pricingData: { view: false, edit: false },
        comments: { view: true, edit: true },
        statusHistory: { view: true, edit: false },
        adminPanel: { view: false, edit: false }
      }
    },
    {
      role: 'PM_OPS',
      privileges: {
        tickets: { view: true, edit: true },
        drafts: { view: true, edit: false },
        skuVariants: { view: true, edit: true },
        skuAssignment: { view: true, edit: true },
        chemicalProperties: { view: true, edit: false },
        hazardClassification: { view: true, edit: false },
        corpbaseData: { view: true, edit: false },
        pricingData: { view: true, edit: true },
        comments: { view: true, edit: true },
        statusHistory: { view: true, edit: true },
        adminPanel: { view: false, edit: false }
      }
    },
    {
      role: 'ADMIN',
      privileges: {
        tickets: { view: true, edit: true },
        drafts: { view: true, edit: true },
        skuVariants: { view: true, edit: true },
        skuAssignment: { view: true, edit: true },
        chemicalProperties: { view: true, edit: true },
        hazardClassification: { view: true, edit: true },
        corpbaseData: { view: true, edit: true },
        pricingData: { view: true, edit: true },
        comments: { view: true, edit: true },
        statusHistory: { view: true, edit: true },
        adminPanel: { view: true, edit: true }
      }
    }
  ];

  for (const perm of defaultPermissions) {
    await this.findOneAndUpdate(
      { role: perm.role },
      perm,
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('Permission', permissionSchema);
