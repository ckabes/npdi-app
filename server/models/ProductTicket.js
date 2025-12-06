const mongoose = require('mongoose');

const skuVariantSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['BULK', 'CONF', 'SPEC', 'VAR', 'PREPACK'],
    required: true
  },
  suffix: {
    type: String,
    required: false
    // Part number suffix (e.g., "100G", "1KG" for PREPACK, or "BULK", "VAR", "CONF", "SPEC" for other types)
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
      required: false
    },
    unit: {
      type: String,
      required: false,
      enum: ['mg', 'g', 'kg', 'mL', 'L', 'EA', 'units', 'vials', 'plates', 'bulk']
    }
  },
  grossWeight: {
    value: {
      type: Number,
      required: false
    },
    unit: {
      type: String,
      enum: ['mg', 'g', 'kg', 'lb', 'oz'],
      default: 'g'
    }
  },
  netWeight: {
    value: {
      type: Number,
      required: false
    },
    unit: {
      type: String,
      enum: ['mg', 'g', 'kg', 'lb', 'oz'],
      default: 'g'
    }
  },
  volume: {
    value: {
      type: Number,
      required: false
    },
    unit: {
      type: String,
      enum: ['mL', 'L', 'µL', 'gal', 'fl oz'],
      default: 'mL'
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
  forecastedSalesVolume: {
    year1: {
      type: Number,
      min: 0
    },
    year2: {
      type: Number,
      min: 0
    },
    year3: {
      type: Number,
      min: 0
    }
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
    required: false,
    match: /^\d+-\d{2}-\d$/  // More lenient: allows any number of digits in first part
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


const productTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: false
  },
  productName: {
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
    required: true
  },
  primaryPlant: {
    type: String
  },
  productScope: {
    scope: {
      type: String,
      enum: ['Worldwide', 'US only', 'Europe only', 'EEA Restricted', 'Other']
    },
    otherSpecification: {
      type: String
    }
  },
  distributionType: {
    type: {
      type: String,
      enum: ['Standard', 'Purchase on Demand', 'Dock to Stock']
    },
    coaCreator: {
      type: String,
      enum: ['Internal', 'Vendor']
    },
    labelingType: {
      type: String,
      enum: ['SIAL Label', 'Vendor Label']
    },
    labelingResponsibility: {
      type: String,
      enum: ['Internal', 'Vendor']
    },
    vendorLabelSource: {
      type: String  // Free text for "How vendor obtains labels"
    }
  },
  retestOrExpiration: {
    hasExpirationDate: {
      type: Boolean,
      default: false
    },
    expirationPeriod: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'months', 'years']
      }
    },
    hasRetestDate: {
      type: Boolean,
      default: false
    },
    retestPeriod: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'months', 'years']
      }
    },
    hasShelfLife: {
      type: Boolean,
      default: false
    },
    shelfLifePeriod: {
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
  businessLine: {
    line: {
      type: String
      // Removed enum to allow free text from SAP and manual entry
    },
    mainGroupGPH: {
      type: String  // SAP GPH Product Line (YYD_GPHPL)
    },
    otherSpecification: {
      type: String
    }
  },
  vendorInformation: {
    vendorName: String,
    vendorProductName: String,
    vendorSAPNumber: String,
    vendorProductNumber: String,
    vendorCostPerUOM: {
      value: Number,
      unit: String
    },
    amountToBePurchased: {
      value: Number,
      unit: String
    },
    vendorLeadTimeWeeks: Number,
    purchaseUOM: String,
    purchaseCurrency: {
      type: String,
      default: 'USD'
    },
    countryOfOrigin: String
  },
  intellectualProperty: {
    hasIP: {
      type: Boolean,
      default: false
    },
    patentNumber: String,
    licenseNumber: String
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
  createdByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'  // Reference to the User model for populated queries
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TicketTemplate',  // Reference to the template used to create this ticket
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
  partNumber: {
    baseNumber: String,
    assignedBy: {
      type: String  // Email address from profile
    },
    assignedAt: Date
  },
  baseUnit: {
    value: Number,
    unit: {
      type: String,
      enum: ['mg', 'g', 'kg', 'mL', 'L']
    }
  },
  npdiTracking: {
    trackingNumber: String,  // Official NPDI tracking number from external NPDI system
    initiatedBy: {
      type: String  // Email address from profile
    },
    initiatedAt: Date
    // When NPDI is initiated, the main ticketNumber field is updated to match this trackingNumber
    // Example: ticketNumber changes from "NPDI-2025-0055" to "10000030016545"
    // The original ticket number is preserved in statusHistory for audit trail
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
    unspscCode: String,
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
      enum: ['mg', 'g', 'kg', 'mL', 'L', 'EA', 'units', 'vials', 'plates', 'bulk'],
      default: 'g'
    },
    standardCosts: {
      rawMaterialCostPerUnit: {
        type: Number,
        default: 0.50
      }
    },
    targetMargin: {
      type: Number,
      default: 65
    },
    calculatedAt: Date
  },
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
      enum: ['TICKET_CREATED', 'STATUS_CHANGE', 'SKU_ASSIGNMENT', 'TICKET_EDIT', 'COMMENT_ADDED', 'NPDI_INITIATED'],
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

// Indexes for query performance
// Dashboard and list queries frequently filter by status with date sorting
productTicketSchema.index({ status: 1, updatedAt: -1 });
// Filtered lists by status and SBU
productTicketSchema.index({ status: 1, sbu: 1 });
// Filtered lists by status and priority
productTicketSchema.index({ status: 1, priority: 1 });
// User's tickets queries
productTicketSchema.index({ createdBy: 1, status: 1 });
// Assignment queries
productTicketSchema.index({ assignedTo: 1, status: 1 });
// Date-based queries and default sorting
productTicketSchema.index({ createdAt: -1 });
// CAS number lookup for chemical products
productTicketSchema.index({ 'chemicalProperties.casNumber': 1 });
// SBU reports with date sorting
productTicketSchema.index({ sbu: 1, createdAt: -1 });

// Pre-save hook to clean up and normalize data before validation
productTicketSchema.pre('validate', function(next) {
  // Clean up enum fields - convert empty strings to undefined to avoid enum validation errors
  if (this.productScope && this.productScope.scope === '') {
    this.productScope.scope = undefined;
  }

  if (this.distributionType) {
    if (this.distributionType.type === '') {
      this.distributionType.type = undefined;
    }
    if (this.distributionType.coaCreator === '') {
      this.distributionType.coaCreator = undefined;
    }
    if (this.distributionType.labelingType === '') {
      this.distributionType.labelingType = undefined;
    }
    if (this.distributionType.labelingResponsibility === '') {
      this.distributionType.labelingResponsibility = undefined;
    }
  }

  // Normalize weight and volume units to lowercase (g, kg, mg, mL, L, etc.)
  if (this.skuVariants && Array.isArray(this.skuVariants)) {
    this.skuVariants.forEach(variant => {
      // Normalize packageSize unit (special case: mL, L need capital L)
      if (variant.packageSize && variant.packageSize.unit) {
        const packageUnit = variant.packageSize.unit;
        const lowerUnit = packageUnit.toLowerCase();

        // Map common variations to correct enum values
        if (lowerUnit === 'ml') {
          variant.packageSize.unit = 'mL';
        } else if (lowerUnit === 'l') {
          variant.packageSize.unit = 'L';
        } else {
          // For other units (g, kg, mg, EA, units, vials, plates, bulk), lowercase is fine
          variant.packageSize.unit = lowerUnit;
        }
      }
      // Normalize grossWeight unit
      if (variant.grossWeight && variant.grossWeight.unit) {
        variant.grossWeight.unit = variant.grossWeight.unit.toLowerCase();
      }
      // Normalize netWeight unit
      if (variant.netWeight && variant.netWeight.unit) {
        variant.netWeight.unit = variant.netWeight.unit.toLowerCase();
      }
      // Normalize volume unit (special case: mL, L, µL need capital L)
      if (variant.volume && variant.volume.unit) {
        const volumeUnit = variant.volume.unit;
        const lowerUnit = volumeUnit.toLowerCase();

        // Map common variations to correct enum values
        if (lowerUnit === 'ml') {
          variant.volume.unit = 'mL';
        } else if (lowerUnit === 'l') {
          variant.volume.unit = 'L';
        } else if (lowerUnit === 'µl') {
          variant.volume.unit = 'µL';
        } else if (lowerUnit === 'gal') {
          variant.volume.unit = 'gal';
        } else if (lowerUnit === 'fl oz') {
          variant.volume.unit = 'fl oz';
        }
        // Otherwise keep the original value
      }
    });
  }

  next();
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
    const year = new Date().getFullYear();
    let ticketNumber;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100;

    // Keep trying until we find a unique ticket number
    while (!isUnique && attempts < maxAttempts) {
      const count = await mongoose.model('ProductTicket').countDocuments();
      ticketNumber = `NPDI-${year}-${String(count + attempts + 1).padStart(4, '0')}`;

      // Check if this ticket number already exists
      const existingTicket = await mongoose.model('ProductTicket').findOne({ ticketNumber });

      if (!existingTicket) {
        isUnique = true;
        this.ticketNumber = ticketNumber;
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      return next(new Error('Unable to generate unique ticket number after multiple attempts'));
    }
  }
  next();
});

module.exports = mongoose.model('ProductTicket', productTicketSchema);