/**
 * Quality Specification Natural Language Parser
 *
 * Parses natural language quality specifications into structured data
 *
 * Supported formats:
 * - "Purity ≥99.9% by GC" → { testAttribute: "Purity", valueRange: "≥99.9%", comments: "GC" }
 * - "pH 6.5-7.5" → { testAttribute: "pH", valueRange: "6.5-7.5", comments: "" }
 * - "Appearance: White powder" → { testAttribute: "Appearance", valueRange: "White powder", comments: "" }
 * - "Moisture ≤0.5% by Karl Fischer" → { testAttribute: "Moisture", valueRange: "≤0.5%", comments: "Karl Fischer" }
 */

import { parserConfigService } from '../services/parserConfigService';

// Module-level cache for parser configuration
let configCache = {
  testAttributes: {},
  testMethods: {},
  defaultMethods: {},
  loaded: false
};

/**
 * Initialize parser with configuration from database
 * This should be called once on app startup
 */
export async function initializeParser() {
  try {
    const [testAttributes, testMethods, defaultMethods] = await Promise.all([
      parserConfigService.getLookupTable('testAttribute'),
      parserConfigService.getLookupTable('testMethod'),
      parserConfigService.getLookupTable('defaultMethod')
    ]);

    configCache.testAttributes = testAttributes;
    configCache.testMethods = testMethods;
    configCache.defaultMethods = defaultMethods;
    configCache.loaded = true;

    console.log('Parser initialized with database configuration');
  } catch (error) {
    console.error('Failed to initialize parser configuration:', error);
    // Keep using fallback hard-coded values
  }
}

// Auto-initialize on first import (lazy loading)
initializeParser().catch(err => console.warn('Parser auto-initialization failed:', err));

/**
 * Parse a single quality specification line
 * @param {string} text - Natural language specification
 * @returns {Object|null} Parsed specification or null if unparseable
 */
export function parseQualitySpec(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Trim and skip empty lines
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  let parsedResult = null;

  // Pattern 1a: "Conforms to/Confirms/Matches [Test] by [Method]"
  // Examples: "Conforms to structure by 1H NMR", "Confirms identity by IR"
  const pattern1a = /^(conforms?\s+to|confirms?|matches?)\s+(.+?)\s+(?:by|via|using)\s+(.+)$/i;
  let match = trimmed.match(pattern1a);

  if (match) {
    const verb = match[1].trim();
    const testAttribute = match[2].trim();
    const method = match[3].trim();

    // Normalize the verb to a standard form
    let valueRange = 'Conforms';
    if (verb.toLowerCase().startsWith('confirm')) {
      valueRange = 'Confirms';
    } else if (verb.toLowerCase().startsWith('match')) {
      valueRange = 'Matches';
    }

    parsedResult = {
      testAttribute: testAttribute,
      valueRange: valueRange,
      comments: method,
      dataSource: 'QC'
    };
  }

  // Pattern 1b: "Conforms to/Confirms/Matches [Test]" (no method)
  if (!parsedResult) {
    const pattern1b = /^(conforms?\s+to|confirms?|matches?)\s+(.+)$/i;
    match = trimmed.match(pattern1b);

    if (match) {
      const verb = match[1].trim();
      const testAttribute = match[2].trim();

      let valueRange = 'Conforms';
      if (verb.toLowerCase().startsWith('confirm')) {
        valueRange = 'Confirms';
      } else if (verb.toLowerCase().startsWith('match')) {
        valueRange = 'Matches';
      }

      parsedResult = {
        testAttribute: testAttribute,
        valueRange: valueRange,
        comments: '',
        dataSource: 'QC'
      };
    }
  }

  // Pattern 2: "Test ≥/≤/>/</= Value by/via/using Method" (no "of")
  // Examples: "Purity ≥99.9% by GC", "Moisture ≤0.5% via Karl Fischer"
  // Note: Skip if test attribute ends with " of" (should be handled by Pattern 2a)
  if (!parsedResult) {
    const pattern2 = /^([^≥≤><=%]+?)\s*(?:is|was|must\s+be|should\s+be)?\s*(≥|≤|>|<|=|>=|<=)\s*([^by\s][^\s]*(?:\s+[^\s]+)*?)\s*(?:by|via|using|with|\()\s*(.+?)(?:\)|$)/i;
    match = trimmed.match(pattern2);

    if (match) {
      const testAttr = match[1].trim();
      // Skip if test attribute ends with "of" (should be handled by "of" patterns)
      if (!testAttr.toLowerCase().endsWith(' of')) {
        parsedResult = {
          testAttribute: testAttr,
          valueRange: `${match[2]}${match[3].trim()}`,
          comments: match[4].trim(),
          dataSource: 'QC'
        };
      }
    }
  }

  // Pattern 2: "Test ≥/≤/>/</= Value" (no method, no "of")
  // Examples: "Purity ≥99.9%", "pH >5", "Water content is ≤50 ppm"
  // Note: Skip if test attribute ends with " of" or value contains "by/via/using" (handled by other patterns)
  if (!parsedResult) {
    const pattern2 = /^([^≥≤><=%]+?)\s*(?:is|was|must\s+be|should\s+be)?\s*(≥|≤|>|<|=|>=|<=)\s*(.+)$/i;
    match = trimmed.match(pattern2);

    if (match) {
      const testAttr = match[1].trim();
      const value = match[3].trim();
      // Skip if test attribute ends with "of" or value contains method keywords
      if (!testAttr.toLowerCase().endsWith(' of') && !/\s+(by|via|using)\s+/i.test(value)) {
        parsedResult = {
          testAttribute: testAttr,
          valueRange: `${match[2]}${value}`,
          comments: '',
          dataSource: 'QC'
        };
      }
    }
  }

  // Pattern 2a: "Test of Value by Method"
  // Examples: "Purity of 99.8% by 1H NMR", "Content of 98-102% by HPLC"
  if (!parsedResult) {
    const pattern2a = /^(.+?)\s+of\s+(.+?)\s+(?:by|via|using)\s+(.+)$/i;
    match = trimmed.match(pattern2a);

    if (match) {
      parsedResult = {
        testAttribute: match[1].trim(),
        valueRange: match[2].trim(),
        comments: match[3].trim(),
        dataSource: 'QC'
      };
    }
  }

  // Pattern 2b: "Test of Value" (with optional method)
  // Examples: "Purity of 99.8%", "water content of 50 ppm", "purity of 99% by hplc"
  if (!parsedResult) {
    const pattern2b = /^(.+?)\s+of\s+(.+)$/i;
    match = trimmed.match(pattern2b);

    if (match) {
      const testAttr = match[1].trim();
      const valueAndMethod = match[2].trim();

      // Check if value contains "by/via/using" to separate method
      const methodMatch = valueAndMethod.match(/^(.+?)\s+(?:by|via|using)\s+(.+)$/i);

      if (methodMatch) {
        parsedResult = {
          testAttribute: testAttr,
          valueRange: methodMatch[1].trim(),
          comments: methodMatch[2].trim(),
          dataSource: 'QC'
        };
      } else {
        parsedResult = {
          testAttribute: testAttr,
          valueRange: valueAndMethod,
          comments: '',
          dataSource: 'QC'
        };
      }
    }
  }

  // Pattern 3: "Test: Value" or "Test - Value"
  // Examples: "Appearance: White powder", "Color - Clear"
  // Note: Avoid matching numeric ranges like "6.5-7.5" by using negative lookahead
  if (!parsedResult) {
    const pattern3 = /^([^::\-]+?)(?:\s*[:：]\s*|\s+\-\s+(?!\d))(.+)$/;
    match = trimmed.match(pattern3);

    if (match) {
      const testAttribute = match[1].trim();
      const value = match[2].trim();

      // Check if value contains method indicators
      const methodMatch = value.match(/^(.+?)\s+(?:by|via|using|with|\()\s*(.+?)(?:\)|$)/i);

      if (methodMatch) {
        parsedResult = {
          testAttribute,
          valueRange: methodMatch[1].trim(),
          comments: methodMatch[2].trim(),
          dataSource: 'QC'
        };
      } else {
        parsedResult = {
          testAttribute,
          valueRange: value,
          comments: '',
          dataSource: 'QC'
        };
      }
    }
  }

  // Pattern 4: "Test Value-Value" (range)
  // Examples: "pH 6.5-7.5", "Assay 98.0-102.0%", "Melting point is 100-102°C"
  if (!parsedResult) {
    const pattern4 = /^([^0-9]+?)\s*(?:is|was|must\s+be|should\s+be)?\s*(\d+\.?\d*\s*-\s*\d+\.?\d*\s*[°℃%]?[CF]?)(?:\s+(?:by|via|using|\()\s*(.+?)(?:\)|$))?/i;
    match = trimmed.match(pattern4);

    if (match) {
      parsedResult = {
        testAttribute: match[1].trim(),
        valueRange: match[2].trim(),
        comments: match[3] ? match[3].trim() : '',
        dataSource: 'QC'
      };
    }
  }

  // Pattern 5: "Test is/are/was/were Value" format (with optional method)
  // Examples: "Appearance is clear", "Color is white", "structure is Conforms by 1HNMR"
  if (!parsedResult) {
    const pattern5 = /^([A-Za-z\s]+?)\s+(?:is|are|was|were)\s+(.+)$/i;
    match = trimmed.match(pattern5);

    if (match) {
      const testAttr = match[1].trim();
      const valueAndMethod = match[2].trim();

      // Check if value contains "by/via/using" to separate method
      const methodMatch = valueAndMethod.match(/^(.+?)\s+(?:by|via|using)\s+(.+)$/i);

      if (methodMatch) {
        parsedResult = {
          testAttribute: testAttr,
          valueRange: methodMatch[1].trim(),
          comments: methodMatch[2].trim(),
          dataSource: 'QC'
        };
      } else {
        parsedResult = {
          testAttribute: testAttr,
          valueRange: valueAndMethod,
          comments: '',
          dataSource: 'QC'
        };
      }
    }
  }

  // Pattern 6: Simple "Test Value" format (no connector, with optional method)
  // Examples: "Solubility Soluble in water", "Form Powder", "structure Conforms by 1HNMR"
  if (!parsedResult) {
    const pattern6 = /^([A-Za-z\s]+?)\s+([A-Za-z].+)$/;
    match = trimmed.match(pattern6);

    if (match) {
      const testAttr = match[1].trim();
      const valueAndMethod = match[2].trim();

      // Check if value contains "by/via/using" to separate method
      const methodMatch = valueAndMethod.match(/^(.+?)\s+(?:by|via|using)\s+(.+)$/i);

      if (methodMatch) {
        parsedResult = {
          testAttribute: testAttr,
          valueRange: methodMatch[1].trim(),
          comments: methodMatch[2].trim(),
          dataSource: 'QC'
        };
      } else {
        // Don't parse if it looks like a sentence (too many words)
        const valueWords = valueAndMethod.split(/\s+/).length;
        if (valueWords <= 5) {
          parsedResult = {
            testAttribute: testAttr,
            valueRange: valueAndMethod,
            comments: '',
            dataSource: 'QC'
          };
        }
      }
    }
  }

  // If parsed successfully, apply normalization and default test method
  if (parsedResult) {
    // Normalize test attribute capitalization
    parsedResult.testAttribute = normalizeTestAttribute(parsedResult.testAttribute);

    // Normalize value/range capitalization (capitalize words, leave numbers as-is)
    parsedResult.valueRange = normalizeValueRange(parsedResult.valueRange);

    // Normalize test method capitalization if present
    if (parsedResult.comments) {
      parsedResult.comments = normalizeTestMethod(parsedResult.comments);
    } else {
      // Apply default test method if comments are empty
      const defaultMethod = getDefaultTestMethod(parsedResult.testAttribute);
      if (defaultMethod) {
        parsedResult.comments = defaultMethod;
      }
    }
  }

  return parsedResult;
}

/**
 * Parse multiple quality specifications from text
 * Separators: comma (,), semicolon (;), pipe (|), newline, or the word "and"
 * @param {string} text - Text with separated specifications
 * @returns {Array} Array of parsed specifications
 */
export function parseQualitySpecsBatch(text) {
  if (!text || typeof text !== 'string') {
    return {
      results: [],
      errors: [],
      totalSpecs: 0,
      successCount: 0,
      errorCount: 0
    };
  }

  // Split by: comma, semicolon, pipe, newline, or " and " (with spaces)
  // Use regex to split on multiple separators (case insensitive for "and")
  const specs = text.split(/[,;\|\n]|\s+and\s+/i);
  const results = [];
  const errors = [];

  specs.forEach((spec, index) => {
    const trimmed = spec.trim();
    if (!trimmed) {
      return; // Skip empty specs
    }

    const parsed = parseQualitySpec(trimmed);

    if (parsed) {
      results.push({
        ...parsed,
        originalText: trimmed,
        specNumber: index + 1,
        success: true
      });
    } else {
      errors.push({
        originalText: trimmed,
        specNumber: index + 1,
        success: false,
        error: 'Could not parse specification'
      });
    }
  });

  return {
    results,
    errors,
    totalSpecs: specs.filter(s => s.trim()).length,
    successCount: results.length,
    errorCount: errors.length
  };
}

/**
 * Normalize capitalization for test attributes
 * Proper case for common test names
 * Uses database configuration with hard-coded fallback
 */
export function normalizeTestAttribute(attribute) {
  // Use cached database configuration if loaded
  const properCasing = configCache.loaded ? configCache.testAttributes : {
    // Common tests
    'purity': 'Purity',
    'assay': 'Assay',
    'identity': 'Identity',
    'appearance': 'Appearance',
    'color': 'Color',
    'colour': 'Colour',
    'odor': 'Odor',
    'odour': 'Odour',
    'solubility': 'Solubility',
    'ph': 'pH',

    // Water/Moisture
    'water': 'Water',
    'water content': 'Water Content',
    'moisture': 'Moisture',
    'moisture content': 'Moisture Content',
    'h2o': 'H₂O',

    // Structure
    'structure': 'Structure',
    'structure conformity': 'Structure Conformity',
    'structural confirmation': 'Structural Confirmation',

    // Impurities
    'related substances': 'Related Substances',
    'impurities': 'Impurities',
    'residual solvents': 'Residual Solvents',
    'heavy metals': 'Heavy Metals',
    'trace metals': 'Trace Metals',
    'elemental impurities': 'Elemental Impurities',

    // Physical Properties
    'melting point': 'Melting Point',
    'mp': 'MP',
    'boiling point': 'Boiling Point',
    'bp': 'BP',
    'particle size': 'Particle Size',
    'particle size distribution': 'Particle Size Distribution',
    'loss on drying': 'Loss on Drying',
    'lod': 'LOD',
    'viscosity': 'Viscosity',
    'density': 'Density',
    'specific gravity': 'Specific Gravity',
    'refractive index': 'Refractive Index',
    'optical rotation': 'Optical Rotation',
    'specific rotation': 'Specific Rotation',
    'crystallinity': 'Crystallinity',
    'polymorphic form': 'Polymorphic Form',
    'surface area': 'Surface Area',
    'bulk density': 'Bulk Density',
    'tapped density': 'Tapped Density',
    'true density': 'True Density',

    // Thermal Properties
    'glass transition': 'Glass Transition',
    'tg': 'Tg',
    'decomposition temperature': 'Decomposition Temperature',

    // Dissolution & Release
    'dissolution': 'Dissolution',
    'dissolution rate': 'Dissolution Rate',
    'disintegration': 'Disintegration',
    'disintegration time': 'Disintegration Time',
    'drug release': 'Drug Release',
    'release rate': 'Release Rate',

    // Electrical Properties
    'conductivity': 'Conductivity',
    'resistivity': 'Resistivity',

    // Microbiological Tests
    'bioburden': 'Bioburden',
    'sterility': 'Sterility',
    'microbial limits': 'Microbial Limits',
    'total aerobic count': 'Total Aerobic Count',
    'tamc': 'TAMC',
    'total yeast mold count': 'Total Yeast Mold Count',
    'tymc': 'TYMC',
    'total viable count': 'Total Viable Count',
    'endotoxin': 'Endotoxin',
    'bacterial endotoxin': 'Bacterial Endotoxin',
    'pyrogen': 'Pyrogen',
    'mycoplasma': 'Mycoplasma',
    'specified microorganisms': 'Specified Microorganisms',

    // Biological Tests
    'potency': 'Potency',
    'biological activity': 'Biological Activity',
    'cell viability': 'Cell Viability',
    'viability': 'Viability',
    'viral safety': 'Viral Safety',
    'viral clearance': 'Viral Clearance',
    'adventitious agents': 'Adventitious Agents',
    'host cell proteins': 'Host Cell Proteins',
    'hcp': 'HCP',
    'host cell dna': 'Host Cell DNA',
    'residual dna': 'Residual DNA',
    'protein content': 'Protein Content',
    'protein a': 'Protein A',

    // Chromatographic Purity
    'single impurity': 'Single Impurity',
    'total impurities': 'Total Impurities',
    'chromatographic purity': 'Chromatographic Purity',
    'enantiomeric purity': 'Enantiomeric Purity',
    'optical purity': 'Optical Purity',
    'chiral purity': 'Chiral Purity'
  };

  const lower = attribute.toLowerCase().trim();

  // Check for exact match
  if (properCasing[lower]) {
    return properCasing[lower];
  }

  // Check for partial match
  for (const [key, value] of Object.entries(properCasing)) {
    if (lower === key) {
      return value;
    }
  }

  // If no match, capitalize first letter of each word
  return attribute
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalize test method capitalization
 * Uppercase for acronyms, proper case for words
 * Uses database configuration with hard-coded fallback
 */
export function normalizeTestMethod(method) {
  // Use cached database configuration if loaded
  const methodCasing = configCache.loaded ? configCache.testMethods : {
    // Chromatography
    'gc': 'GC',
    'hplc': 'HPLC',
    'tlc': 'TLC',
    'gc-ms': 'GC-MS',
    'lc-ms': 'LC-MS',
    'uplc': 'UPLC',
    'uhplc': 'UHPLC',
    'hplc-uv': 'HPLC-UV',
    'hplc-dad': 'HPLC-DAD',
    'hplc-ms': 'HPLC-MS',
    'lc-ms/ms': 'LC-MS/MS',
    'gc-fid': 'GC-FID',
    'gc-tcd': 'GC-TCD',
    'hptlc': 'HPTLC',
    'sfc': 'SFC',

    // Spectroscopy - NMR
    'nmr': 'NMR',
    '1h nmr': '1H NMR',
    '1hnmr': '1H NMR',
    '13c nmr': '13C NMR',
    '13cnmr': '13C NMR',
    '31p nmr': '31P NMR',
    '19f nmr': '19F NMR',
    '2d nmr': '2D NMR',

    // Spectroscopy - IR/UV/Vis
    'ir': 'IR',
    'ftir': 'FTIR',
    'nir': 'NIR',
    'atr-ftir': 'ATR-FTIR',
    'raman': 'Raman',
    'uv': 'UV',
    'uv-vis': 'UV-Vis',
    'vis': 'Vis',
    'fluorescence': 'Fluorescence',

    // Mass Spectrometry
    'ms': 'MS',
    'maldi': 'MALDI',
    'maldi-tof': 'MALDI-TOF',
    'esi-ms': 'ESI-MS',
    'tof-ms': 'TOF-MS',

    // Elemental & Metals Analysis
    'icp-ms': 'ICP-MS',
    'icp-oes': 'ICP-OES',
    'icp-aes': 'ICP-AES',
    'aas': 'AAS',
    'faas': 'FAAS',
    'gfaas': 'GFAAS',
    'xrf': 'XRF',
    'ed-xrf': 'ED-XRF',
    'wdxrf': 'WDXRF',

    // Structural Analysis
    'xrd': 'XRD',
    'xrpd': 'XRPD',
    'pxrd': 'PXRD',
    'scxrd': 'SCXRD',
    'saxs': 'SAXS',
    'waxs': 'WAXS',

    // Thermal Analysis
    'dsc': 'DSC',
    'tga': 'TGA',
    'dta': 'DTA',
    'tma': 'TMA',
    'dma': 'DMA',

    // Microscopy
    'sem': 'SEM',
    'tem': 'TEM',
    'afm': 'AFM',
    'optical microscopy': 'Optical microscopy',
    'polarized light microscopy': 'Polarized light microscopy',

    // Microbiological Methods
    'lal': 'LAL',
    'lal assay': 'LAL Assay',
    'lal test': 'LAL Test',
    'membrane filtration': 'Membrane Filtration',
    'plate count': 'Plate Count',
    'pour plate': 'Pour Plate',
    'spread plate': 'Spread Plate',
    'mpn': 'MPN',
    'most probable number': 'Most Probable Number',
    'pcr': 'PCR',
    'qpcr': 'qPCR',
    'rt-pcr': 'RT-PCR',
    'elisa': 'ELISA',
    'gel clot': 'Gel Clot',
    'kinetic turbidimetric': 'Kinetic Turbidimetric',
    'kinetic chromogenic': 'Kinetic Chromogenic',
    'chromogenic': 'Chromogenic',
    'turbidimetric': 'Turbidimetric',

    // Biological Assays
    'cell culture': 'Cell Culture',
    'cell-based assay': 'Cell-Based Assay',
    'bioassay': 'Bioassay',
    'elisa': 'ELISA',
    'western blot': 'Western Blot',
    'sds-page': 'SDS-PAGE',
    'ce-sds': 'CE-SDS',
    'ihc': 'IHC',
    'immunohistochemistry': 'Immunohistochemistry',
    'flow cytometry': 'Flow Cytometry',
    'facs': 'FACS',

    // Particle Characterization
    'laser diffraction': 'Laser Diffraction',
    'dynamic light scattering': 'Dynamic Light Scattering',
    'dls': 'DLS',
    'static light scattering': 'Static Light Scattering',
    'sls': 'SLS',
    'nta': 'NTA',
    'coulter counter': 'Coulter Counter',
    'bet': 'BET',

    // Dissolution & Physical
    'usp apparatus 1': 'USP Apparatus 1',
    'usp apparatus 2': 'USP Apparatus 2',
    'usp apparatus 3': 'USP Apparatus 3',
    'usp apparatus 4': 'USP Apparatus 4',
    'paddle': 'Paddle',
    'basket': 'Basket',
    'rotating cylinder': 'Rotating Cylinder',
    'flow-through cell': 'Flow-Through Cell',

    // Electrochemical
    'hplc-ec': 'HPLC-EC',
    'ise': 'ISE',
    'potentiometry': 'Potentiometry',

    // Other Methods
    'lod': 'LOD',
    'karl fischer': 'Karl Fischer',
    'kf': 'Karl Fischer',
    'visual': 'Visual',
    'visual inspection': 'Visual Inspection',
    'organoleptic': 'Organoleptic',
    'titration': 'Titration',
    'potentiometric titration': 'Potentiometric Titration',
    'ph meter': 'pH Meter',
    'melting point apparatus': 'Melting Point Apparatus',
    'capillary melting point': 'Capillary Melting Point',
    'polarimeter': 'Polarimeter',
    'refractometer': 'Refractometer',
    'viscometer': 'Viscometer',
    'densitometer': 'Densitometer',
    'conductivity meter': 'Conductivity Meter',
    'osmometer': 'Osmometer'
  };

  const lower = method.toLowerCase().trim();

  // Check for exact match
  if (methodCasing[lower]) {
    return methodCasing[lower];
  }

  // Check if it's likely an acronym (all caps or mixed case short string)
  if (method.length <= 6 && /^[A-Z-]+$/i.test(method)) {
    return method.toUpperCase();
  }

  // Otherwise return as-is
  return method;
}

/**
 * Normalize value/range capitalization
 * Capitalizes word values (clear, colorless, etc.) but leaves numeric values unchanged
 */
export function normalizeValueRange(value) {
  if (!value || typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  // Check if value contains numbers, operators, or percentage signs
  // If so, it's a numeric specification - return as-is
  if (/[\d≥≤><=%°℃℉]/.test(trimmed)) {
    return trimmed;
  }

  // Otherwise it's a word description (clear, colorless, white powder, etc.)
  // Capitalize first letter of each word
  return trimmed
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Normalize comparison operators
 * Converts text operators to symbols
 */
export function normalizeOperator(text) {
  const replacements = {
    'greater than or equal to': '≥',
    'greater than or equal': '≥',
    'greater or equal': '≥',
    'at least': '≥',
    '>=': '≥',
    'less than or equal to': '≤',
    'less than or equal': '≤',
    'less or equal': '≤',
    'at most': '≤',
    'no more than': '≤',
    '<=': '≤',
    'not more than': '≤',
    'greater than': '>',
    'less than': '<',
    'equals': '=',
    'equal to': '='
  };

  let normalized = text;
  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(key, 'gi');
    normalized = normalized.replace(regex, value);
  });

  return normalized;
}

/**
 * Validate a parsed quality specification
 */
export function validateQualitySpec(spec) {
  const errors = [];

  if (!spec.testAttribute || spec.testAttribute.trim() === '') {
    errors.push('Test/Attribute is required');
  }

  if (!spec.valueRange || spec.valueRange.trim() === '') {
    errors.push('Value/Range is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get default test method based on attribute name
 * Returns the most common method for that test type
 * Uses database configuration with hard-coded fallback
 */
export function getDefaultTestMethod(testAttribute) {
  // Use cached database configuration if loaded
  const defaultMethods = configCache.loaded ? configCache.defaultMethods : {
    // Water/Moisture
    'water': 'Karl Fischer',
    'water content': 'Karl Fischer',
    'moisture': 'Karl Fischer',
    'moisture content': 'Karl Fischer',
    'h2o': 'Karl Fischer',

    // Structure/Identity
    'structure': '1H NMR',
    'structure conformity': '1H NMR',
    'structural confirmation': '1H NMR',
    'nmr': '1H NMR',
    'identity': 'IR',

    // Purity/Assay
    'purity': 'HPLC',
    'assay': 'HPLC',
    'content': 'HPLC',
    'chromatographic purity': 'HPLC',

    // Physical Properties - Visual
    'appearance': 'Visual',
    'color': 'Visual',
    'colour': 'Visual',
    'form': 'Visual',
    'solubility': 'Visual',
    'crystallinity': 'Optical Microscopy',

    // Physical Properties - Sensory
    'odor': 'Organoleptic',
    'odour': 'Organoleptic',

    // Physical Properties - Instrumental
    'viscosity': 'Viscometer',
    'density': 'Densitometer',
    'specific gravity': 'Densitometer',
    'refractive index': 'Refractometer',
    'optical rotation': 'Polarimeter',
    'specific rotation': 'Polarimeter',
    'conductivity': 'Conductivity Meter',

    // pH
    'ph': 'pH Meter',

    // Impurities - Chromatographic
    'related substances': 'HPLC',
    'impurities': 'HPLC',
    'single impurity': 'HPLC',
    'total impurities': 'HPLC',
    'residual solvents': 'GC',
    'solvents': 'GC',
    'enantiomeric purity': 'HPLC',
    'chiral purity': 'HPLC',

    // Elemental/Metals
    'heavy metals': 'ICP-MS',
    'metals': 'ICP-MS',
    'trace metals': 'ICP-MS',
    'elemental impurities': 'ICP-MS',

    // Thermal Properties
    'melting point': 'Melting Point Apparatus',
    'mp': 'Melting Point Apparatus',
    'boiling point': 'Distillation Apparatus',
    'bp': 'Distillation Apparatus',
    'glass transition': 'DSC',
    'tg': 'DSC',
    'decomposition temperature': 'TGA',

    // Particle Characterization
    'particle size': 'Laser Diffraction',
    'particle size distribution': 'Laser Diffraction',
    'surface area': 'BET',
    'bulk density': 'Densitometer',
    'tapped density': 'Densitometer',
    'true density': 'Helium Pycnometry',

    // Structural Analysis
    'polymorphic form': 'XRPD',
    'crystallinity': 'XRPD',

    // Dissolution/Disintegration
    'dissolution': 'USP Apparatus 2',
    'dissolution rate': 'USP Apparatus 2',
    'disintegration': 'Disintegration Tester',
    'disintegration time': 'Disintegration Tester',
    'drug release': 'USP Apparatus 2',
    'release rate': 'USP Apparatus 2',

    // Loss on Drying
    'loss on drying': 'LOD',
    'lod': 'LOD',

    // Microbiological Tests
    'bioburden': 'Membrane Filtration',
    'sterility': 'Membrane Filtration',
    'microbial limits': 'Membrane Filtration',
    'total aerobic count': 'Plate Count',
    'tamc': 'Plate Count',
    'total yeast mold count': 'Plate Count',
    'tymc': 'Plate Count',
    'total viable count': 'Plate Count',
    'endotoxin': 'LAL',
    'bacterial endotoxin': 'LAL',
    'pyrogen': 'LAL',
    'mycoplasma': 'PCR',
    'specified microorganisms': 'Membrane Filtration',

    // Biological Tests
    'potency': 'Bioassay',
    'biological activity': 'Bioassay',
    'cell viability': 'Flow Cytometry',
    'viability': 'Flow Cytometry',
    'viral safety': 'PCR',
    'viral clearance': 'PCR',
    'adventitious agents': 'PCR',
    'host cell proteins': 'ELISA',
    'hcp': 'ELISA',
    'host cell dna': 'qPCR',
    'residual dna': 'qPCR',
    'protein content': 'UV-Vis',
    'protein a': 'ELISA'
  };

  const lowerAttr = testAttribute.toLowerCase().trim();

  // Try exact match first
  if (defaultMethods[lowerAttr]) {
    return defaultMethods[lowerAttr];
  }

  // Try partial match
  for (const [key, method] of Object.entries(defaultMethods)) {
    if (lowerAttr.includes(key) || key.includes(lowerAttr)) {
      return method;
    }
  }

  return '';
}

/**
 * Get suggested test methods based on attribute name
 */
export function suggestTestMethods(testAttribute) {
  const suggestions = {
    'purity': ['GC', 'HPLC', 'NMR', 'Titration'],
    'assay': ['HPLC', 'GC', 'Titration', 'UV-Vis'],
    'moisture': ['Karl Fischer', 'LOD', 'TGA'],
    'water': ['Karl Fischer', 'LOD', 'TGA'],
    'ph': ['pH meter', 'pH paper'],
    'appearance': ['Visual inspection'],
    'color': ['Visual inspection', 'Spectrophotometry'],
    'solubility': ['Visual observation'],
    'melting point': ['Melting point apparatus', 'DSC'],
    'identity': ['IR', 'NMR', 'MS', 'HPLC retention time'],
    'structure': ['1H NMR', '13C NMR', 'IR', 'MS'],
    'residual solvents': ['GC', 'GC-MS'],
    'heavy metals': ['ICP-MS', 'ICP-OES', 'AAS'],
    'particle size': ['Laser diffraction', 'SEM', 'Sieving']
  };

  const lowerAttr = testAttribute.toLowerCase();

  for (const [key, methods] of Object.entries(suggestions)) {
    if (lowerAttr.includes(key)) {
      return methods;
    }
  }

  return [];
}

/**
 * Example specifications for help text
 */
export const EXAMPLE_SPECS = [
  'purity ≥99.9% by gc, ph 6.5-7.5, appearance: white powder',
  'water content is less than or equal to 50 ppm, melting point is 100-102°C',
  'purity of 99.8% by 1hnmr and assay 98.0-102.0% by hplc',
  'conforms to structure by 1hnmr, confirms identity by ir',
  'heavy metals ≤10 ppm by icp-ms, residual solvents ≤0.1% by gc, color: colorless'
];
