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
    type: String,  // Email address from profile
    default: 'system'
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
  isomericSMILES: String,
  inchi: String,
  inchiKey: String,
  synonyms: [String],
  hazardStatements: [String],
  unNumber: String,
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
  materialSource: {
    type: String,
    enum: ['Human', 'Plant', 'Fermentation', 'Recombinant', 'Synthetic']
  },
  animalComponent: {
    type: String,
    enum: ['Animal Component Free', 'Animal Component Containing']
  },
  storageTemperature: {
    type: String,
    enum: ['CL (2-8 deg)', 'F0 (-20 C)', 'F7 (-70 C)', 'RT (RT Controlled)', 'RT (Ambient)', 'F0 (-196 C)']
  },
  // Additional PubChem properties (hidden by default, shown via "Add Property")
  additionalProperties: {
    meltingPoint: String,
    boilingPoint: String,
    flashPoint: String,
    density: String,
    vaporPressure: String,
    vaporDensity: String,
    refractiveIndex: String,
    logP: String,
    polarSurfaceArea: String,
    hydrogenBondDonor: Number,
    hydrogenBondAcceptor: Number,
    rotatableBonds: Number,
    exactMass: String,
    monoisotopicMass: String,
    complexity: String,
    heavyAtomCount: Number,
    charge: Number,
    visibleProperties: {
      type: [String],
      default: []
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
  },
  shippingConditions: {
    type: String,
    enum: ['Standard', 'Wet Ice', 'Dry Ice', 'Liquid Nitrogen'],
    default: 'Standard'
  }
});

const qualityAttributeSchema = new mongoose.Schema({
  testAttribute: {
    type: String,
    required: true
  },
  dataSource: {
    type: String,
    enum: ['QC', 'Vendor'],
    required: true
  },
  valueRange: {
    type: String,
    required: true
  },
  comments: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const qualitySchema = new mongoose.Schema({
  mqQualityLevel: {
    type: String,
    enum: ['N/A', 'MQ100', 'MQ200', 'MQ300', 'MQ400', 'MQ500', 'MQ600'],
    default: 'N/A'
  },
  attributes: [qualityAttributeSchema]
});

const compositionComponentSchema = new mongoose.Schema({
  proprietary: {
    type: Boolean,
    default: false
  },
  componentCAS: {
    type: String
  },
  weightPercent: {
    type: Number,
    required: true
  },
  componentName: {
    type: String
  },
  componentFormula: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const compositionSchema = new mongoose.Schema({
  components: [compositionComponentSchema]
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
    type: String,  // Email address from profile
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
  productionType: {
    type: String,
    enum: ['Produced', 'Procured'],
    default: 'Produced'
  },
  sbu: {
    type: String,
    enum: ['775', 'P90', '440', 'P87', 'P89', 'P85'],
    required: true
  },
  primaryPlant: {
    type: String
  },
  productScope: {
    scope: {
      type: String,
      enum: ['Worldwide', 'North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania', 'Other']
    },
    otherSpecification: {
      type: String
    }
  },
  distributionType: {
    type: String,
    enum: ['Standard', 'Purchase on Demand', 'Dock-to-Stock']
  },
  retestOrExpiration: {
    type: {
      type: String,
      enum: ['None', 'Retest', 'Expiration']
    },
    shelfLife: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'months', 'years']
      }
    }
  },
  sialProductHierarchy: {
    type: String
  },
  materialGroup: {
    type: String
  },
  countryOfOrigin: {
    type: String
  },
  brand: {
    type: String,
    enum: ['Sigma-Aldrich', 'SAFC', 'Supelco', 'Milli-Q', 'Millipore', 'BioReliance', 'Calbiochem', 'Merck']
  },
  vendorInformation: {
    vendorName: String,
    vendorProductName: String,
    vendorSAPNumber: String,
    vendorProductNumber: String
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'IN_PROCESS', 'NPDI_INITIATED', 'COMPLETED', 'CANCELED'],
    default: 'DRAFT'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  createdBy: {
    type: String,  // Email address from profile
    required: false
  },
  assignedTo: {
    type: String,  // Email address from profile
    required: false
  },
  chemicalProperties: chemicalPropertiesSchema,
  hazardClassification: hazardClassificationSchema,
  quality: qualitySchema,
  composition: compositionSchema,
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
      type: String  // Email address from profile
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
    targetMargin: {
      type: Number,
      default: 65
    },
    calculatedAt: Date
  },
  documents: [documentSchema],
  statusHistory: [{
    status: String,
    changedBy: {
      type: String  // Email address from profile
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
      type: String,  // Email address from profile
      required: false
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    userInfo: {
      firstName: String,
      lastName: String,
      email: String,
      role: String
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