import React, { useState } from 'react';

/**
 * DynamicTicketView Component
 *
 * Renders ticket data in a tabbed view based on the ticket's template configuration.
 * This component is used by both PMOps and Product Managers to view ticket data
 * in a consistent format that respects the template structure.
 *
 * @param {Object} props
 * @param {Object} props.ticket - The ticket object with all data
 * @param {Object} props.template - The template object with formConfiguration
 * @param {React.Node} props.additionalActions - Optional additional action buttons (e.g., Edit SKU for PMOps)
 */
const DynamicTicketView = ({ ticket, template, additionalActions }) => {
  const [activeTab, setActiveTab] = useState('basic');

  // If no template, fall back to showing basic info
  if (!template || !template.formConfiguration || !template.formConfiguration.sections) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Ticket Information</h3>
        </div>
        <div className="card-body">
          <p className="text-sm text-gray-500">Template configuration not available</p>
        </div>
      </div>
    );
  }

  const formConfig = template.formConfiguration;

  // Get visible sections from the template, sorted by order
  const visibleSections = formConfig.sections
    ?.filter(section => section.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0)) || [];

  // Create tabs from sections
  const tabs = visibleSections.map(section => ({
    id: section.sectionKey,
    name: section.name || section.sectionKey
  }));

  // Get data for a specific field from the ticket
  const getFieldValue = (fieldKey) => {
    // Handle nested field keys (e.g., 'chemicalProperties.casNumber')
    const keys = fieldKey.split('.');
    let value = ticket;

    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return null;
      }
    }

    return value;
  };

  // Format value for display
  const formatValue = (value, field) => {
    if (value === null || value === undefined || value === '') return '—';

    if (typeof value === 'boolean') return value ? 'Yes' : 'No';

    // Handle value/unit objects
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (value.value !== undefined && value.unit !== undefined) {
        return `${value.value} ${value.unit}`;
      }

      // Handle nested objects
      return (
        <div className="space-y-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="text-xs">
              <span className="font-medium">{formatFieldLabel(k)}:</span> {formatValue(v, null)}
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return '—';
      return (
        <div className="space-y-2">
          {value.map((item, i) => (
            <div key={i} className="p-2 bg-gray-50 rounded border border-gray-200">
              {formatValue(item, null)}
            </div>
          ))}
        </div>
      );
    }

    return String(value);
  };

  // Format field key to readable label
  const formatFieldLabel = (key) => {
    // Special label mappings
    const labelMappings = {
      'sbu': 'SBU',
      'casNumber': 'CAS Number',
      'iupacName': 'IUPAC Name',
      'pubchemCID': 'PubChem CID',
      'canonicalSMILES': 'Canonical SMILES',
      'inchi': 'InChI',
      'inchiKey': 'InChI Key',
      'unspscCode': 'UNSPSC Code',
      'sku': 'SKU',
      'uom': 'UOM',
      'sapNumber': 'SAP Number',
    };

    if (labelMappings[key]) return labelMappings[key];

    // Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Render a section's content
  const renderSection = (section) => {
    const fields = section.fields || [];

    return (
      <div className="space-y-4">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            {fields
              .filter(field => field.visible !== false)
              .map((field, index) => {
                const value = getFieldValue(field.fieldKey);
                const label = field.label || formatFieldLabel(field.fieldKey);

                return (
                  <tr key={field.fieldKey || index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 w-1/3">
                      {label}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatValue(value, field)}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div data-tab-view="dynamic-ticket">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-millipore-blue text-millipore-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {visibleSections
          .filter(section => section.sectionKey === activeTab)
          .map((section, index) => (
            <div key={section.sectionKey || index}>
              {renderSection(section)}
            </div>
          ))}
      </div>

      {/* Additional Actions (e.g., Edit SKU button for PMOps) */}
      {additionalActions && (
        <div className="px-6 pb-6">
          {additionalActions}
        </div>
      )}

      {/* Template name footer */}
      {template && (
        <div className="mt-4 pb-4 text-center">
          <p className="text-xs text-gray-300 font-light">
            {template.name}
          </p>
        </div>
      )}
    </div>
  );
};

export default DynamicTicketView;
