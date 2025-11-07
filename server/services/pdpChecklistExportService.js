const ExcelJS = require('exceljs');
const path = require('path');

/**
 * PDP Checklist Export Service
 *
 * This service generates PDP Checklist Excel files by:
 * 1. Reading the template file (PDP Checklist.xlsx)
 * 2. Populating column O with ticket data
 * 3. Preserving all original formatting
 *
 * To modify data mappings:
 * - Edit the DATA_MAPPING object below
 * - Update the populateTicketData function
 */

// ============================================================================
// DATA MAPPING CONFIGURATION
// Maps ticket fields to PDP Checklist rows (Column O)
// ============================================================================

const DATA_MAPPING = {
  // Row 3: CorpBase Product Number
  3: (ticket) => ticket.partNumber?.baseNumber || ticket.ticketNumber || '',

  // Row 4: CorpBase Brand
  4: (ticket) => ticket.brand || '',

  // Row 10: Primary name
  10: (ticket) => ticket.productName || '',

  // Row 11: Name suffix (constructed from chemical properties)
  11: (ticket) => {
    const props = [];
    const chem = ticket.chemicalProperties || {};

    if (chem.physicalState) props.push(chem.physicalState.toLowerCase());
    if (chem.molecularFormula) props.push(chem.molecularFormula);

    return props.join(', ');
  },

  // Row 12: Synonyms
  12: (ticket) => {
    const synonyms = ticket.chemicalProperties?.synonyms || [];
    return synonyms.join(', ');
  },

  // Row 15: Assay/Purity
  15: (ticket) => {
    const quality = ticket.quality;
    if (quality?.mqQualityLevel && quality.mqQualityLevel !== 'N/A') {
      return quality.mqQualityLevel;
    }
    return '';
  },

  // Row 16: form (physical state)
  16: (ticket) => {
    const state = ticket.chemicalProperties?.physicalState;
    return state ? state.toLowerCase() : '';
  },

  // Row 21: boiling point
  21: (ticket) => {
    const bp = ticket.chemicalProperties?.additionalProperties?.boilingPoint;
    return bp || '';
  },

  // Row 23: density
  23: (ticket) => {
    const density = ticket.chemicalProperties?.additionalProperties?.density;
    return density || '';
  },

  // Row 25: InChI
  25: (ticket) => ticket.chemicalProperties?.inchi || '',

  // Row 26: InChI key
  26: (ticket) => ticket.chemicalProperties?.inchiKey || '',

  // Row 27: melting point
  27: (ticket) => {
    const mp = ticket.chemicalProperties?.additionalProperties?.meltingPoint;
    return mp || '';
  },

  // Row 28: packaging
  28: (ticket) => {
    if (!ticket.skuVariants || ticket.skuVariants.length === 0) return '';

    const packages = ticket.skuVariants.map(sku => {
      if (sku.packageSize) {
        return `${sku.packageSize.value}${sku.packageSize.unit}`;
      }
      return '';
    }).filter(p => p);

    return packages.join(', ');
  },

  // Row 29: refractive index
  29: (ticket) => {
    const ri = ticket.chemicalProperties?.additionalProperties?.refractiveIndex;
    return ri || '';
  },

  // Row 30: SMILES string
  30: (ticket) => ticket.chemicalProperties?.canonicalSMILES || ticket.chemicalProperties?.isomericSMILES || '',

  // Row 31: storage temp
  31: (ticket) => ticket.chemicalProperties?.storageTemperature || '',

  // Row 39: product line
  39: (ticket) => ticket.productLine || '',

  // Row 41: product type
  41: (ticket) => ticket.productionType || '',

  // Row 48: UNSPSC Code (if available in ticket)
  48: (ticket) => '', // Not in current ticket model

  // Row 54: Pack size (detailed)
  54: (ticket) => {
    if (!ticket.skuVariants || ticket.skuVariants.length === 0) return '';

    const packages = ticket.skuVariants.map(sku => {
      if (sku.packageSize && sku.description) {
        return `${sku.packageSize.value}${sku.packageSize.unit} ${sku.description}`;
      } else if (sku.packageSize) {
        return `${sku.packageSize.value}${sku.packageSize.unit}`;
      }
      return '';
    }).filter(p => p);

    return packages.join(', ');
  },

  // Row 56: General Description
  56: (ticket) => ticket.corpbaseData?.productDescription || '',

  // Row 57: Application
  57: (ticket) => {
    const apps = ticket.corpbaseData?.applications || [];
    if (Array.isArray(apps)) {
      return apps.join('\n\n');
    }
    return apps || '';
  },

  // Row 59: Packaging description
  59: (ticket) => {
    // Construct packaging description from SKU variants
    if (!ticket.skuVariants || ticket.skuVariants.length === 0) return '';

    const packages = ticket.skuVariants.map(sku => {
      if (sku.packageSize) {
        return `${sku.packageSize.value}${sku.packageSize.unit} container`;
      }
      return '';
    }).filter(p => p);

    if (packages.length > 0) {
      return `${packages.join(' and ')} packaged in glass bottles.`;
    }
    return '';
  },

  // Row 69: Keywords
  69: (ticket) => {
    const keywords = [];

    // Add CAS number
    if (ticket.chemicalProperties?.casNumber) {
      keywords.push(ticket.chemicalProperties.casNumber);
    }

    // Add molecular formula
    if (ticket.chemicalProperties?.molecularFormula) {
      keywords.push(ticket.chemicalProperties.molecularFormula);
    }

    // Add IUPAC name
    if (ticket.chemicalProperties?.iupacName) {
      keywords.push(ticket.chemicalProperties.iupacName);
    }

    return keywords.join(', ');
  },

  // Row 70: Meta title
  70: (ticket) => {
    const parts = [];

    if (ticket.productName) parts.push(ticket.productName);
    if (ticket.chemicalProperties?.casNumber) parts.push(`CAS ${ticket.chemicalProperties.casNumber}`);
    if (ticket.brand) parts.push(ticket.brand);

    return parts.join(' | ');
  },

  // Row 71: Meta description
  71: (ticket) => ticket.corpbaseData?.metaDescription || ticket.corpbaseData?.productDescription?.substring(0, 160) || '',

  // Row 73: Call to Action
  73: (ticket) => 'Request Information',

  // Row 74: Legacy Legal Entity
  74: (ticket) => ticket.brand || 'Merck/Sigma-Aldrich'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely get value from ticket using mapping function
 */
const getTicketValue = (ticket, rowNum) => {
  const mapper = DATA_MAPPING[rowNum];
  if (!mapper) return null;

  try {
    const value = mapper(ticket);
    return value !== undefined && value !== null ? value : '';
  } catch (error) {
    console.error(`Error mapping row ${rowNum}:`, error);
    return '';
  }
};

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Generate PDP Checklist workbook from ticket data
 *
 * @param {Object} ticket - The product ticket object
 * @returns {Promise<ExcelJS.Workbook>} The populated workbook
 */
const generatePDPChecklist = async (ticket) => {
  // Load the template file
  const templatePath = path.join(__dirname, '../../PDP Checklist.xlsx');
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile(templatePath);
  } catch (error) {
    throw new Error(`Failed to load PDP Checklist template: ${error.message}`);
  }

  // Get the main PDP Checklist worksheet
  const worksheet = workbook.getWorksheet('PDP Checklist');

  if (!worksheet) {
    throw new Error('PDP Checklist worksheet not found in template');
  }

  // Populate Column O with ticket data
  // Column O is column 15
  Object.keys(DATA_MAPPING).forEach(rowNum => {
    const row = parseInt(rowNum);
    const value = getTicketValue(ticket, row);

    if (value !== null && value !== '') {
      const cell = worksheet.getRow(row).getCell(15); // Column O = 15
      cell.value = value;

      // Preserve existing cell formatting
      // The template already has the right formatting, we just update the value
    }
  });

  return workbook;
};

module.exports = {
  generatePDPChecklist
};
