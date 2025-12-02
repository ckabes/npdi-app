const csv = require('csv-parser');
const fs = require('fs');

/**
 * Parses the Product Hierarchy CSV and builds a hierarchical structure
 * Structure: divisions → units → fields → lines → groups → mainGroups → prodhTree
 */
class ProductHierarchyParser {
  constructor() {
    this.rows = [];
  }

  /**
   * Parse CSV file and return hierarchical structure
   * @param {string} filePath - Path to the CSV file
   * @returns {Promise<Object>} - Hierarchical data structure
   */
  async parseCSV(filePath) {
    // Read all rows from CSV
    this.rows = await this.readCSV(filePath);

    // Build the hierarchy
    const hierarchy = this.buildHierarchy();

    return hierarchy;
  }

  /**
   * Read CSV file into array of objects
   */
  readCSV(filePath) {
    return new Promise((resolve, reject) => {
      const rows = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Clean up the row data
          const cleanRow = {};
          for (const key in row) {
            // Remove BOM and trim whitespace
            const cleanKey = key.replace(/^\ufeff/, '').trim();
            cleanRow[cleanKey] = row[key] ? row[key].trim() : '';
          }
          rows.push(cleanRow);
        })
        .on('end', () => {
          console.log(`Parsed ${rows.length} rows from CSV`);
          resolve(rows);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Build hierarchical structure from flat CSV rows
   */
  buildHierarchy() {
    const divisions = {};
    const divisionsSet = new Set();

    // Process each row
    this.rows.forEach(row => {
      const divCode = row.Business_DIV;
      const divTitle = row.Business_DIV_description;
      const unitCode = row.Business_Unit_SDV;
      const unitTitle = row.Business_Unit_SDV_description;
      const fieldCode = row.Business_Field_BD;
      const fieldTitle = row.Business_Field_BD_description;
      const lineCode = row.Business_Line_BF;
      const lineTitle = row.Business_Line_BF_description;
      const groupCode = row.Product_Group_SBU;
      const groupTitle = row.Product_Group_SBU_description;
      const mainGroupCode = row.Main_Group;
      const mainGroupTitle = row.Main_Group_description;

      // Skip rows without essential data
      if (!divCode || !groupCode || !mainGroupCode) {
        return;
      }

      divisionsSet.add(divCode);

      // Initialize division
      if (!divisions[divCode]) {
        divisions[divCode] = {
          code: divCode,
          title: divTitle,
          units: {}
        };
      }

      // Initialize unit
      if (!divisions[divCode].units[unitCode]) {
        divisions[divCode].units[unitCode] = {
          code: unitCode,
          title: unitTitle,
          fields: {}
        };
      }

      // Initialize field
      if (!divisions[divCode].units[unitCode].fields[fieldCode]) {
        divisions[divCode].units[unitCode].fields[fieldCode] = {
          code: fieldCode,
          title: fieldTitle,
          lines: {}
        };
      }

      // Initialize line
      if (!divisions[divCode].units[unitCode].fields[fieldCode].lines[lineCode]) {
        divisions[divCode].units[unitCode].fields[fieldCode].lines[lineCode] = {
          code: lineCode,
          title: lineTitle,
          groups: {}
        };
      }

      // Initialize group
      if (!divisions[divCode].units[unitCode].fields[fieldCode].lines[lineCode].groups[groupCode]) {
        divisions[divCode].units[unitCode].fields[fieldCode].lines[lineCode].groups[groupCode] = {
          code: groupCode,
          title: groupTitle,
          mainGroups: {}
        };
      }

      // Initialize main group
      if (!divisions[divCode].units[unitCode].fields[fieldCode].lines[lineCode].groups[groupCode].mainGroups[mainGroupCode]) {
        divisions[divCode].units[unitCode].fields[fieldCode].lines[lineCode].groups[groupCode].mainGroups[mainGroupCode] = {
          code: mainGroupCode,
          title: mainGroupTitle,
          prodhTree: {}
        };
      }
    });

    // Now build the prodhTree for each main group
    this.rows.forEach(row => {
      const divCode = row.Business_DIV;
      const unitCode = row.Business_Unit_SDV;
      const fieldCode = row.Business_Field_BD;
      const lineCode = row.Business_Line_BF;
      const groupCode = row.Product_Group_SBU;
      const mainGroupCode = row.Main_Group;

      const level = parseInt(row.PRODH_LEVEL);
      const prodh12 = row.PRODH_12;
      const prodhSBU = row.PRODH_SBU;
      const title = row.PRODH_TEXT;
      const validCombination = row.valid_SBU_GPH_comb;

      // Skip invalid rows
      if (!divCode || !groupCode || !mainGroupCode || !prodh12 || !level) {
        return;
      }

      // Get reference to the main group's prodhTree
      const prodhTree = divisions[divCode]?.units[unitCode]?.fields[fieldCode]?.lines[lineCode]?.groups[groupCode]?.mainGroups[mainGroupCode]?.prodhTree;

      if (!prodhTree) {
        return;
      }

      // Build the hierarchical tree based on PRODH levels
      this.addToProdhTree(prodhTree, row);
    });

    return {
      metadata: {
        source: 'LS Product Hierarchy.csv',
        generatedAt: new Date(),
        totalDivisions: divisionsSet.size,
        description: 'Product Hierarchy for Life Science division'
      },
      divisions,
      stats: {
        totalRecords: this.rows.length,
        divisionsCount: divisionsSet.size,
        lastUpdated: new Date()
      }
    };
  }

  /**
   * Add a row to the prodhTree hierarchy
   * Builds a tree structure based on PRODH_LEVEL (1-4)
   */
  addToProdhTree(prodhTree, row) {
    const level = parseInt(row.PRODH_LEVEL);
    const prodh12 = row.PRODH_12;
    const prodhSBU = row.PRODH_SBU;
    const title = row.PRODH_TEXT;
    const validCombination = row.valid_SBU_GPH_comb;

    // For level 1, create the root node
    if (level === 1) {
      if (!prodhTree[prodh12]) {
        prodhTree[prodh12] = {
          code: prodh12,
          prodh12: prodh12,
          level: level,
          title: title,
          prodhSBU: prodhSBU,
          validCombination: validCombination,
          children: {}
        };
      }
      return;
    }

    // For levels 2-4, find the parent and add as child
    // Extract parent code based on level
    let parentCode;
    if (level === 2) {
      // Level 2 parent is the first 3 characters (level 1)
      parentCode = prodh12.substring(0, 3);
    } else if (level === 3) {
      // Level 3 parent is the first 6 characters (level 2)
      parentCode = prodh12.substring(0, 6);
    } else if (level === 4) {
      // Level 4 parent is the first 9 characters (level 3)
      parentCode = prodh12.substring(0, 9);
    }

    // Find parent node recursively
    const parentNode = this.findNodeInTree(prodhTree, parentCode);

    if (parentNode && parentNode.children) {
      parentNode.children[prodh12] = {
        code: prodh12,
        prodh12: prodh12,
        level: level,
        title: title,
        prodhSBU: prodhSBU,
        validCombination: validCombination,
        children: {}
      };
    }
  }

  /**
   * Recursively find a node in the tree by its code
   */
  findNodeInTree(tree, code) {
    for (const key in tree) {
      if (tree[key].code === code) {
        return tree[key];
      }
      if (tree[key].children && Object.keys(tree[key].children).length > 0) {
        const found = this.findNodeInTree(tree[key].children, code);
        if (found) return found;
      }
    }
    return null;
  }
}

module.exports = ProductHierarchyParser;
