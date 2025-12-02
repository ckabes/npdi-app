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
 */
export function normalizeTestAttribute(attribute) {
  const properCasing = {
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

    // Physical
    'melting point': 'Melting Point',
    'mp': 'MP',
    'particle size': 'Particle Size',
    'loss on drying': 'Loss on Drying',
    'lod': 'LOD'
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
 */
export function normalizeTestMethod(method) {
  const methodCasing = {
    // Chromatography
    'gc': 'GC',
    'hplc': 'HPLC',
    'tlc': 'TLC',
    'gc-ms': 'GC-MS',
    'lc-ms': 'LC-MS',
    'uplc': 'UPLC',

    // Spectroscopy
    'nmr': 'NMR',
    '1h nmr': '1H NMR',
    '1hnmr': '1H NMR',
    '13c nmr': '13C NMR',
    '13cnmr': '13C NMR',
    'ir': 'IR',
    'uv': 'UV',
    'uv-vis': 'UV-Vis',
    'ms': 'MS',
    'ftir': 'FTIR',

    // Metals analysis
    'icp-ms': 'ICP-MS',
    'icp-oes': 'ICP-OES',
    'aas': 'AAS',

    // Other
    'dsc': 'DSC',
    'tga': 'TGA',
    'lod': 'LOD',
    'sem': 'SEM',

    // Full names
    'karl fischer': 'Karl Fischer',
    'visual': 'Visual',
    'organoleptic': 'Organoleptic',
    'titration': 'Titration',
    'ph meter': 'pH meter',
    'laser diffraction': 'Laser diffraction',
    'melting point apparatus': 'Melting point apparatus'
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
 */
export function getDefaultTestMethod(testAttribute) {
  const defaultMethods = {
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

    // Physical properties
    'appearance': 'Visual',
    'color': 'Visual',
    'colour': 'Visual',
    'form': 'Visual',
    'odor': 'Organoleptic',
    'odour': 'Organoleptic',
    'solubility': 'Visual',

    // pH
    'ph': 'pH meter',

    // Impurities
    'related substances': 'HPLC',
    'impurities': 'HPLC',
    'residual solvents': 'GC',
    'solvents': 'GC',

    // Metals
    'heavy metals': 'ICP-MS',
    'metals': 'ICP-MS',

    // Other
    'melting point': 'Melting point apparatus',
    'mp': 'Melting point apparatus',
    'particle size': 'Laser diffraction',
    'loss on drying': 'LOD',
    'lod': 'LOD'
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
