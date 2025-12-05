/**
 * Enum Cleaner Utility
 * Handles cleaning of empty string enum values to prevent Mongoose validation errors
 * Consolidates duplicate enum cleaning logic from create, update, and saveDraft operations
 */

/**
 * Clean empty enum values from an object by deleting empty string properties
 * @param {Object} obj - Object to clean
 * @param {Array<string>} fields - Array of field names to check and clean
 */
const cleanEnumFields = (obj, fields) => {
  if (!obj) return;

  fields.forEach(field => {
    if (obj[field] === '' || obj[field] === null) {
      delete obj[field];
    }
  });
};

/**
 * Clean chemical properties enum fields
 * @param {Object} chemicalProperties - Chemical properties object
 */
const cleanChemicalPropertiesEnums = (chemicalProperties) => {
  if (!chemicalProperties) return;

  // Clean physical state
  if (chemicalProperties.physicalState === '' || chemicalProperties.physicalState === null) {
    delete chemicalProperties.physicalState;
  }

  // Clean shipping conditions (though usually has a default)
  if (chemicalProperties.shippingConditions === '') {
    delete chemicalProperties.shippingConditions;
  }

  // Clean material source
  if (chemicalProperties.materialSource === '' || chemicalProperties.materialSource === null) {
    delete chemicalProperties.materialSource;
  }

  // Clean animal component
  if (chemicalProperties.animalComponent === '' || chemicalProperties.animalComponent === null) {
    delete chemicalProperties.animalComponent;
  }

  // Clean storage temperature
  if (chemicalProperties.storageTemperature === '' || chemicalProperties.storageTemperature === null) {
    delete chemicalProperties.storageTemperature;
  }

  // Clean CAS number if it has dropdown artifacts
  if (chemicalProperties.casNumber && chemicalProperties.casNumber.includes('_')) {
    chemicalProperties.casNumber = chemicalProperties.casNumber.split('_')[0];
  }
};

/**
 * Clean hazard classification enum fields
 * @param {Object} hazardClassification - Hazard classification object
 */
const cleanHazardClassificationEnums = (hazardClassification) => {
  if (!hazardClassification) return;

  const enumFields = ['ghsClass', 'signalWord', 'transportClass', 'unNumber'];
  cleanEnumFields(hazardClassification, enumFields);
};

/**
 * Clean main ticket enum fields
 * @param {Object} ticketData - Ticket data object
 */
const cleanTicketEnums = (ticketData) => {
  if (!ticketData) return;

  const mainEnumFields = [
    'sbu',
    'status',
    'priority',
    'productionType',
    'brand',
    'countryOfOrigin',
    'distributionType'
  ];
  cleanEnumFields(ticketData, mainEnumFields);

  // Clean nested productScope enum
  if (ticketData.productScope && ticketData.productScope.scope === '') {
    delete ticketData.productScope.scope;
  }

  // Clean nested retestOrExpiration enum
  if (ticketData.retestOrExpiration) {
    if (ticketData.retestOrExpiration.type === '') {
      delete ticketData.retestOrExpiration.type;
    }
    if (ticketData.retestOrExpiration.shelfLife) {
      if (ticketData.retestOrExpiration.shelfLife.unit === '') {
        delete ticketData.retestOrExpiration.shelfLife.unit;
      }
    }
  }
};

/**
 * Clean SKU variants enum fields and provide defaults
 * @param {Array} skuVariants - Array of SKU variant objects
 */
const cleanSKUVariantsEnums = (skuVariants) => {
  if (!skuVariants || !Array.isArray(skuVariants)) return;

  skuVariants.forEach(sku => {
    // Provide default type if missing or empty
    if (!sku.type || sku.type === '') {
      sku.type = 'PREPACK';
    }

    // Ensure packageSize exists and has valid unit
    if (!sku.packageSize) {
      sku.packageSize = { value: 100, unit: 'g' };
    } else {
      if (!sku.packageSize.unit || sku.packageSize.unit === '') {
        sku.packageSize.unit = 'g';
      }
      if (!sku.packageSize.value) {
        sku.packageSize.value = 100;
      }
    }

    // Ensure pricing exists
    if (!sku.pricing) {
      sku.pricing = { listPrice: 0, currency: 'USD' };
    } else {
      if (!sku.pricing.currency || sku.pricing.currency === '') {
        sku.pricing.currency = 'USD';
      }
    }
  });
};

/**
 * Transform string arrays to actual arrays for corpbaseData
 * Handles textarea inputs that come as newline-separated strings
 * @param {Object} corpbaseData - CorpBase data object
 */
const cleanCorpBaseDataArrays = (corpbaseData) => {
  if (!corpbaseData) return;

  // Transform keyFeatures from string to array
  if (typeof corpbaseData.keyFeatures === 'string' && corpbaseData.keyFeatures) {
    corpbaseData.keyFeatures = corpbaseData.keyFeatures
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);
  }

  // Transform applications from string to array
  if (typeof corpbaseData.applications === 'string' && corpbaseData.applications) {
    corpbaseData.applications = corpbaseData.applications
      .split('\n')
      .map(a => a.trim())
      .filter(a => a.length > 0);
  }
};

/**
 * Transform chemical properties textarea fields to arrays
 * Handles synonyms and hazard statements that come as comma/newline-separated strings
 * @param {Object} chemicalProperties - Chemical properties object
 */
const cleanChemicalPropertiesArrays = (chemicalProperties) => {
  if (!chemicalProperties) return;

  // Transform synonyms from string to array
  if (typeof chemicalProperties.synonyms === 'string' && chemicalProperties.synonyms) {
    chemicalProperties.synonyms = chemicalProperties.synonyms
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  // Transform hazard statements from string to array
  if (typeof chemicalProperties.hazardStatements === 'string' && chemicalProperties.hazardStatements) {
    chemicalProperties.hazardStatements = chemicalProperties.hazardStatements
      .split('\n')
      .map(h => h.trim())
      .filter(h => h.length > 0);
  }
};

/**
 * Clean all ticket data enum fields and arrays
 * Main function to be called before saving/updating tickets
 * @param {Object} ticketData - Complete ticket data object
 * @returns {Object} - Cleaned ticket data object
 */
const cleanTicketData = (ticketData) => {
  if (!ticketData) return ticketData;

  // Clean main ticket enums
  cleanTicketEnums(ticketData);

  // Clean chemical properties
  if (ticketData.chemicalProperties) {
    cleanChemicalPropertiesEnums(ticketData.chemicalProperties);
    cleanChemicalPropertiesArrays(ticketData.chemicalProperties);
  }

  // Clean hazard classification
  if (ticketData.hazardClassification) {
    cleanHazardClassificationEnums(ticketData.hazardClassification);
  }

  // Clean SKU variants
  if (ticketData.skuVariants) {
    cleanSKUVariantsEnums(ticketData.skuVariants);
  }

  // Clean corpbase data
  if (ticketData.corpbaseData) {
    cleanCorpBaseDataArrays(ticketData.corpbaseData);
  }

  return ticketData;
};

/**
 * Ensure SKU variants has at least one default entry
 * Used for tickets that don't have any SKU variants defined
 * @param {Object} ticketData - Ticket data object
 * @returns {Object} - Ticket data with default SKU if needed
 */
const ensureDefaultSKU = (ticketData) => {
  if (!ticketData) return ticketData;

  if (!ticketData.skuVariants || ticketData.skuVariants.length === 0) {
    ticketData.skuVariants = [{
      type: 'PREPACK',
      sku: '',
      packageSize: { value: 100, unit: 'g' },
      pricing: { listPrice: 0, currency: 'USD' }
    }];
  }

  return ticketData;
};

/**
 * Set default SBU if not provided
 * @param {Object} ticketData - Ticket data object
 * @param {string} defaultSBU - Default SBU value (default: 'P90')
 * @returns {Object} - Ticket data with SBU set
 */
const ensureDefaultSBU = (ticketData, defaultSBU = 'P90') => {
  if (!ticketData) return ticketData;

  if (!ticketData.sbu || ticketData.sbu === '') {
    ticketData.sbu = defaultSBU;
  }

  return ticketData;
};

// Export only the public API - internal helper functions are private
module.exports = {
  cleanTicketData,
  ensureDefaultSKU,
  ensureDefaultSBU
};
