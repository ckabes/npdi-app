const mongoose = require('mongoose');

const skuVariantSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['BULK', 'CONF', 'SPEC', 'VAR', 'PREPACK'],
    required: true
  },
  sku: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  packageSize: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true,
      enum: ['mg', 'g', 'kg', 'mL', 'L', 'units', 'vials', 'plates', 'bulk']
    }
  },
  pricing: {
    standardCost: {
      type: Number
    },
    calculatedCost: {
      type: Number
    },
    calculatedMarginPercent: {
      type: Number
    },
    margin: {
      type: Number,
      default: 50
    },
    limitPrice: {
      type: Number
    },
    listPrice: {
      type: Number
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  inventory: {
    minimumStock: Number,
    leadTime: Number,
    supplier: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
});

const hazardClassificationSchema = new mongoose.Schema({
  ghsClass: {
    type: String,
    enum: ['H200-H299', 'H300-H399', 'H400-H499']
  },
  hazardStatements: [String],
  precautionaryStatements: [String],
  signalWord: {
    type: String,
    enum: ['WARNING', 'DANGER', 'Danger', 'Warning']
  },
  transportClass: String,
  unNumber: String,
  pubchemGHS: {
    autoImported: {
      type: Boolean,
      default: false
    },
    lastUpdated: Date,
    rawData: mongoose.Schema.Types.Mixed
  }
});

const chemicalPropertiesSchema = new mongoose.Schema({
  casNumber: {
    type: String,
    required: true,
    match: /^\d{1,7}-\d{2}-\d$/
  },
  molecularFormula: String,
  molecularWeight: Number,
  iupacName: String,
  canonicalSMILES: String,
  pubchemCID: String,
  pubchemData: {
    lastUpdated: Date,
    compound: mongoose.Schema.Types.Mixed,
    properties: mongoose.Schema.Types.Mixed,
    hazards: mongoose.Schema.Types.Mixed
  },
  autoPopulated: {
    type: Boolean,
    default: false
  },
  physicalState: {
    type: String,
    enum: ['Solid', 'Liquid', 'Gas', 'Powder', 'Crystal']
  },
  purity: {
    min: Number,
    max: Number,
    unit: {
      type: String,
      default: '%'
    }
  },
  solubility: [{
    solvent: String,
    value: String
  }],
  storageConditions: {
    temperature: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        default: '°C'
      }
    },
    humidity: String,
    light: {
      type: String,
      enum: ['Protect from light', 'Normal light', 'UV protection required']
    },
    atmosphere: {
      type: String,
      enum: ['Air', 'Inert gas', 'Dry atmosphere']
    }
  }
});

const regulatoryInfoSchema = new mongoose.Schema({
  fdaStatus: String,
  epaRegistration: String,
  reachRegistration: String,
  tsca: Boolean,
  einecs: String,
  rohsCompliant: Boolean,
  kosherStatus: String,
  halalStatus: String
});

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['SDS', 'COA', 'SPEC_SHEET', 'REGULATORY', 'OTHER'],
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  filepath: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  version: {
    type: String,
    default: '1.0'
  }
});

const productTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: false
  },
  productName: {
    type: String,
    required: false
  },
  productLine: {
    type: String,
    required: true
  },
  sbu: {
    type: String,
    enum: ['775', 'P90', '440', 'P87', 'P89', 'P85'],
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'IN_PROCESS', 'COMPLETED', 'CANCELED'],
    default: 'DRAFT'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  chemicalProperties: chemicalPropertiesSchema,
  hazardClassification: hazardClassificationSchema,
  skuVariants: [skuVariantSchema],
  regulatoryInfo: regulatoryInfoSchema,
  launchTimeline: {
    targetLaunchDate: Date,
    milestones: [{
      name: String,
      dueDate: Date,
      completed: {
        type: Boolean,
        default: false
      },
      completedDate: Date,
      notes: String
    }]
  },
  businessJustification: {
    marketAnalysis: String,
    competitiveAnalysis: String,
    salesForecast: {
      year1: Number,
      year2: Number,
      year3: Number
    },
    roi: Number
  },
  partNumber: {
    baseNumber: String,
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: Date
  },
  standardCost: {
    type: Number
  },
  margin: {
    type: Number,
    default: 50
  },
  corpbaseData: {
    productDescription: String,
    websiteTitle: String,
    metaDescription: String,
    keyFeatures: [String],
    applications: [String],
    targetIndustries: String,
    aiGenerated: {
      type: Boolean,
      default: false
    },
    generatedAt: Date,
    targetMarkets: [String],
    competitiveAdvantages: [String],
    technicalSpecifications: String,
    qualityStandards: [String]
  },
  pricingData: {
    baseUnit: {
      type: String,
      enum: ['mg', 'g', 'kg', 'mL', 'L', 'units', 'vials', 'plates', 'bulk'],
      default: 'g'
    },
    standardCosts: {
      rawMaterialCostPerUnit: {
        type: Number,
        default: 0.50
      },
      packagingCost: {
        type: Number,
        default: 2.50
      },
      laborOverheadCost: {
        type: Number,
        default: 5.00
      }
    },
    targetMargins: {
      smallSize: {
        type: Number,
        default: 75
      },
      mediumSize: {
        type: Number,
        default: 65
      },
      largeSize: {
        type: Number,
        default: 55
      },
      bulkSize: {
        type: Number,
        default: 45
      }
    },
    calculatedAt: Date
  },
  documents: [documentSchema],
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String,
    action: {
      type: String,
      enum: ['TICKET_CREATED', 'STATUS_CHANGE', 'SKU_ASSIGNMENT', 'TICKET_EDIT', 'COMMENT_ADDED'],
      default: 'STATUS_CHANGE'
    },
    details: mongoose.Schema.Types.Mixed,
    userInfo: {
      firstName: String,
      lastName: String,
      role: String
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

productTicketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.createdBy,
      reason: 'Ticket created',
      action: 'TICKET_CREATED'
    });
  }
  
  next();
});

productTicketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber) {
    const count = await mongoose.model('ProductTicket').countDocuments();
    const year = new Date().getFullYear();
    this.ticketNumber = `NPDI-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ProductTicket', productTicketSchema);