require('dotenv').config();
const mongoose = require('mongoose');
const FormConfiguration = require('../models/FormConfiguration');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * VERSIONING REQUIREMENTS:
 *
 * When making changes to this form configuration, the version number MUST be incremented:
 * - Patch version (x.x.X): Bug fixes, minor text changes, help text updates
 * - Minor version (x.X.x): New fields, new sections, non-breaking changes
 * - Major version (X.x.x): Breaking changes, field removals, structural changes
 *
 * The version field should use semantic versioning (e.g., 1.0.0, 1.1.0, 2.0.0).
 * The name should include template name and version (e.g., PM-Chem-1.8.0).
 *
 * After updating:
 * 1. Update BOTH the version field AND the name field below (name should be PM-Chem-X.X.X)
 * 2. Run: node server/scripts/seedFormConfig.js
 * 3. Update CHANGELOG or documentation with changes
 *
 * Created by: Connor Kabes
 * Updated by: connor.kabes@milliporesigma.com
 */

const defaultFormConfig = {
  name: 'PM-Chem-1.9.0',
  description: 'Form configuration for NPDI chemical product tickets (Product Manager - Chemistry)',
  version: '1.9.0',
  isActive: true,
  createdBy: 'Connor Kabes',
  updatedBy: 'connor.kabes@milliporesigma.com',
  sections: [
    {
      sectionKey: 'productionType',
      name: 'Production Type',
      description: 'Select whether this product is produced internally or procured from external suppliers',
      visible: true,
      collapsible: false,
      defaultExpanded: true,
      order: 0,
      isCustom: false,
      fields: [
        {
          fieldKey: 'productionType',
          label: 'Production Type',
          type: 'radio',
          required: true,
          visible: true,
          editable: true,
          defaultValue: 'Produced',
          helpText: 'Select whether this product is produced internally or procured from external suppliers',
          gridColumn: 'full',
          order: 1,
          isCustom: false,
          options: [
            { value: 'Produced', label: 'Produced' },
            { value: 'Procured', label: 'Procured' }
          ]
        }
      ]
    },
    {
      sectionKey: 'basic',
      name: 'Basic Information',
      description: 'Essential product information and categorization',
      visible: true,
      collapsible: true,
      defaultExpanded: true,
      order: 1,
      isCustom: false,
      fields: [
        {
          fieldKey: 'productName',
          label: 'Product Name',
          type: 'text',
          required: true,
          visible: true,
          editable: true,
          placeholder: 'Enter commercial/marketing product name',
          gridColumn: 'full',
          order: 1,
          isCustom: false
        },
        {
          fieldKey: 'sbu',
          label: 'Strategic Business Unit (SBU)',
          type: 'text',
          required: true,
          visible: true,
          editable: true,
          placeholder: 'Enter SBU code (e.g., P90, 775, P87)',
          gridColumn: 'half',
          order: 2,
          isCustom: false
        },
        {
          fieldKey: 'priority',
          label: 'Priority',
          type: 'select',
          required: true,
          visible: true,
          editable: true,
          defaultValue: 'MEDIUM',
          gridColumn: 'half',
          order: 3,
          isCustom: false,
          options: [
            { value: 'LOW', label: 'Low' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'HIGH', label: 'High' },
            { value: 'URGENT', label: 'Urgent' }
          ]
        },
        {
          fieldKey: 'primaryPlant',
          label: 'Primary Plant',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Enter primary manufacturing plant',
          gridColumn: 'half',
          order: 4,
          isCustom: false
        },
        {
          fieldKey: 'brand',
          label: 'Brand',
          type: 'select',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Select brand...',
          gridColumn: 'half',
          order: 5,
          isCustom: false,
          options: [
            { value: 'Sigma-Aldrich', label: 'Sigma-Aldrich' },
            { value: 'SAFC', label: 'SAFC' },
            { value: 'Supelco', label: 'Supelco' },
            { value: 'Milli-Q', label: 'Milli-Q' },
            { value: 'Millipore', label: 'Millipore' },
            { value: 'BioReliance', label: 'BioReliance' },
            { value: 'Calbiochem', label: 'Calbiochem' },
            { value: 'Merck', label: 'Merck' }
          ]
        },
        {
          fieldKey: 'countryOfOrigin',
          label: 'Country of Origin',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Enter country of origin',
          gridColumn: 'half',
          order: 6,
          isCustom: false
        },
        {
          fieldKey: 'productScope.scope',
          label: 'Product Scope',
          type: 'select',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Select product scope...',
          gridColumn: 'half',
          order: 7,
          isCustom: false,
          options: [
            { value: 'Worldwide', label: 'Worldwide' },
            { value: 'US only', label: 'US only' },
            { value: 'Europe only', label: 'Europe only' },
            { value: 'EEA Restricted', label: 'EEA Restricted' },
            { value: 'Other', label: 'Other' }
          ]
        },
        {
          fieldKey: 'productScope.otherSpecification',
          label: 'Product Scope Details',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Specify product scope details',
          gridColumn: 'half',
          order: 8,
          isCustom: false,
          visibleWhen: {
            fieldKey: 'productScope.scope',
            value: 'Other'
          }
        },
        {
          fieldKey: 'distributionType.type',
          label: 'Distribution Type',
          type: 'select',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Select distribution type...',
          gridColumn: 'half',
          order: 9,
          isCustom: false,
          options: [
            { value: 'Standard', label: 'Standard' },
            { value: 'Purchase on Demand', label: 'Purchase on Demand' },
            { value: 'Dock to Stock', label: 'Dock to Stock' }
          ]
        },
        {
          fieldKey: 'distributionType.coaCreator',
          label: 'Who will create COAs?',
          type: 'select',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Select...',
          gridColumn: 'half',
          order: 9,
          isCustom: false,
          options: [
            { value: 'Internal', label: 'Internal' },
            { value: 'Vendor', label: 'Vendor' }
          ],
          visibleWhen: {
            fieldKey: 'distributionType.type',
            values: ['Purchase on Demand', 'Dock to Stock']
          }
        },
        {
          fieldKey: 'distributionType.labelingType',
          label: 'How will product be labeled?',
          type: 'select',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Select...',
          gridColumn: 'half',
          order: 10,
          isCustom: false,
          options: [
            { value: 'SIAL Label', label: 'SIAL Label' },
            { value: 'Vendor Label', label: 'Vendor Label' }
          ],
          visibleWhen: {
            fieldKey: 'distributionType.type',
            values: ['Purchase on Demand', 'Dock to Stock']
          }
        },
        {
          fieldKey: 'distributionType.labelingResponsibility',
          label: 'Who is responsible for labeling?',
          type: 'radio',
          required: false,
          visible: true,
          editable: true,
          gridColumn: 'half',
          order: 11,
          isCustom: false,
          options: [
            { value: 'Internal', label: 'Internal' },
            { value: 'Vendor', label: 'Vendor' }
          ],
          visibleWhen: {
            fieldKey: 'distributionType.type',
            values: ['Purchase on Demand', 'Dock to Stock']
          }
        },
        {
          fieldKey: 'distributionType.vendorLabelSource',
          label: 'How does vendor obtain labels?',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Describe how vendor obtains SIAL labels',
          gridColumn: 'full',
          order: 12,
          isCustom: false,
          visibleWhen: {
            fieldKey: 'distributionType.labelingResponsibility',
            value: 'Vendor'
          }
        },
        {
          fieldKey: 'materialGroup',
          label: 'Main Group (GPH)',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Enter main group/GPH code',
          gridColumn: 'half',
          order: 13,
          isCustom: false
        },
        {
          fieldKey: 'sialProductHierarchy',
          label: 'SIAL Product Hierarchy',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Auto-populated from GPH or enter manually',
          helpText: 'Auto-populated from GPH selection (first 3 digits of SBU + first 3 chars of PRODH_12)',
          gridColumn: 'half',
          order: 14,
          isCustom: false
        },
        {
          fieldKey: 'businessLine.line',
          label: 'Business Line',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'e.g., Biochemistry, Chemical Synthesis, Production Materials, etc.',
          gridColumn: 'half',
          order: 15,
          isCustom: false
        },
        {
          fieldKey: 'businessLine.otherSpecification',
          label: 'Business Line Details',
          type: 'text',
          required: false,
          visible: false,  // Hidden since businessLine.line is now free text
          editable: true,
          placeholder: 'Specify business line details',
          gridColumn: 'half',
          order: 16,
          isCustom: false
        },
        {
          fieldKey: 'similarProducts',
          label: 'Similar Products',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Comma-separated material numbers (search by CAS)',
          gridColumn: 'full',
          order: 17,
          isCustom: false
        }
      ]
    },
    {
      sectionKey: 'vendor',
      name: 'Vendor Information',
      description: 'External supplier and vendor details (shown only for procured products)',
      visible: true,
      collapsible: true,
      defaultExpanded: true,
      order: 2,
      isCustom: false,
      fields: [
        {
          fieldKey: 'vendorInformation.vendorName',
          label: 'Vendor Name',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Enter vendor name',
          helpText: 'Name of the external supplier',
          gridColumn: 'half',
          order: 1,
          isCustom: false,
          visibleWhen: {
            fieldKey: 'productionType',
            value: 'Procured'
          }
        },
        {
          fieldKey: 'vendorInformation.vendorProductName',
          label: 'Vendor Product Name',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Enter vendor product name',
          helpText: 'Product name as listed by vendor',
          gridColumn: 'half',
          order: 2,
          isCustom: false,
          visibleWhen: {
            fieldKey: 'productionType',
            value: 'Procured'
          }
        },
        {
          fieldKey: 'vendorInformation.vendorSAPNumber',
          label: 'Vendor Number',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Enter vendor SAP number',
          helpText: 'SAP vendor identification number',
          gridColumn: 'half',
          order: 3,
          isCustom: false,
          visibleWhen: {
            fieldKey: 'productionType',
            value: 'Procured'
          }
        },
        {
          fieldKey: 'vendorInformation.vendorProductNumber',
          label: 'Vendor Product Number',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Enter vendor product number',
          helpText: 'Vendor\'s product catalog number',
          gridColumn: 'half',
          order: 4,
          isCustom: false,
          visibleWhen: {
            fieldKey: 'productionType',
            value: 'Procured'
          }
        },
        {
          fieldKey: 'vendorInformation.vendorCostPerUOM.value',
          label: 'Vendor Cost',
          type: 'number',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Enter vendor cost',
          helpText: 'Cost per unit of measure from vendor',
          gridColumn: 'third',
          order: 5,
          isCustom: false,
          validation: {
            min: 0,
            step: 0.01
          },
          visibleWhen: {
            fieldKey: 'productionType',
            value: 'Procured'
          }
        },
        {
          fieldKey: 'vendorInformation.vendorCostPerUOM.unit',
          label: 'UOM',
          type: 'select',
          required: false,
          visible: true,
          editable: true,
          helpText: 'Unit of measure for vendor cost',
          gridColumn: 'third',
          order: 6,
          isCustom: false,
          options: [
            { value: 'mg', label: 'mg' },
            { value: 'g', label: 'g' },
            { value: 'kg', label: 'kg' },
            { value: 'mL', label: 'mL' },
            { value: 'L', label: 'L' },
            { value: 'EA', label: 'EA (each)' },
            { value: 'units', label: 'units' },
            { value: 'vials', label: 'vials' },
            { value: 'plates', label: 'plates' }
          ],
          visibleWhen: {
            fieldKey: 'productionType',
            value: 'Procured'
          }
        },
        {
          fieldKey: 'vendorInformation.amountToBePurchased.value',
          label: 'Amount to Purchase',
          type: 'number',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Enter amount',
          helpText: 'Quantity to be purchased from vendor',
          gridColumn: 'third',
          order: 7,
          isCustom: false,
          validation: {
            min: 0,
            step: 0.01
          },
          visibleWhen: {
            fieldKey: 'productionType',
            value: 'Procured'
          }
        },
        {
          fieldKey: 'vendorInformation.amountToBePurchased.unit',
          label: 'Unit',
          type: 'select',
          required: false,
          visible: true,
          editable: true,
          helpText: 'Unit of measure for purchase amount',
          gridColumn: 'third',
          order: 8,
          isCustom: false,
          options: [
            { value: 'mg', label: 'mg' },
            { value: 'g', label: 'g' },
            { value: 'kg', label: 'kg' },
            { value: 'mL', label: 'mL' },
            { value: 'L', label: 'L' },
            { value: 'EA', label: 'EA (each)' },
            { value: 'units', label: 'units' },
            { value: 'vials', label: 'vials' },
            { value: 'plates', label: 'plates' }
          ],
          visibleWhen: {
            fieldKey: 'productionType',
            value: 'Procured'
          }
        },
        {
          fieldKey: 'vendorInformation.vendorLeadTimeWeeks',
          label: 'Vendor Lead Time (Weeks)',
          type: 'number',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'e.g., 4',
          helpText: 'Lead time in weeks for delivery from vendor',
          gridColumn: 'third',
          order: 9,
          isCustom: false,
          validation: {
            min: 0,
            step: 0.5
          },
          visibleWhen: {
            fieldKey: 'productionType',
            value: 'Procured'
          }
        },
        {
          fieldKey: 'vendorInformation.purchaseUOM',
          label: 'Purchase UOM',
          type: 'select',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Select purchase unit...',
          helpText: 'Unit of measure for purchasing',
          gridColumn: 'half',
          order: 10,
          isCustom: false,
          options: [
            { value: 'mg', label: 'mg' },
            { value: 'g', label: 'g' },
            { value: 'kg', label: 'kg' },
            { value: 'mL', label: 'mL' },
            { value: 'L', label: 'L' },
            { value: 'EA', label: 'EA (each)' },
            { value: 'units', label: 'units' },
            { value: 'vials', label: 'vials' },
            { value: 'plates', label: 'plates' }
          ],
          visibleWhen: {
            fieldKey: 'productionType',
            value: 'Procured'
          }
        },
        {
          fieldKey: 'vendorInformation.purchaseCurrency',
          label: 'Purchase Currency',
          type: 'select',
          required: false,
          visible: true,
          editable: true,
          defaultValue: 'USD',
          helpText: 'Currency for purchase transactions',
          gridColumn: 'half',
          order: 11,
          isCustom: false,
          options: [
            { value: 'USD', label: 'USD - US Dollar' },
            { value: 'EUR', label: 'EUR - Euro' },
            { value: 'GBP', label: 'GBP - British Pound' },
            { value: 'JPY', label: 'JPY - Japanese Yen' },
            { value: 'CNY', label: 'CNY - Chinese Yuan' },
            { value: 'INR', label: 'INR - Indian Rupee' },
            { value: 'CHF', label: 'CHF - Swiss Franc' }
          ],
          visibleWhen: {
            fieldKey: 'productionType',
            value: 'Procured'
          }
        },
        {
          fieldKey: 'vendorInformation.countryOfOrigin',
          label: 'Country of Origin',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Enter country of origin',
          helpText: 'Country where the product is manufactured/sourced',
          gridColumn: 'half',
          order: 12,
          isCustom: false,
          visibleWhen: {
            fieldKey: 'productionType',
            value: 'Procured'
          }
        }
      ]
    },
    {
      sectionKey: 'chemical',
      name: 'Chemical Properties',
      description: 'Chemical composition and physical properties',
      visible: true,
      collapsible: true,
      defaultExpanded: false,
      order: 3,
      isCustom: false,
      fields: [
        {
          fieldKey: 'casNumber',
          label: 'CAS Number',
          type: 'text',
          required: true,
          visible: true,
          editable: true,
          placeholder: 'e.g., 64-17-5',
          helpText: 'Chemical Abstracts Service registry number',
          gridColumn: 'half',
          order: 1,
          isCustom: false,
          validation: {
            pattern: '^\\d{1,7}-\\d{2}-\\d$'
          }
        },
        {
          fieldKey: 'molecularFormula',
          label: 'Molecular Formula',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'e.g., C2H6O',
          helpText: 'Chemical formula of the compound',
          gridColumn: 'half',
          order: 2,
          isCustom: false
        },
        {
          fieldKey: 'molecularWeight',
          label: 'Molecular Weight',
          type: 'number',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'e.g., 46.07',
          helpText: 'Molecular weight in g/mol',
          gridColumn: 'half',
          order: 3,
          isCustom: false,
          validation: {
            min: 0,
            step: 0.01
          }
        },
        {
          fieldKey: 'iupacName',
          label: 'IUPAC Name',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'IUPAC systematic name',
          helpText: 'International Union of Pure and Applied Chemistry name',
          gridColumn: 'full',
          order: 4,
          isCustom: false
        },
        {
          fieldKey: 'physicalState',
          label: 'Physical State',
          type: 'select',
          required: false,
          visible: true,
          editable: true,
          defaultValue: 'Solid',
          helpText: 'Physical state at room temperature',
          gridColumn: 'half',
          order: 5,
          isCustom: false,
          options: [
            { value: 'Solid', label: 'Solid' },
            { value: 'Liquid', label: 'Liquid' },
            { value: 'Gas', label: 'Gas' },
            { value: 'Powder', label: 'Powder' },
            { value: 'Crystal', label: 'Crystal' }
          ]
        },
        {
          fieldKey: 'retestOrExpiration.hasExpirationDate',
          label: 'Has Expiration Date?',
          type: 'radio',
          required: false,
          visible: true,
          editable: true,
          helpText: 'Does this product have an expiration date?',
          gridColumn: 'half',
          order: 6,
          isCustom: false,
          options: [
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' }
          ]
        },
        {
          fieldKey: 'retestOrExpiration.expirationPeriod.value',
          label: 'Expiration Period',
          type: 'number',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'e.g., 12',
          helpText: 'Length of expiration period',
          gridColumn: 'third',
          order: 7,
          isCustom: false,
          visibleWhen: {
            fieldKey: 'retestOrExpiration.hasExpirationDate',
            value: 'true'
          }
        },
        {
          fieldKey: 'retestOrExpiration.expirationPeriod.unit',
          label: 'Unit',
          type: 'select',
          required: false,
          visible: true,
          editable: true,
          helpText: 'Time unit for expiration period',
          gridColumn: 'third',
          order: 8,
          isCustom: false,
          options: [
            { value: 'days', label: 'Days' },
            { value: 'months', label: 'Months' },
            { value: 'years', label: 'Years' }
          ],
          visibleWhen: {
            fieldKey: 'retestOrExpiration.hasExpirationDate',
            value: 'true'
          }
        },
        {
          fieldKey: 'retestOrExpiration.hasRetestDate',
          label: 'Has Retest Date?',
          type: 'radio',
          required: false,
          visible: true,
          editable: true,
          helpText: 'Does this product require retesting?',
          gridColumn: 'half',
          order: 9,
          isCustom: false,
          options: [
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' }
          ]
        },
        {
          fieldKey: 'retestOrExpiration.retestPeriod.value',
          label: 'Retest Period',
          type: 'number',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'e.g., 36',
          helpText: 'Length of retest period',
          gridColumn: 'third',
          order: 10,
          isCustom: false,
          visibleWhen: {
            fieldKey: 'retestOrExpiration.hasRetestDate',
            value: 'true'
          }
        },
        {
          fieldKey: 'retestOrExpiration.retestPeriod.unit',
          label: 'Unit',
          type: 'select',
          required: false,
          visible: true,
          editable: true,
          helpText: 'Time unit for retest period',
          gridColumn: 'third',
          order: 11,
          isCustom: false,
          options: [
            { value: 'days', label: 'Days' },
            { value: 'months', label: 'Months' },
            { value: 'years', label: 'Years' }
          ],
          visibleWhen: {
            fieldKey: 'retestOrExpiration.hasRetestDate',
            value: 'true'
          }
        },
        {
          fieldKey: 'retestOrExpiration.hasShelfLife',
          label: 'Has Shelf Life?',
          type: 'radio',
          required: false,
          visible: true,
          editable: true,
          helpText: 'Does this product have a defined shelf life?',
          gridColumn: 'half',
          order: 12,
          isCustom: false,
          options: [
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' }
          ]
        },
        {
          fieldKey: 'retestOrExpiration.shelfLifePeriod.value',
          label: 'Shelf Life Period',
          type: 'number',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'e.g., 24',
          helpText: 'Length of shelf life period',
          gridColumn: 'third',
          order: 13,
          isCustom: false,
          visibleWhen: {
            fieldKey: 'retestOrExpiration.hasShelfLife',
            value: 'true'
          }
        },
        {
          fieldKey: 'retestOrExpiration.shelfLifePeriod.unit',
          label: 'Unit',
          type: 'select',
          required: false,
          visible: true,
          editable: true,
          helpText: 'Time unit for shelf life period',
          gridColumn: 'third',
          order: 14,
          isCustom: false,
          options: [
            { value: 'days', label: 'Days' },
            { value: 'months', label: 'Months' },
            { value: 'years', label: 'Years' }
          ],
          visibleWhen: {
            fieldKey: 'retestOrExpiration.hasShelfLife',
            value: 'true'
          }
        }
      ]
    },
    {
      sectionKey: 'pricing',
      name: 'Pricing & Margins',
      description: 'Cost structure and pricing calculations',
      visible: true,
      collapsible: true,
      defaultExpanded: false,
      order: 4,
      isCustom: false,
      fields: [
        {
          fieldKey: 'baseUnit',
          label: 'Base Costing Unit',
          type: 'select',
          required: true,
          visible: true,
          editable: true,
          defaultValue: 'g',
          helpText: 'Base unit for cost calculations',
          gridColumn: 'half',
          order: 1,
          isCustom: false,
          options: [
            { value: 'mg', label: 'mg (milligram)' },
            { value: 'g', label: 'g (gram)' },
            { value: 'kg', label: 'kg (kilogram)' },
            { value: 'mL', label: 'mL (milliliter)' },
            { value: 'L', label: 'L (liter)' },
            { value: 'EA', label: 'EA (each)' },
            { value: 'units', label: 'units' },
            { value: 'vials', label: 'vials' },
            { value: 'plates', label: 'plates' }
          ]
        },
        {
          fieldKey: 'rawMaterialCostPerUnit',
          label: 'Raw Material Cost ($/unit)',
          type: 'number',
          required: false,
          visible: true,
          editable: true,
          defaultValue: 0.50,
          helpText: 'Cost of raw materials per base unit',
          gridColumn: 'half',
          order: 2,
          isCustom: false,
          validation: {
            min: 0,
            step: 0.01
          }
        },
        {
          fieldKey: 'targetMargin',
          label: 'Target Margin (%)',
          type: 'number',
          required: false,
          visible: true,
          editable: true,
          defaultValue: 50,
          helpText: 'Target profit margin percentage',
          gridColumn: 'half',
          order: 3,
          isCustom: false,
          validation: {
            min: 0,
            max: 100,
            step: 1
          }
        }
      ]
    },
    {
      sectionKey: 'composition',
      name: 'Product Composition',
      description: 'Define the chemical components that make up this product',
      visible: true,
      collapsible: true,
      defaultExpanded: true,
      order: 5,
      isCustom: false,
      fields: [
        {
          fieldKey: 'composition',
          label: 'Composition Components',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Add composition components',
          helpText: 'This section uses a specialized component for managing product composition',
          gridColumn: 'full',
          order: 1,
          isCustom: false
        }
      ]
    },
    {
      sectionKey: 'quality',
      name: 'Quality Specifications',
      description: 'Define quality attributes and specifications for the product',
      visible: true,
      collapsible: true,
      defaultExpanded: false,
      order: 6,
      isCustom: false,
      fields: [
        {
          fieldKey: 'qualityAttributes',
          label: 'Quality Attributes',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Add quality attributes',
          helpText: 'This section uses a specialized component for managing quality specifications',
          gridColumn: 'full',
          order: 1,
          isCustom: false
        }
      ]
    },
    {
      sectionKey: 'corpbase',
      name: 'CorpBase Website Information',
      description: 'Product information for corporate website and marketing',
      visible: true,
      collapsible: true,
      defaultExpanded: false,
      order: 7,
      isCustom: false,
      fields: [
        {
          fieldKey: 'productDescription',
          label: 'Product Description',
          type: 'textarea',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Detailed product description...',
          helpText: 'Comprehensive product description for website',
          gridColumn: 'full',
          order: 1,
          isCustom: false
        },
        {
          fieldKey: 'websiteTitle',
          label: 'Website Title',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'SEO-optimized title',
          helpText: 'SEO-optimized title for website',
          gridColumn: 'full',
          order: 2,
          isCustom: false
        },
        {
          fieldKey: 'metaDescription',
          label: 'Meta Description',
          type: 'textarea',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Brief description for search engines (150-160 characters)',
          helpText: 'Meta description for search engine optimization',
          gridColumn: 'full',
          order: 3,
          isCustom: false,
          validation: {
            maxLength: 160
          }
        },
        {
          fieldKey: 'keyFeatures',
          label: 'Key Features & Benefits',
          type: 'textarea',
          required: false,
          visible: true,
          editable: true,
          placeholder: '• High purity and quality\\n• Suitable for research applications',
          helpText: 'Key product features and benefits',
          gridColumn: 'full',
          order: 4,
          isCustom: false
        },
        {
          fieldKey: 'applications',
          label: 'Applications',
          type: 'textarea',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'List key applications...',
          helpText: 'Primary applications for the product',
          gridColumn: 'full',
          order: 5,
          isCustom: false
        },
        {
          fieldKey: 'unspscCode',
          label: 'UNSPSC Code',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Select UNSPSC classification code...',
          helpText: 'United Nations Standard Products and Services Code for product classification',
          gridColumn: 'full',
          order: 6,
          isCustom: false
        }
      ]
    },
    {
      sectionKey: 'intellectualProperty',
      name: 'Intellectual Property',
      description: 'Patent and licensing information',
      visible: true,
      collapsible: true,
      defaultExpanded: false,
      order: 8,
      isCustom: false,
      fields: [
        {
          fieldKey: 'intellectualProperty.hasIP',
          label: 'Is there intellectual property associated with this product?',
          type: 'radio',
          required: false,
          visible: true,
          editable: true,
          helpText: 'Indicate if this product has any patents or licenses',
          gridColumn: 'full',
          order: 1,
          isCustom: false,
          options: [
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' }
          ]
        },
        {
          fieldKey: 'intellectualProperty.patentNumber',
          label: 'Patent Number',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Enter patent number(s)',
          helpText: 'Patent number(s) associated with this product',
          gridColumn: 'half',
          order: 2,
          isCustom: false,
          visibleWhen: {
            fieldKey: 'intellectualProperty.hasIP',
            value: 'true'
          }
        },
        {
          fieldKey: 'intellectualProperty.licenseNumber',
          label: 'License Number',
          type: 'text',
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Enter license number(s)',
          helpText: 'License number(s) associated with this product',
          gridColumn: 'half',
          order: 3,
          isCustom: false,
          visibleWhen: {
            fieldKey: 'intellectualProperty.hasIP',
            value: 'true'
          }
        }
      ]
    }
  ]
};

const seedFormConfig = async () => {
  try {
    await connectDB();

    // Check if default config already exists
    const existingConfig = await FormConfiguration.findOne({ name: defaultFormConfig.name });

    let config;
    if (existingConfig) {
      console.log('Default form configuration already exists. Updating...');
      // Update existing configuration
      Object.assign(existingConfig, defaultFormConfig);
      config = await existingConfig.save();
      console.log('✓ Default form configuration updated successfully');
    } else {
      // Create new default configuration
      config = new FormConfiguration(defaultFormConfig);
      await config.save();
      console.log('✓ Default form configuration created successfully');
    }

    console.log('✓ Form configuration saved successfully');
    console.log(`  - Template Name: ${config.templateName || config.name}`);
    console.log(`  - Name: ${config.name}`);
    console.log(`  - Version: ${config.version}`);
    console.log(`  - Sections: ${config.sections.length}`);
    console.log(`  - Total Fields: ${config.metadata.totalFields}`);
    console.log(`  - Is Active: ${config.isActive}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding form configuration:', error);
    process.exit(1);
  }
};

seedFormConfig();
