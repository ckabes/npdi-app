import React, { useState, useEffect } from 'react';
import { 
  CogIcon, 
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const FormConfiguration = () => {
  const [formConfig, setFormConfig] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    chemical: false,
    hazard: false,
    sku: false,
    corpbase: false,
    pricing: false,
    business: false
  });

  // Complete form field configuration based on CreateTicket form
  useEffect(() => {
    const defaultConfig = {
      basic: {
        name: 'Basic Information',
        fields: {
          productName: {
            label: 'Product Name',
            type: 'text',
            required: true,
            visible: true,
            editable: true,
            defaultValue: '',
            placeholder: 'Enter product name',
            helpText: 'The commercial name of the product'
          },
          productLine: {
            label: 'Product Line',
            type: 'text',
            required: true,
            visible: true,
            editable: true,
            defaultValue: 'Chemical Products',
            placeholder: 'Enter product line',
            helpText: 'Product category or line'
          },
          sbu: {
            label: 'Strategic Business Unit (SBU)',
            type: 'select',
            required: true,
            visible: true,
            editable: true,
            defaultValue: 'P90',
            options: [
              { value: '775', label: 'SBU 775' },
              { value: 'P90', label: 'SBU P90' },
              { value: '440', label: 'SBU 440' },
              { value: 'P87', label: 'SBU P87' },
              { value: 'P89', label: 'SBU P89' },
              { value: 'P85', label: 'SBU P85' }
            ],
            helpText: 'Business unit responsible for this product'
          },
          priority: {
            label: 'Priority',
            type: 'select',
            required: true,
            visible: true,
            editable: true,
            defaultValue: 'MEDIUM',
            options: [
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' }
            ],
            helpText: 'Priority level for development'
          }
        }
      },
      chemical: {
        name: 'Chemical Properties',
        fields: {
          casNumber: {
            label: 'CAS Number',
            type: 'text',
            required: true,
            visible: true,
            editable: true,
            defaultValue: '',
            placeholder: 'e.g., 64-17-5',
            helpText: 'Chemical Abstracts Service registry number',
            validation: '^\\d{1,7}-\\d{2}-\\d$'
          },
          molecularFormula: {
            label: 'Molecular Formula',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            defaultValue: '',
            placeholder: 'e.g., C2H6O',
            helpText: 'Chemical formula of the compound'
          },
          molecularWeight: {
            label: 'Molecular Weight',
            type: 'number',
            required: false,
            visible: true,
            editable: true,
            defaultValue: '',
            placeholder: 'e.g., 46.07',
            helpText: 'Molecular weight in g/mol'
          },
          iupacName: {
            label: 'IUPAC Name',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            defaultValue: '',
            placeholder: 'IUPAC systematic name',
            helpText: 'International Union of Pure and Applied Chemistry name'
          },
          physicalState: {
            label: 'Physical State',
            type: 'select',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 'Solid',
            options: [
              { value: 'Solid', label: 'Solid' },
              { value: 'Liquid', label: 'Liquid' },
              { value: 'Gas', label: 'Gas' },
              { value: 'Powder', label: 'Powder' },
              { value: 'Crystal', label: 'Crystal' }
            ],
            helpText: 'Physical state at room temperature'
          }
        }
      },
      hazard: {
        name: 'Hazard Classification',
        fields: {
          ghsClass: {
            label: 'GHS Hazard Class',
            type: 'select',
            required: false,
            visible: true,
            editable: true,
            defaultValue: '',
            options: [
              { value: 'H200-H299', label: 'Physical Hazards (H200-H299)' },
              { value: 'H300-H399', label: 'Health Hazards (H300-H399)' },
              { value: 'H400-H499', label: 'Environmental Hazards (H400-H499)' }
            ],
            helpText: 'Globally Harmonized System hazard class'
          },
          signalWord: {
            label: 'Signal Word',
            type: 'select',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 'WARNING',
            options: [
              { value: 'WARNING', label: 'Warning' },
              { value: 'DANGER', label: 'Danger' },
              { value: 'Danger', label: 'Danger (alt)' },
              { value: 'Warning', label: 'Warning (alt)' }
            ],
            helpText: 'GHS signal word indicating hazard severity'
          },
          transportClass: {
            label: 'Transport Class',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            defaultValue: '',
            placeholder: 'e.g., Class 3',
            helpText: 'DOT/UN transport classification'
          },
          unNumber: {
            label: 'UN Number',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            defaultValue: '',
            placeholder: 'e.g., UN1170',
            helpText: 'United Nations identification number'
          }
        }
      },
      corpbase: {
        name: 'CorpBase Website Information',
        fields: {
          productDescription: {
            label: 'Product Description',
            type: 'textarea',
            required: false,
            visible: true,
            editable: true,
            defaultValue: '',
            placeholder: 'Detailed product description...',
            helpText: 'Comprehensive product description for website'
          },
          websiteTitle: {
            label: 'Website Title',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            defaultValue: '',
            placeholder: 'SEO-optimized title',
            helpText: 'SEO-optimized title for website'
          },
          metaDescription: {
            label: 'Meta Description',
            type: 'textarea',
            required: false,
            visible: true,
            editable: true,
            defaultValue: '',
            placeholder: 'Brief description for search engines (150-160 characters)',
            helpText: 'Meta description for search engine optimization'
          },
          keyFeatures: {
            label: 'Key Features & Benefits',
            type: 'textarea',
            required: false,
            visible: true,
            editable: true,
            defaultValue: '',
            placeholder: '• High purity and quality\\n• Suitable for research applications',
            helpText: 'Key product features and benefits'
          },
          applications: {
            label: 'Applications',
            type: 'textarea',
            required: false,
            visible: true,
            editable: true,
            defaultValue: '',
            placeholder: 'List key applications...',
            helpText: 'Primary applications for the product'
          },
          targetIndustries: {
            label: 'Target Industries',
            type: 'textarea',
            required: false,
            visible: true,
            editable: true,
            defaultValue: '',
            placeholder: 'Pharmaceutical, Biotechnology, Research...',
            helpText: 'Industries that would use this product'
          }
        }
      },
      pricing: {
        name: 'Pricing & Margins',
        fields: {
          baseUnit: {
            label: 'Base Costing Unit',
            type: 'select',
            required: true,
            visible: true,
            editable: true,
            defaultValue: 'g',
            options: [
              { value: 'mg', label: 'mg (milligram)' },
              { value: 'g', label: 'g (gram)' },
              { value: 'kg', label: 'kg (kilogram)' },
              { value: 'mL', label: 'mL (milliliter)' },
              { value: 'L', label: 'L (liter)' },
              { value: 'units', label: 'units' },
              { value: 'vials', label: 'vials' },
              { value: 'plates', label: 'plates' }
            ],
            helpText: 'Base unit for cost calculations'
          },
          rawMaterialCostPerUnit: {
            label: 'Raw Material Cost ($/unit)',
            type: 'number',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 0.50,
            step: 0.01,
            helpText: 'Cost of raw materials per base unit'
          },
          packagingCost: {
            label: 'Packaging Cost ($/unit)',
            type: 'number',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 2.50,
            step: 0.01,
            helpText: 'Packaging cost per base unit'
          },
          laborOverheadCost: {
            label: 'Labor & Overhead ($/unit)',
            type: 'number',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 5.00,
            step: 0.01,
            helpText: 'Labor and overhead costs per base unit'
          },
          targetMarginSmall: {
            label: 'Small Size Margin (%)',
            type: 'number',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 75,
            step: 1,
            helpText: 'Target margin for small package sizes'
          },
          targetMarginMedium: {
            label: 'Medium Size Margin (%)',
            type: 'number',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 65,
            step: 1,
            helpText: 'Target margin for medium package sizes'
          },
          targetMarginLarge: {
            label: 'Large Size Margin (%)',
            type: 'number',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 55,
            step: 1,
            helpText: 'Target margin for large package sizes'
          },
          targetMarginBulk: {
            label: 'Bulk Size Margin (%)',
            type: 'number',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 45,
            step: 1,
            helpText: 'Target margin for bulk package sizes'
          }
        }
      },
      sku: {
        name: 'SKU Configuration',
        fields: {
          defaultSKUType: {
            label: 'Default SKU Type',
            type: 'select',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 'PREPACK',
            options: [
              { value: 'BULK', label: 'BULK' },
              { value: 'CONF', label: 'CONF' },
              { value: 'SPEC', label: 'SPEC' },
              { value: 'VAR', label: 'VAR' },
              { value: 'PREPACK', label: 'PREPACK' }
            ],
            helpText: 'Default SKU type for new variants'
          },
          defaultPackageValue: {
            label: 'Default Package Size Value',
            type: 'number',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 100,
            step: 0.1,
            helpText: 'Default package size numeric value'
          },
          defaultPackageUnit: {
            label: 'Default Package Unit',
            type: 'select',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 'g',
            options: [
              { value: 'mg', label: 'mg' },
              { value: 'g', label: 'g' },
              { value: 'kg', label: 'kg' },
              { value: 'mL', label: 'mL' },
              { value: 'L', label: 'L' },
              { value: 'units', label: 'units' },
              { value: 'vials', label: 'vials' },
              { value: 'plates', label: 'plates' },
              { value: 'bulk', label: 'bulk' }
            ],
            helpText: 'Default package unit'
          }
        }
      }
    };

    setFormConfig(defaultConfig);
  }, []);

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const updateFieldConfig = (sectionKey, fieldKey, property, value) => {
    setFormConfig(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        fields: {
          ...prev[sectionKey].fields,
          [fieldKey]: {
            ...prev[sectionKey].fields[fieldKey],
            [property]: value
          }
        }
      }
    }));
    
    toast.success(`Updated ${fieldKey} ${property}`);
  };

  const saveConfiguration = async () => {
    try {
      // API call to save configuration would go here
      console.log('Saving form configuration:', formConfig);
      toast.success('Form configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  const renderFieldConfig = (sectionKey, fieldKey, field) => {
    return (
      <div key={fieldKey} className="border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">{field.label}</h4>
            <p className="text-xs text-gray-500">{field.helpText}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateFieldConfig(sectionKey, fieldKey, 'visible', !field.visible)}
              className={`p-1 rounded ${field.visible ? 'text-green-600' : 'text-gray-400'}`}
              title={field.visible ? 'Visible' : 'Hidden'}
            >
              {field.visible ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => updateFieldConfig(sectionKey, fieldKey, 'editable', !field.editable)}
              className={`p-1 rounded ${field.editable ? 'text-blue-600' : 'text-gray-400'}`}
              title={field.editable ? 'Editable' : 'Read-only'}
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Required
            </label>
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => updateFieldConfig(sectionKey, fieldKey, 'required', e.target.checked)}
              className="rounded border-gray-300"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={field.type}
              onChange={(e) => updateFieldConfig(sectionKey, fieldKey, 'type', e.target.value)}
              className="form-select text-xs"
            >
              <option value="text">Text</option>
              <option value="textarea">Textarea</option>
              <option value="number">Number</option>
              <option value="select">Select</option>
              <option value="checkbox">Checkbox</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Default Value
            </label>
            <input
              type="text"
              value={field.defaultValue}
              onChange={(e) => updateFieldConfig(sectionKey, fieldKey, 'defaultValue', e.target.value)}
              className="form-input text-xs"
              placeholder="Default value"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => updateFieldConfig(sectionKey, fieldKey, 'placeholder', e.target.value)}
              className="form-input text-xs"
              placeholder="Placeholder text"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Help Text
          </label>
          <textarea
            value={field.helpText || ''}
            onChange={(e) => updateFieldConfig(sectionKey, fieldKey, 'helpText', e.target.value)}
            rows={2}
            className="form-input text-xs"
            placeholder="Help text for users"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Form Configuration</h2>
          <p className="text-gray-600">Configure form fields, defaults, and validation</p>
        </div>
        <button
          onClick={saveConfiguration}
          className="btn btn-primary flex items-center space-x-2"
        >
          <CogIcon className="h-5 w-5" />
          <span>Save Configuration</span>
        </button>
      </div>

      {/* Configuration Sections */}
      <div className="space-y-4">
        {Object.entries(formConfig).map(([sectionKey, section]) => (
          <div key={sectionKey} className="bg-white shadow rounded-lg">
            <button
              onClick={() => toggleSection(sectionKey)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">{section.name}</h3>
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                  {Object.keys(section.fields).length} fields
                </span>
              </div>
              {expandedSections[sectionKey] ? (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections[sectionKey] && (
              <div className="px-6 pb-6 space-y-4">
                {Object.entries(section.fields).map(([fieldKey, field]) => 
                  renderFieldConfig(sectionKey, fieldKey, field)
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormConfiguration;