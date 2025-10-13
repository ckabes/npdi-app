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

const defaultFormConfig = {
  name: 'Product Ticket Form - Default',
  description: 'Default form configuration for NPDI product tickets',
  version: '1.0.0',
  isActive: true,
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
          required: false,
          visible: true,
          editable: true,
          placeholder: 'Enter product name',
          helpText: 'The commercial name of the product',
          gridColumn: 'full',
          order: 1,
          isCustom: false
        },
        {
          fieldKey: 'productLine',
          label: 'Product Line',
          type: 'text',
          required: true,
          visible: true,
          editable: true,
          defaultValue: 'Chemical Products',
          placeholder: 'Enter product line',
          helpText: 'Product category or line',
          gridColumn: 'half',
          order: 2,
          isCustom: false
        },
        {
          fieldKey: 'sbu',
          label: 'Strategic Business Unit (SBU)',
          type: 'select',
          required: true,
          visible: true,
          editable: true,
          defaultValue: 'P90',
          helpText: 'Business unit responsible for this product',
          gridColumn: 'half',
          order: 3,
          isCustom: false,
          options: [
            { value: '775', label: 'SBU 775' },
            { value: 'P90', label: 'SBU P90' },
            { value: '440', label: 'SBU 440' },
            { value: 'P87', label: 'SBU P87' },
            { value: 'P89', label: 'SBU P89' },
            { value: 'P85', label: 'SBU P85' }
          ]
        },
        {
          fieldKey: 'priority',
          label: 'Priority',
          type: 'select',
          required: true,
          visible: true,
          editable: true,
          defaultValue: 'MEDIUM',
          helpText: 'Priority level for development',
          gridColumn: 'half',
          order: 4,
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
          helpText: 'Primary manufacturing location',
          gridColumn: 'half',
          order: 5,
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
          helpText: 'Product brand',
          gridColumn: 'half',
          order: 6,
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
          fieldKey: 'vendorName',
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
          fieldKey: 'vendorProductName',
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
          fieldKey: 'vendorSAPNumber',
          label: 'Vendor SAP Number',
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
          fieldKey: 'vendorProductNumber',
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
          gridColumn: 'third',
          order: 2,
          isCustom: false,
          validation: {
            min: 0,
            step: 0.01
          }
        },
        {
          fieldKey: 'packagingCost',
          label: 'Packaging Cost ($/unit)',
          type: 'number',
          required: false,
          visible: true,
          editable: true,
          defaultValue: 2.50,
          helpText: 'Packaging cost per base unit',
          gridColumn: 'third',
          order: 3,
          isCustom: false,
          validation: {
            min: 0,
            step: 0.01
          }
        },
        {
          fieldKey: 'laborOverheadCost',
          label: 'Labor & Overhead ($/unit)',
          type: 'number',
          required: false,
          visible: true,
          editable: true,
          defaultValue: 5.00,
          helpText: 'Labor and overhead costs per base unit',
          gridColumn: 'third',
          order: 4,
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
          order: 5,
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
      defaultExpanded: false,
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

    console.log('✓ Default form configuration created successfully');
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
