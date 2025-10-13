/**
 * Pricing Calculations Utility
 * Shared pricing calculation functions used across ticket creation and editing
 */

/**
 * Unit conversion factors for converting between package units and base units
 * @param {string} packageUnit - The package unit (e.g., 'mg', 'g', 'kg')
 * @param {string} baseUnit - The base unit for costing (e.g., 'g')
 * @returns {number} - Conversion factor
 */
export const getConversionFactor = (packageUnit, baseUnit) => {
  const conversions = {
    // Mass conversions
    'mg-g': 0.001,
    'g-mg': 1000,
    'g-kg': 0.001,
    'kg-g': 1000,
    'mg-kg': 0.000001,
    'kg-mg': 1000000,
    // Volume conversions
    'mL-L': 0.001,
    'L-mL': 1000,
    // Same units
    'g-g': 1,
    'kg-kg': 1,
    'mL-mL': 1,
    'L-L': 1,
    'mg-mg': 1,
    'units-units': 1,
    'vials-vials': 1,
    'plates-plates': 1,
    'bulk-bulk': 1,
    // Treat non-standard units as 1:1 equivalent
    'units-g': 1,
    'g-units': 1,
    'vials-g': 1,
    'g-vials': 1,
    'plates-g': 1,
    'g-plates': 1,
    'bulk-g': 1000, // Assume 1kg for bulk
    'g-bulk': 0.001
  };

  const key = `${packageUnit}-${baseUnit}`;
  return conversions[key] || 1;
};

/**
 * Unit conversion factors to grams (for internal calculations)
 * Used when baseUnit might not be grams
 * @param {string} unit - The unit to convert
 * @returns {number} - Conversion factor to grams
 */
export const getConversionToGrams = (unit) => {
  const conversions = {
    'mg': 0.001,
    'g': 1,
    'kg': 1000,
    'mL': 1, // Assuming density ~1 for liquids
    'L': 1000,
    'units': 1, // Treat as 1g equivalent
    'vials': 1, // Treat as 1g equivalent
    'plates': 1, // Treat as 1g equivalent
    'bulk': 1000 // Assume 1kg for bulk
  };

  return conversions[unit] || 1;
};

/**
 * Calculate list price from standard cost and target margin
 * Formula: List Price = Cost / (1 - margin%)
 * @param {number} standardCost - Total standard cost
 * @param {number} targetMarginPercent - Target margin as percentage (e.g., 50 for 50%)
 * @returns {Object} - Object with transferPrice and listPrice
 */
export const calculateListPrice = (standardCost, targetMarginPercent) => {
  if (!standardCost || !targetMarginPercent) {
    return { transferPrice: 0, listPrice: 0 };
  }

  const margin = parseFloat(targetMarginPercent) / 100;
  const transferPrice = parseFloat(standardCost) / (1 - margin);
  const listPrice = transferPrice / 0.56; // Historical multiplier for list price

  return {
    transferPrice: parseFloat(transferPrice.toFixed(2)),
    listPrice: parseFloat(listPrice.toFixed(2))
  };
};

/**
 * Calculate simplified list price (without transfer price step)
 * Formula: List Price = Cost / (1 - margin%)
 * @param {number} standardCost - Total standard cost
 * @param {number} targetMarginPercent - Target margin as percentage (e.g., 50 for 50%)
 * @returns {number} - List price rounded to 2 decimal places
 */
export const calculateListPriceSimple = (standardCost, targetMarginPercent) => {
  if (!standardCost || !targetMarginPercent) {
    return 0;
  }

  const margin = parseFloat(targetMarginPercent) / 100;
  const listPrice = parseFloat(standardCost) / (1 - margin);

  return Math.round(listPrice * 100) / 100;
};

/**
 * Calculate margin percentage from list price and cost
 * Formula: Margin% = ((ListPrice - Cost) / ListPrice) * 100
 * @param {number} listPrice - The list price
 * @param {number} calculatedCost - The calculated cost
 * @returns {number} - Margin percentage rounded to 1 decimal place
 */
export const calculateMarginPercent = (listPrice, calculatedCost) => {
  if (!listPrice || listPrice <= 0 || !calculatedCost) {
    return 0;
  }

  const margin = ((listPrice - calculatedCost) / listPrice) * 100;
  return Math.round(margin * 10) / 10; // Round to 1 decimal place
};

/**
 * Calculate total standard cost for a package
 * @param {number} packageSizeInBaseUnit - Package size converted to base unit
 * @param {number} rawCostPerUnit - Raw material cost per base unit
 * @param {number} packagingCost - Packaging cost per package
 * @param {number} laborOverheadCost - Labor and overhead cost per package
 * @param {boolean} isBulk - Whether this is a bulk SKU (no material cost)
 * @returns {number} - Total standard cost
 */
export const calculateTotalStandardCost = (
  packageSizeInBaseUnit,
  rawCostPerUnit,
  packagingCost,
  laborOverheadCost,
  isBulk = false
) => {
  // For BULK type, only use packaging and overhead (no material cost)
  if (isBulk) {
    return parseFloat(packagingCost || 0) + parseFloat(laborOverheadCost || 0);
  }

  // For standard types, calculate full cost
  const totalMaterialCost = packageSizeInBaseUnit * parseFloat(rawCostPerUnit || 0);
  const totalCost = totalMaterialCost + parseFloat(packagingCost || 0) + parseFloat(laborOverheadCost || 0);

  return totalCost;
};

/**
 * Calculate pricing for a single SKU variant
 * @param {Object} sku - SKU object with packageSize, type, and pricing data
 * @param {Object} pricingData - Pricing data with baseUnit, standardCosts, and targetMargin
 * @returns {Object} - Object with calculatedCost, listPrice, and marginPercent
 */
export const calculateSKUPricing = (sku, pricingData) => {
  if (!sku || !pricingData) {
    return { calculatedCost: 0, listPrice: 0, marginPercent: 0 };
  }

  const { packageSize, type } = sku;
  const { baseUnit, standardCosts, targetMargin } = pricingData;

  // Skip pricing calculation for VAR, SPEC, and CONF types
  if (['VAR', 'SPEC', 'CONF'].includes(type)) {
    return { calculatedCost: 0, listPrice: 0, marginPercent: 0 };
  }

  const packageSizeValue = parseFloat(packageSize?.value) || 0;
  const packageUnit = packageSize?.unit || baseUnit || 'g';

  if (!packageSizeValue || !standardCosts) {
    return { calculatedCost: 0, listPrice: 0, marginPercent: 0 };
  }

  // Extract costs
  const rawCostPerUnit = parseFloat(standardCosts.rawMaterialCostPerUnit) || 0.50;
  const packagingCost = parseFloat(standardCosts.packagingCost) || 2.50;
  const laborOverheadCost = parseFloat(standardCosts.laborOverheadCost) || 5.00;
  const targetMarginPercent = parseFloat(targetMargin) || 50;

  // Calculate package size in base unit
  const conversionFactor = getConversionFactor(packageUnit, baseUnit || 'g');
  const packageSizeInBaseUnit = packageSizeValue * conversionFactor;

  // Calculate total standard cost
  const isBulk = type === 'BULK';
  const totalStandardCost = calculateTotalStandardCost(
    packageSizeInBaseUnit,
    rawCostPerUnit,
    packagingCost,
    laborOverheadCost,
    isBulk
  );

  // Calculate list price
  const listPrice = calculateListPriceSimple(totalStandardCost, targetMarginPercent);

  return {
    calculatedCost: parseFloat(totalStandardCost.toFixed(2)),
    listPrice: listPrice,
    marginPercent: targetMarginPercent
  };
};

/**
 * Batch calculate pricing for all SKU variants
 * @param {Array} skuVariants - Array of SKU objects
 * @param {Object} pricingData - Pricing data with baseUnit, standardCosts, and targetMargin
 * @returns {Array} - Array of pricing results for each SKU
 */
export const calculateAllSKUPricing = (skuVariants, pricingData) => {
  if (!skuVariants || !Array.isArray(skuVariants) || !pricingData) {
    return [];
  }

  return skuVariants.map(sku => calculateSKUPricing(sku, pricingData));
};

/**
 * Validate pricing data
 * @param {Object} pricingData - Pricing data object
 * @returns {Object} - Object with isValid boolean and errors array
 */
export const validatePricingData = (pricingData) => {
  const errors = [];

  if (!pricingData) {
    errors.push('Pricing data is required');
    return { isValid: false, errors };
  }

  if (!pricingData.baseUnit) {
    errors.push('Base unit is required');
  }

  if (!pricingData.standardCosts) {
    errors.push('Standard costs are required');
  } else {
    const { rawMaterialCostPerUnit, packagingCost, laborOverheadCost } = pricingData.standardCosts;

    if (rawMaterialCostPerUnit === undefined || rawMaterialCostPerUnit === null) {
      errors.push('Raw material cost per unit is required');
    } else if (rawMaterialCostPerUnit < 0) {
      errors.push('Raw material cost per unit cannot be negative');
    }

    if (packagingCost === undefined || packagingCost === null) {
      errors.push('Packaging cost is required');
    } else if (packagingCost < 0) {
      errors.push('Packaging cost cannot be negative');
    }

    if (laborOverheadCost === undefined || laborOverheadCost === null) {
      errors.push('Labor and overhead cost is required');
    } else if (laborOverheadCost < 0) {
      errors.push('Labor and overhead cost cannot be negative');
    }
  }

  if (!pricingData.targetMargin) {
    errors.push('Target margin is required');
  } else if (pricingData.targetMargin < 0 || pricingData.targetMargin >= 100) {
    errors.push('Target margin must be between 0 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
