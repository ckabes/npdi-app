const ExcelJS = require('exceljs');
const path = require('path');

/**
 * PIF (Product Information Form) Export Service
 *
 * This service generates PIF Excel files by:
 * 1. Reading the template file (PIF_Example.xlsx)
 * 2. Populating row 7 with ticket data across multiple sheets
 * 3. Preserving all original formatting
 *
 * Structure:
 * - Row 1: Technical field names (hidden)
 * - Row 5: Section headers (yellow background)
 * - Row 6: Field labels
 * - Row 7: Data values (populated from ticket)
 *
 * To modify data mappings:
 * - Edit the GENERAL_MAPPING, PRODUCT_MAPPING, or MATERIAL_MAPPING objects below
 */

// ============================================================================
// DATA MAPPING CONFIGURATION
// ============================================================================

/**
 * GENERAL SHEET MAPPINGS
 * Maps ticket fields to General sheet columns (Row 7)
 */
const GENERAL_MAPPING = {
  // Column B: Initiator Name (PMOps person exporting)
  2: (ticket, currentUser) => currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',

  // Column C: Initiator email address (PMOps person exporting)
  3: (ticket, currentUser) => currentUser ? currentUser.email : '',

  // Column D: Product Owner Name (Product Manager who submitted)
  4: (ticket) => {
    // Try to get name from status history
    const createEntry = ticket.statusHistory?.find(h => h.action === 'TICKET_CREATED');
    if (createEntry?.userInfo) {
      return `${createEntry.userInfo.firstName} ${createEntry.userInfo.lastName}`;
    }
    return ticket.createdBy || '';
  },

  // Column E: Product Owner email address
  5: (ticket) => ticket.createdBy || '',

  // Column F: Launch Date
  6: (ticket) => {
    if (ticket.launchTimeline?.targetLaunchDate) {
      const date = new Date(ticket.launchTimeline.targetLaunchDate);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    return '';
  },

  // Column H: NPDI ID
  8: (ticket) => ticket.ticketNumber || '',

  // Column T: Production Plant
  20: (ticket) => ticket.primaryPlant || '',

  // Column W: Procurement Type
  23: (ticket) => ticket.productionType || 'Produced'
};

/**
 * PRODUCT SHEET MAPPINGS
 * Maps ticket fields to Product sheet columns (Row 7)
 */
const PRODUCT_MAPPING = {
  // Column B: Material Number
  2: (ticket) => ticket.partNumber?.baseNumber || ticket.ticketNumber || '',

  // Column C: Product Number
  3: (ticket) => ticket.partNumber?.baseNumber || ticket.ticketNumber || '',

  // Column D: Product Name
  4: (ticket) => ticket.productName || '',

  // Column E: Division Brand
  5: (ticket) => ticket.brand || '',

  // Column F: Label Name
  6: (ticket) => ticket.productName || '',

  // Column G: Product Type
  7: (ticket) => {
    // Try to infer product type from production type
    return ticket.productionType === 'Produced' ? 'Chemical' : 'Equipment';
  },

  // Column H: Country Of Origin
  8: (ticket) => ticket.countryOfOrigin || '',

  // Column I: Country Of Manufacture
  9: (ticket) => ticket.countryOfOrigin || '',

  // Column P: Intended Use
  16: (ticket) => {
    const apps = ticket.corpbaseData?.applications;
    if (Array.isArray(apps) && apps.length > 0) {
      return apps[0];
    }
    return 'Manufacturing';
  },

  // Column Q: Application Notes
  17: (ticket) => {
    const apps = ticket.corpbaseData?.applications;
    if (Array.isArray(apps)) {
      return apps.join(', ');
    }
    return apps || '';
  },

  // Column Y: State of Matter
  25: (ticket) => ticket.chemicalProperties?.physicalState || '',

  // Column AB: Colour
  28: (ticket) => '',

  // Column AC: Density
  29: (ticket) => ticket.chemicalProperties?.additionalProperties?.density || '',

  // Column AD: Melting Point
  30: (ticket) => ticket.chemicalProperties?.additionalProperties?.meltingPoint || '',

  // Column AE: Boiling Point
  31: (ticket) => ticket.chemicalProperties?.additionalProperties?.boilingPoint || '',

  // Column AG: Flash Point
  33: (ticket) => ticket.chemicalProperties?.additionalProperties?.flashPoint || '',

  // Column AJ: pH value
  36: (ticket) => '',

  // Column AL: Storage Temperature Range
  38: (ticket) => ticket.chemicalProperties?.storageTemperature || '',

  // Column AM: Shipping Condition
  39: (ticket) => ticket.chemicalProperties?.shippingConditions || '',

  // Column BF: Additional Comments on Product
  58: (ticket) => ticket.corpbaseData?.productDescription || '',

  // Column CN: Origin of Substance
  92: (ticket) => ticket.chemicalProperties?.materialSource || '',

  // Column CO: Substance Name
  93: (ticket) => ticket.productName || '',

  // Column CP: IUPAC Name
  94: (ticket) => ticket.chemicalProperties?.iupacName || '',

  // Column CR: CAS Number
  96: (ticket) => ticket.chemicalProperties?.casNumber || '',

  // Column CV: InChi Code
  100: (ticket) => ticket.chemicalProperties?.inchi || '',

  // Column CW: SMILES Code
  101: (ticket) => ticket.chemicalProperties?.canonicalSMILES || ticket.chemicalProperties?.isomericSMILES || '',

  // Column CX: Molecular Formula
  102: (ticket) => ticket.chemicalProperties?.molecularFormula || '',

  // Column CY: State of Matter2
  103: (ticket) => ticket.chemicalProperties?.physicalState || '',

  // Column DA: Molecular Weight
  105: (ticket) => ticket.chemicalProperties?.molecularWeight || '',

  // Column DG: Plant Genus/Species
  111: (ticket) => {
    if (ticket.chemicalProperties?.materialSource === 'Plant') {
      return ticket.chemicalProperties?.materialSource;
    }
    return '';
  }
};

/**
 * MATERIAL SHEET MAPPINGS
 * Maps ticket fields to Material sheet columns (Row 7)
 * Note: This represents composition components (substances in the mixture)
 */
const MATERIAL_MAPPING = {
  // Column A: Material Number
  1: (ticket, component) => component?.componentCAS || '',

  // Column B: Product Number
  2: (ticket, component) => ticket.partNumber?.baseNumber || ticket.ticketNumber || '',

  // Column C: Product Name
  3: (ticket, component) => ticket.productName || '',

  // Column D: Material Name (component name)
  4: (ticket, component) => component?.componentName || '',

  // Column E: SAP Material Number
  5: (ticket, component) => component?.componentCAS || '',

  // Column F: Supplier Material Number
  6: (ticket, component) => component?.componentCAS || '',

  // Column L: Net Weight (weight percent from composition)
  12: (ticket, component) => {
    if (component?.weightPercent) {
      return `${component.weightPercent}%`;
    }
    return '';
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely get value from ticket using mapping function
 */
const getTicketValue = (ticket, colNum, mapping, currentUser = null, sku = null) => {
  const mapper = mapping[colNum];
  if (!mapper) return null;

  try {
    const value = mapper(ticket, currentUser || sku);
    return value !== undefined && value !== null ? value : '';
  } catch (error) {
    console.error(`Error mapping column ${colNum}:`, error);
    return '';
  }
};

/**
 * Clear all data from a row while preserving formatting
 */
const clearRow = (worksheet, rowNum) => {
  const row = worksheet.getRow(rowNum);
  for (let col = 1; col <= worksheet.columnCount; col++) {
    const cell = row.getCell(col);
    cell.value = null; // Clear value but keep formatting
  }
};

/**
 * Format date to Excel date serial number
 */
const formatDateForExcel = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Excel date serial number (days since 1900-01-01)
  const excelEpoch = new Date(1899, 11, 30);
  const daysSinceEpoch = (date - excelEpoch) / (1000 * 60 * 60 * 24);
  return daysSinceEpoch;
};

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Generate PIF workbook from ticket data
 *
 * @param {Object} ticket - The product ticket object
 * @param {Object} currentUser - The current user exporting (PMOps)
 * @returns {Promise<ExcelJS.Workbook>} The populated workbook
 */
const generatePIF = async (ticket, currentUser) => {
  // Load the template file
  const templatePath = path.join(__dirname, '../../PIF_Example.xlsx');
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile(templatePath);
  } catch (error) {
    throw new Error(`Failed to load PIF template: ${error.message}`);
  }

  // ========================================
  // POPULATE GENERAL SHEET
  // ========================================
  const generalSheet = workbook.getWorksheet('General');
  if (generalSheet) {
    // Clear row 7 to remove example data
    clearRow(generalSheet, 7);

    const generalRow = generalSheet.getRow(7);

    Object.keys(GENERAL_MAPPING).forEach(colNum => {
      const col = parseInt(colNum);
      const value = getTicketValue(ticket, col, GENERAL_MAPPING, currentUser);

      if (value !== null && value !== '') {
        const cell = generalRow.getCell(col);

        // Special handling for dates
        if (col === 6 && value) { // Launch Date column
          cell.value = new Date(value);
        } else {
          cell.value = value;
        }
      }
    });
  }

  // ========================================
  // POPULATE PRODUCT SHEET
  // ========================================
  const productSheet = workbook.getWorksheet('Product');
  if (productSheet) {
    // Clear rows 7-20 to remove all example data (multiple substances)
    for (let row = 7; row <= 20; row++) {
      clearRow(productSheet, row);
    }

    const productRow = productSheet.getRow(7);

    Object.keys(PRODUCT_MAPPING).forEach(colNum => {
      const col = parseInt(colNum);
      const value = getTicketValue(ticket, col, PRODUCT_MAPPING);

      if (value !== null && value !== '') {
        const cell = productRow.getCell(col);
        cell.value = value;
      }
    });
  }

  // ========================================
  // POPULATE MATERIAL SHEET
  // ========================================
  const materialSheet = workbook.getWorksheet('Material');
  if (materialSheet) {
    // Clear rows 7-20 to remove all example data (multiple materials/components)
    for (let row = 7; row <= 20; row++) {
      clearRow(materialSheet, row);
    }

    // Populate with composition components (substances in the mixture)
    if (ticket.composition?.components && ticket.composition.components.length > 0) {
      // Populate each composition component in separate rows starting from row 7
      ticket.composition.components.forEach((component, index) => {
        const rowNum = 7 + index;
        const materialRow = materialSheet.getRow(rowNum);

        Object.keys(MATERIAL_MAPPING).forEach(colNum => {
          const col = parseInt(colNum);
          const value = getTicketValue(ticket, col, MATERIAL_MAPPING, null, component);

          if (value !== null && value !== '') {
            const cell = materialRow.getCell(col);
            cell.value = value;
          }
        });
      });
    }
  }

  return workbook;
};

module.exports = {
  generatePIF
};
