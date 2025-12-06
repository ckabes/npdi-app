import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../utils/AuthContext';

const PMOpsTabView = forwardRef(({ ticket, onTicketUpdate }, ref) => {
  const { user, isPMOPS, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');

  // Check if ticket is locked (completed or canceled)
  const isTicketLocked = () => {
    return ticket.status === 'COMPLETED' || ticket.status === 'CANCELED';
  };

  // Expose method to change tabs from parent component
  useImperativeHandle(ref, () => ({
    navigateToTab: (tabId) => {
      setActiveTab(tabId);
      // Scroll to top of the tab view
      setTimeout(() => {
        const tabElement = document.querySelector('[data-tab-view="pmops"]');
        if (tabElement) {
          tabElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }));
  const [partNumber, setPartNumber] = useState(ticket.partNumber?.baseNumber || '');
  const [savingPartNumber, setSavingPartNumber] = useState(false);
  const [editingSKUs, setEditingSKUs] = useState(false);
  const [editedSKUs, setEditedSKUs] = useState([]);
  const [savingSKUs, setSavingSKUs] = useState(false);
  const [baseUnit, setBaseUnit] = useState(ticket.baseUnit || { value: 1, unit: 'kg' });
  const [savingBaseUnit, setSavingBaseUnit] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewField, setPreviewField] = useState(null);
  const [editedHtml, setEditedHtml] = useState('');
  const [showFormattedHtml, setShowFormattedHtml] = useState(false);
  const textareaRef = useRef(null);

  const handleSavePartNumber = async () => {
    if (!partNumber.trim()) {
      toast.error('Please enter a part number');
      return;
    }

    setSavingPartNumber(true);
    try {
      const updateData = {
        partNumber: {
          baseNumber: partNumber.trim(),
          assignedBy: user.email,
          assignedAt: new Date().toISOString()
        }
      };

      // If ticket is SUBMITTED, automatically change status to IN_PROCESS
      if (ticket.status === 'SUBMITTED') {
        updateData.status = 'IN_PROCESS';
      }

      await productAPI.updateTicket(ticket._id, updateData);

      if (ticket.status === 'SUBMITTED') {
        toast.success('Part number assigned and status changed to In Process');
      } else {
        toast.success('Part number saved successfully');
      }

      if (onTicketUpdate) {
        onTicketUpdate();
      }
    } catch (error) {
      console.error('Failed to save part number:', error);
      toast.error('Failed to save part number');
    } finally {
      setSavingPartNumber(false);
    }
  };

  const handleSaveBaseUnit = async () => {
    if (!baseUnit.value || baseUnit.value <= 0) {
      toast.error('Please enter a valid base unit value greater than 0');
      return;
    }

    setSavingBaseUnit(true);
    try {
      // Update all BULK SKUs to use the new base unit
      const updatedSKUs = (ticket.skuVariants || []).map(sku => {
        if (sku.type === 'BULK') {
          return {
            ...sku,
            packageSize: {
              value: baseUnit.value,
              unit: baseUnit.unit
            }
          };
        }
        return sku;
      });

      // Save both base unit and updated SKU variants
      await productAPI.updateTicket(ticket._id, {
        baseUnit: baseUnit,
        skuVariants: updatedSKUs
      });
      toast.success('Base unit and BULK SKUs updated successfully');
      if (onTicketUpdate) {
        onTicketUpdate();
      }
    } catch (error) {
      console.error('Failed to save base unit:', error);
      toast.error('Failed to save base unit');
    } finally {
      setSavingBaseUnit(false);
    }
  };

  // Handle base unit change and update all BULK SKUs
  const handleBaseUnitChange = (field, value) => {
    // Parse value as number if field is 'value'
    const parsedValue = field === 'value' ? parseFloat(value) || '' : value;
    const newBaseUnit = { ...baseUnit, [field]: parsedValue };
    setBaseUnit(newBaseUnit);

    // If we're in edit mode, update all BULK SKUs to use the new base unit
    if (editingSKUs && editedSKUs.length > 0) {
      const updatedSKUs = editedSKUs.map(sku => {
        if (sku.type === 'BULK') {
          return {
            ...sku,
            packageSize: {
              value: newBaseUnit.value,
              unit: newBaseUnit.unit
            }
          };
        }
        return sku;
      });
      setEditedSKUs(updatedSKUs);
    }
  };

  // Helper function to get the part number suffix based on variant
  const getPartNumberSuffix = (variant) => {
    // If variant has a custom suffix, use it
    if (variant.suffix) {
      return variant.suffix;
    }

    // For PREPACK type, derive suffix from package size (e.g., 100G, 1KG)
    if (variant.type === 'PREPACK' &&
        variant.packageSize?.value && variant.packageSize?.unit) {
      const value = variant.packageSize.value;
      const unit = variant.packageSize.unit.toUpperCase();
      return `${value}${unit}`;
    }

    // For all other types (BULK, VAR, CONF, SPEC), use the type name as suffix
    const suffixMap = {
      'BULK': 'BULK',
      'VAR': 'VAR',
      'CONF': 'CONF',
      'SPEC': 'SPEC',
      'PREPACK': 'VAR' // Fallback if no package size
    };
    return suffixMap[variant.type] || 'VAR';
  };

  const handleEditSKUs = () => {
    // Sync base unit state with ticket
    if (ticket.baseUnit) {
      setBaseUnit(ticket.baseUnit);
    }

    // Deep clone and auto-populate suffixes for variants that don't have them
    const clonedVariants = JSON.parse(JSON.stringify(ticket.skuVariants || []));
    const variantsWithSuffixes = clonedVariants.map(variant => {
      if (!variant.suffix) {
        if (variant.type === 'PREPACK' && variant.packageSize?.value && variant.packageSize?.unit) {
          // For PREPACK, use package size as suffix
          variant.suffix = `${variant.packageSize.value}${variant.packageSize.unit.toUpperCase()}`;
        } else {
          // For other types, use the type name as suffix
          variant.suffix = variant.type;
        }
      }
      return variant;
    });
    setEditedSKUs(variantsWithSuffixes);
    setEditingSKUs(true);
  };

  const handleCancelEditSKUs = () => {
    setEditedSKUs([]);
    setEditingSKUs(false);
  };

  const handleAddSKU = () => {
    // Check if BULK SKU already exists
    const bulkExists = editedSKUs.some(sku => sku.type === 'BULK');

    // Use base unit for BULK type, otherwise blank
    const effectiveBaseUnit = ticket.baseUnit || baseUnit;

    // If BULK already exists, default to PREPACK instead
    const defaultType = bulkExists ? 'PREPACK' : 'BULK';
    const defaultSuffix = bulkExists ? '100G' : 'BULK';
    const defaultPackageSize = bulkExists
      ? { value: 100, unit: 'g' }
      : effectiveBaseUnit.value
        ? { value: effectiveBaseUnit.value, unit: effectiveBaseUnit.unit }
        : { value: '', unit: 'g' };

    const newSKU = {
      type: defaultType,
      suffix: defaultSuffix,
      packageSize: defaultPackageSize,
      netWeight: { value: '', unit: 'g' },
      grossWeight: { value: '', unit: 'g' },
      volume: { value: '', unit: 'mL' },
      pricing: {
        listPrice: '',
        limitPrice: '',
        standardCost: '',
        margin: 50
      },
      forecastedSalesVolume: {
        year1: '',
        year2: '',
        year3: ''
      }
    };

    if (bulkExists) {
      toast.info('A BULK SKU already exists. Adding PREPACK SKU instead.');
    }

    setEditedSKUs([...editedSKUs, newSKU]);
  };

  const handleRemoveSKU = (index) => {
    setEditedSKUs(editedSKUs.filter((_, i) => i !== index));
  };

  const handleUpdateSKUField = (index, field, value) => {
    const updated = [...editedSKUs];
    const keys = field.split('.');
    let obj = updated[index];

    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }

    // Parse numeric fields
    const numericFields = ['packageSize.value', 'netWeight.value', 'grossWeight.value', 'volume.value', 'pricing.listPrice'];
    const parsedValue = numericFields.includes(field) && value !== ''
      ? parseFloat(value) || ''
      : value;

    obj[keys[keys.length - 1]] = parsedValue;

    // Auto-update suffix when package size changes for PREPACK type only
    if ((field === 'packageSize.value' || field === 'packageSize.unit') && updated[index].type === 'PREPACK') {
      const variant = updated[index];
      // Only auto-update if the current suffix matches the auto-generated one
      const currentAutoSuffix = variant.packageSize?.value && variant.packageSize?.unit
        ? `${variant.packageSize.value}${variant.packageSize.unit.toUpperCase()}`
        : '';

      if (!variant.suffix || variant.suffix === currentAutoSuffix) {
        // Update suffix to match new package size
        if (variant.packageSize?.value && variant.packageSize?.unit) {
          variant.suffix = `${variant.packageSize.value}${variant.packageSize.unit.toUpperCase()}`;
        }
      }
    }

    // Auto-update suffix when type changes to/from PREPACK
    if (field === 'type') {
      const variant = updated[index];
      const effectiveBaseUnit = ticket.baseUnit || baseUnit;

      if (value === 'BULK') {
        // Check if another BULK SKU already exists (excluding the current one)
        const bulkExists = updated.some((sku, idx) => idx !== index && sku.type === 'BULK');
        if (bulkExists) {
          toast.error('Only one BULK SKU is allowed per product. Another BULK SKU already exists.');
          return; // Don't update if another BULK exists
        }

        // Changed to BULK - set to base unit and clear other fields
        variant.suffix = 'BULK';
        variant.packageSize = effectiveBaseUnit.value
          ? { value: effectiveBaseUnit.value, unit: effectiveBaseUnit.unit }
          : { value: '', unit: 'g' };
        // Clear BULK-specific fields
        variant.netWeight = { value: '', unit: 'g' };
        variant.grossWeight = { value: '', unit: 'g' };
        variant.volume = { value: '', unit: 'mL' };
        variant.pricing = { listPrice: '', limitPrice: '', standardCost: '', margin: 50 };
      } else if (value === 'PREPACK' && variant.packageSize?.value && variant.packageSize?.unit) {
        // Changed to PREPACK - set suffix based on package size
        variant.suffix = `${variant.packageSize.value}${variant.packageSize.unit.toUpperCase()}`;
      } else if (value === 'VAR' || value === 'CONF' || value === 'SPEC') {
        // Changed to VAR/CONF/SPEC - set suffix to type name and clear package size
        variant.suffix = value;
        variant.packageSize = { value: '', unit: 'g' };
      }
    }

    setEditedSKUs(updated);
  };

  const handleSaveSKUs = async () => {
    setSavingSKUs(true);
    try {
      await productAPI.updateTicket(ticket._id, {
        skuVariants: editedSKUs
      });
      toast.success('SKUs updated successfully');
      setEditingSKUs(false);
      if (onTicketUpdate) {
        onTicketUpdate();
      }
    } catch (error) {
      console.error('Failed to save SKUs:', error);
      toast.error('Failed to save SKUs');
    } finally {
      setSavingSKUs(false);
    }
  };

  // Fix orphaned <li> tags by wrapping them in <ul>
  const fixOrphanedListItems = (html) => {
    if (!html) return html;
    const hasOrphanedLi = /<li[^>]*>/.test(html) && !/<ul[^>]*>/.test(html) && !/<ol[^>]*>/.test(html);
    if (hasOrphanedLi) {
      return `<ul>\n${html}\n</ul>`;
    }
    return html;
  };

  // Handle preview opening
  const handlePreview = (field, content) => {
    setPreviewField({ field, content });
    const fixedHtml = fixOrphanedListItems(content || '');
    setEditedHtml(fixedHtml);
    setIsPreviewOpen(true);
  };

  // Handle saving edited HTML back to ticket
  const handleSaveHtml = async () => {
    const fieldName = previewField.field;

    // Fix orphaned list items before saving
    const fixedHtml = fixOrphanedListItems(editedHtml);

    let updateData = {};

    if (fieldName === 'Product Description') {
      updateData = { 'corpbaseData.productDescription': fixedHtml };
    } else if (fieldName === 'Key Features & Benefits') {
      updateData = { 'corpbaseData.keyFeatures': fixedHtml };
    } else if (fieldName === 'Applications') {
      updateData = { 'corpbaseData.applications': fixedHtml };
    }

    try {
      await productAPI.updateTicket(ticket._id, updateData);
      toast.success(`${fieldName} updated successfully`);
      setIsPreviewOpen(false);
      if (onTicketUpdate) {
        onTicketUpdate();
      }
    } catch (error) {
      console.error('Failed to update HTML content:', error);
      toast.error('Failed to update content');
    }
  };

  // Apply HTML formatting to selected text
  const applyFormatting = (tag) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editedHtml.substring(start, end);

    if (!selectedText) {
      alert('Please select some text first');
      return;
    }

    let wrappedText = '';
    switch (tag) {
      case 'bold':
        wrappedText = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        wrappedText = `<em>${selectedText}</em>`;
        break;
      case 'sub':
        wrappedText = `<sub>${selectedText}</sub>`;
        break;
      case 'sup':
        wrappedText = `<sup>${selectedText}</sup>`;
        break;
      default:
        return;
    }

    const newHtml = editedHtml.substring(0, start) + wrappedText + editedHtml.substring(end);
    setEditedHtml(newHtml);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + wrappedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Insert special character at cursor position
  const insertSymbol = (symbol) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newHtml = editedHtml.substring(0, start) + symbol + editedHtml.substring(end);
    setEditedHtml(newHtml);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + symbol.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const tabs = [
    { id: 'basic', name: 'Basic Information' },
    { id: 'chemical', name: 'Chemical Properties' },
    { id: 'vendor', name: 'Vendor Information' },
    { id: 'composition', name: 'Composition' },
    { id: 'quality', name: 'Quality Specifications' },
    { id: 'skus', name: 'SKUs' },
    { id: 'corpbase', name: 'CorpBase Data' },
    { id: 'intellectualProperty', name: 'Intellectual Property' },
    { id: 'additional', name: 'Additional Fields' },
  ];

  // Check if BULK SKU exists
  const hasBulkSKU = ticket.skuVariants && ticket.skuVariants.some(v => v.type === 'BULK');

  const renderDataTable = (data) => {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return <p className="text-gray-500 text-sm italic">No data available</p>;
    }

    const rows = [];
    const processValue = (value) => {
      if (value === null || value === undefined || value === '') return '—';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Check if it's a simple value/unit object
        if (value.value !== undefined && value.unit !== undefined) {
          return `${value.value} ${value.unit}`;
        }
        // Otherwise render as nested fields
        return (
          <div className="space-y-1">
            {Object.entries(value).map(([k, v]) => (
              <div key={k} className="text-xs">
                <span className="font-medium">{k}:</span> {processValue(v)}
              </div>
            ))}
          </div>
        );
      }
      if (Array.isArray(value)) {
        return value.map((item, i) => (
          <div key={i} className="mb-1">{processValue(item)}</div>
        ));
      }
      return String(value);
    };

    // Field label mappings for special cases
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
      'vendorSAPNumber': 'Vendor SAP Number',
      'sialProductHierarchy': 'SIAL Product Hierarchy',
      'hasExpirationDate': 'Has Expiration Date',
      'hasRetestDate': 'Has Retest Date',
      'hasShelfLife': 'Has Shelf Life',
      'hasIP': 'Has Intellectual Property',
      'autoPopulated': 'Auto Populated',
    };

    Object.entries(data).forEach(([key, value]) => {
      // Skip internal fields
      if (key === '_id' || key === '__v' || key === 'autoPopulated') return;

      // Format the key to be more readable
      let label;
      const lowerKey = key.toLowerCase();

      // Check if we have a special mapping
      if (labelMappings[key]) {
        label = labelMappings[key];
      } else if (labelMappings[lowerKey]) {
        label = labelMappings[lowerKey];
      } else if (key.includes(' ')) {
        // If the key already contains spaces, it's already formatted - use as is
        label = key;
      } else {
        // Convert camelCase to Title Case
        label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
      }

      rows.push(
        <tr key={key} className="border-b border-gray-200 hover:bg-gray-50">
          <td className="px-4 py-3 text-sm font-medium text-gray-700 w-1/3">
            {label}
          </td>
          <td className="px-4 py-3 text-sm text-gray-900">
            {processValue(value)}
          </td>
        </tr>
      );
    });

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            {rows}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBasicInfo = () => {
    // Collect all basic information fields from the ticket
    const basicFields = {
      productName: ticket.productName,
      sbu: ticket.sbu,
      productionType: ticket.productionType,
      primaryPlant: ticket.primaryPlant,
      brand: ticket.brand,
      productScope: ticket.productScope,
      distributionType: ticket.distributionType,
      businessLine: ticket.businessLine,
      materialGroup: ticket.materialGroup,
      countryOfOrigin: ticket.countryOfOrigin,
      similarProducts: ticket.similarProducts,
      sialProductHierarchy: ticket.sialProductHierarchy,
      retestOrExpiration: ticket.retestOrExpiration,
    };

    return renderDataTable(basicFields);
  };

  const renderChemicalProperties = () => {
    if (!ticket.chemicalProperties) {
      return <p className="text-gray-500 text-sm italic">No chemical properties data available</p>;
    }

    // Property label mappings for additional PubChem properties
    const additionalPropertyLabels = {
      'meltingPoint': 'Melting Point',
      'boilingPoint': 'Boiling Point',
      'flashPoint': 'Flash Point',
      'density': 'Density',
      'vaporPressure': 'Vapor Pressure',
      'vaporDensity': 'Vapor Density',
      'refractiveIndex': 'Refractive Index',
      'logP': 'LogP',
      'polarSurfaceArea': 'Polar Surface Area',
      'hydrogenBondDonor': 'H-Bond Donors',
      'hydrogenBondAcceptor': 'H-Bond Acceptors',
      'rotatableBonds': 'Rotatable Bonds',
      'exactMass': 'Exact Mass',
      'monoisotopicMass': 'Monoisotopic Mass',
      'complexity': 'Complexity',
      'heavyAtomCount': 'Heavy Atom Count',
      'charge': 'Charge'
    };

    // Separate core properties from additional properties and raw PubChem data
    const { additionalProperties, pubchemData, ...coreProperties } = ticket.chemicalProperties;

    // Build the data object with core properties first
    const chemPropsData = { ...coreProperties };

    // Only add the visible additional properties (ones the PM explicitly added)
    if (additionalProperties && additionalProperties.visibleProperties) {
      additionalProperties.visibleProperties.forEach(propKey => {
        const value = additionalProperties[propKey];
        if (value !== null && value !== undefined && value !== '') {
          const label = additionalPropertyLabels[propKey] || propKey;
          chemPropsData[label] = value;
        }
      });
    }

    return renderDataTable(chemPropsData);
  };

  const renderVendorInfo = () => {
    if (!ticket.vendorInformation || ticket.productionType !== 'Procured') {
      return <p className="text-gray-500 text-sm italic">Not applicable (product is not procured from vendor)</p>;
    }

    return renderDataTable(ticket.vendorInformation);
  };

  const renderComposition = () => {
    if (!ticket.composition || !ticket.composition.components || ticket.composition.components.length === 0) {
      return <p className="text-gray-500 text-sm italic">No composition data available</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proprietary</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Component CAS</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component Formula</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ticket.composition.components.map((component, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    component.proprietary
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {component.proprietary ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">{component.componentCAS || '—'}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{component.weightPercent ? `${component.weightPercent}%` : '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{component.componentName || '—'}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">{component.componentFormula || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {ticket.composition.components.length > 0 && (
          <div className="mt-2 px-4 py-2 bg-gray-50 text-sm">
            <span className="font-medium">Total: </span>
            {ticket.composition.components.reduce((sum, comp) => sum + parseFloat(comp.weightPercent || 0), 0).toFixed(2)}%
          </div>
        )}
      </div>
    );
  };

  const renderQualitySpecs = () => {
    const hasQualityData = ticket.quality || ticket.retestOrExpiration;

    if (!hasQualityData) {
      return <p className="text-gray-500 text-sm italic">No quality specifications data available</p>;
    }

    return (
      <div className="space-y-6">
        {/* MQ Quality Level */}
        {ticket.quality?.mqQualityLevel && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">MQ Quality Level</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                {ticket.quality.mqQualityLevel}
              </span>
            </div>
          </div>
        )}

        {/* Product Dating Information */}
        {ticket.retestOrExpiration && (ticket.retestOrExpiration.hasExpirationDate || ticket.retestOrExpiration.hasRetestDate || ticket.retestOrExpiration.hasShelfLife) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Product Dating</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dating Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ticket.retestOrExpiration.hasExpirationDate && ticket.retestOrExpiration.expirationPeriod?.value && (
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">Expiration Date</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {ticket.retestOrExpiration.expirationPeriod.value} {ticket.retestOrExpiration.expirationPeriod.unit}
                      </td>
                    </tr>
                  )}
                  {ticket.retestOrExpiration.hasRetestDate && ticket.retestOrExpiration.retestPeriod?.value && (
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">Retest Date</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {ticket.retestOrExpiration.retestPeriod.value} {ticket.retestOrExpiration.retestPeriod.unit}
                      </td>
                    </tr>
                  )}
                  {ticket.retestOrExpiration.hasShelfLife && ticket.retestOrExpiration.shelfLifePeriod?.value && (
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">Shelf Life</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {ticket.retestOrExpiration.shelfLifePeriod.value} {ticket.retestOrExpiration.shelfLifePeriod.unit}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quality Attributes */}
        {ticket.quality?.attributes && ticket.quality.attributes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quality Attributes</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test/Attribute
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Source
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value/Range
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comments
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ticket.quality.attributes.map((attr, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{attr.testAttribute || '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          attr.dataSource === 'QC'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {attr.dataSource || 'QC'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{attr.valueRange || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{attr.comments || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Show message if no data in any section */}
        {!ticket.quality?.mqQualityLevel &&
         !ticket.quality?.attributes?.length &&
         !(ticket.retestOrExpiration && (ticket.retestOrExpiration.hasExpirationDate || ticket.retestOrExpiration.hasRetestDate || ticket.retestOrExpiration.hasShelfLife)) && (
          <p className="text-gray-500 text-sm italic">No quality specifications data available</p>
        )}
      </div>
    );
  };

  const renderSKUs = () => {
    const hasVariants = ticket.skuVariants && ticket.skuVariants.length > 0;

    if (!hasVariants && !editingSKUs) {
      return (
        <div className="space-y-4">
          <div className="flex justify-end">
            {!isTicketLocked() && (isPMOPS || isAdmin) && (
              <button
                onClick={handleEditSKUs}
                className="px-4 py-2 text-sm font-medium text-white bg-millipore-blue border border-transparent rounded-md hover:bg-millipore-blue-dark"
              >
                Add SKU Variants
              </button>
            )}
          </div>
          <p className="text-gray-500 text-sm italic">No SKU variants available</p>
        </div>
      );
    }

    const basePartNumber = ticket.partNumber?.baseNumber || partNumber;

    // Define column configuration with nested field support
    // Only show fields that Product Manager can submit
    const columnConfig = [
      {
        key: 'partNumber',
        label: 'Part Number',
        getValue: (v) => basePartNumber ? `${basePartNumber}-${getPartNumberSuffix(v.type)}` : '—'
      },
      { key: 'sku', label: 'SKU', getValue: (v) => v.sku },
      { key: 'description', label: 'Description', getValue: (v) => v.description },
      {
        key: 'packageSize',
        label: 'Package Size',
        getValue: (v) => v.packageSize && v.packageSize.value && v.packageSize.unit
          ? `${v.packageSize.value} ${v.packageSize.unit}`
          : null
      },
      {
        key: 'netWeight',
        label: 'Net Weight',
        getValue: (v) => v.netWeight && v.netWeight.value && v.netWeight.unit
          ? `${v.netWeight.value} ${v.netWeight.unit}`
          : null
      },
      {
        key: 'grossWeight',
        label: 'Gross Weight',
        getValue: (v) => v.grossWeight && v.grossWeight.value && v.grossWeight.unit
          ? `${v.grossWeight.value} ${v.grossWeight.unit}`
          : null
      },
      {
        key: 'volume',
        label: 'Volume',
        getValue: (v) => v.volume && v.volume.value && v.volume.unit
          ? `${v.volume.value} ${v.volume.unit}`
          : null
      },
      {
        key: 'listPrice',
        label: 'List Price',
        getValue: (v) => v.pricing?.listPrice
          ? `$${v.pricing.listPrice.toFixed(2)}`
          : null
      },
      {
        key: 'limitPrice',
        label: 'Limit Price',
        getValue: (v) => v.pricing?.limitPrice
          ? `$${v.pricing.limitPrice.toFixed(2)}`
          : null
      },
      {
        key: 'standardCost',
        label: 'Standard Cost',
        getValue: (v) => v.pricing?.standardCost
          ? `$${v.pricing.standardCost.toFixed(2)}`
          : null
      },
      {
        key: 'forecastYear1',
        label: 'Forecast Year 1',
        getValue: (v) => v.forecastedSalesVolume?.year1
      },
      {
        key: 'forecastYear2',
        label: 'Forecast Year 2',
        getValue: (v) => v.forecastedSalesVolume?.year2
      },
      {
        key: 'forecastYear3',
        label: 'Forecast Year 3',
        getValue: (v) => v.forecastedSalesVolume?.year3
      },
    ];

    // Check which columns have data
    const columnsWithData = columnConfig.filter(col =>
      ticket.skuVariants.some(variant => {
        const value = col.getValue(variant);
        return value !== null && value !== undefined && value !== '';
      })
    );

    const skusToDisplay = editingSKUs ? editedSKUs : ticket.skuVariants;

    return (
      <div className="space-y-4">
        {/* Edit/Save Buttons */}
        <div className="flex justify-end space-x-3">
          {editingSKUs ? (
            <>
              <button
                onClick={handleCancelEditSKUs}
                disabled={savingSKUs}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSKU}
                disabled={savingSKUs}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                + Add SKU Variant
              </button>
              <button
                onClick={handleSaveSKUs}
                disabled={savingSKUs}
                className="px-4 py-2 text-sm font-medium text-white bg-millipore-blue border border-transparent rounded-md hover:bg-millipore-blue-dark disabled:opacity-50"
              >
                {savingSKUs ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            !isTicketLocked() && (isPMOPS || isAdmin) && (
              <button
                onClick={handleEditSKUs}
                className="px-4 py-2 text-sm font-medium text-white bg-millipore-blue border border-transparent rounded-md hover:bg-millipore-blue-dark"
              >
                Edit SKUs
              </button>
            )
          )}
        </div>

        {/* Base Unit Section - Only show when editing SKUs */}
        {editingSKUs && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Base Unit Size</h4>
            <p className="text-xs text-gray-600 mb-3">
              The base unit defines the package size for BULK SKUs. All BULK variants will use this size and cannot deviate.
            </p>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={baseUnit.value}
                    onChange={(e) => handleBaseUnitChange('value', e.target.value)}
                    placeholder="Value"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-millipore-blue focus:border-millipore-blue text-sm"
                    disabled={savingBaseUnit}
                  />
                  <select
                    value={baseUnit.unit}
                    onChange={(e) => handleBaseUnitChange('unit', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-millipore-blue focus:border-millipore-blue text-sm"
                    disabled={savingBaseUnit}
                  >
                    <option value="mg">mg</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="mL">mL</option>
                    <option value="L">L</option>
                  </select>
                </div>
                {ticket.baseUnit?.value && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Current base unit: {ticket.baseUnit.value} {ticket.baseUnit.unit}
                  </p>
                )}
              </div>
              <button
                onClick={handleSaveBaseUnit}
                disabled={savingBaseUnit || !baseUnit.value || baseUnit.value <= 0 || isTicketLocked()}
                className="bg-millipore-blue text-white px-4 py-2 rounded-md hover:bg-millipore-blue-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {savingBaseUnit ? 'Saving...' : isTicketLocked() ? 'Ticket Locked' : (ticket.baseUnit?.value ? 'Update Base Unit' : 'Set Base Unit')}
              </button>
            </div>
          </div>
        )}

        {/* Part Number Assignment - PMOps/Admin Only */}
        {(isPMOPS || isAdmin) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Part Number Assignment</h4>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Base Part Number
                </label>
                <input
                  type="text"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="e.g., 1234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-millipore-blue focus:border-millipore-blue text-sm"
                  disabled={savingPartNumber || (!!ticket.partNumber?.baseNumber && !editingSKUs) || isTicketLocked()}
                />
                {ticket.partNumber?.baseNumber && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Part number assigned: {ticket.partNumber.baseNumber}
                  </p>
                )}
              </div>
              {(!ticket.partNumber?.baseNumber || editingSKUs) && !isTicketLocked() && (
                <button
                  onClick={handleSavePartNumber}
                  disabled={savingPartNumber || !partNumber.trim()}
                  className="mt-5 bg-millipore-blue text-white px-4 py-2 rounded-md hover:bg-millipore-blue-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {savingPartNumber ? 'Saving...' : (ticket.partNumber?.baseNumber ? 'Update Part Number' : 'Assign Part Number')}
                </button>
              )}
            </div>
            {basePartNumber && ticket.skuVariants && ticket.skuVariants.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs font-medium text-gray-700 mb-2">Generated Part Numbers:</p>
                <div className="flex flex-wrap gap-2">
                  {ticket.skuVariants.map((variant, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-md text-xs font-mono bg-white border border-blue-300 text-gray-800">
                      {basePartNumber}-{getPartNumberSuffix(variant)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Number</th>
                {editingSKUs && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suffix</th>}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Weight</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Weight</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">List Price</th>
                {editingSKUs && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {skusToDisplay.map((variant, variantIdx) => (
                <tr key={variantIdx} className={`hover:bg-gray-50 ${variant.type === 'BULK' ? 'bg-green-50/30' : ''}`}>
                  {/* Type */}
                  <td className="px-4 py-3 text-sm">
                    {editingSKUs ? (
                      <select
                        value={variant.type}
                        onChange={(e) => handleUpdateSKUField(variantIdx, 'type', e.target.value)}
                        className="form-select text-sm"
                      >
                        <option value="BULK">BULK</option>
                        <option value="VAR">VAR</option>
                        <option value="CONF">CONF</option>
                        <option value="SPEC">SPEC</option>
                        <option value="PREPACK">PREPACK</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        variant.type === 'BULK'
                          ? 'bg-green-100 text-green-800'
                          : variant.type === 'PREPACK'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {variant.type}
                      </span>
                    )}
                  </td>

                  {/* Part Number */}
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    {basePartNumber ? `${basePartNumber}-${getPartNumberSuffix(variant)}` : '—'}
                  </td>

                  {/* Suffix (edit mode only) */}
                  {editingSKUs && (
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="text"
                        value={variant.suffix || getPartNumberSuffix(variant)}
                        onChange={(e) => handleUpdateSKUField(variantIdx, 'suffix', e.target.value.toUpperCase())}
                        className="form-input text-sm font-mono w-24"
                        placeholder="e.g., 100G"
                      />
                    </td>
                  )}

                  {/* Package Size - Only show for PREPACK and BULK */}
                  <td className="px-4 py-3 text-sm">
                    {(variant.type === 'VAR' || variant.type === 'CONF' || variant.type === 'SPEC') ? (
                      <span className="text-gray-400 italic">N/A</span>
                    ) : variant.type === 'BULK' ? (
                      // BULK uses base unit and is locked
                      <span className="font-medium">
                        {variant.packageSize?.value && variant.packageSize?.unit
                          ? `${variant.packageSize.value} ${variant.packageSize.unit}`
                          : '—'}
                      </span>
                    ) : editingSKUs ? (
                      // PREPACK can be edited
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={variant.packageSize?.value || ''}
                          onChange={(e) => handleUpdateSKUField(variantIdx, 'packageSize.value', e.target.value)}
                          className="form-input text-sm w-20"
                          placeholder="Value"
                        />
                        <select
                          value={variant.packageSize?.unit || 'g'}
                          onChange={(e) => handleUpdateSKUField(variantIdx, 'packageSize.unit', e.target.value)}
                          className="form-select text-sm w-16"
                        >
                          <option value="mg">mg</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="mL">mL</option>
                          <option value="L">L</option>
                        </select>
                      </div>
                    ) : (
                      <span>
                        {variant.packageSize?.value && variant.packageSize?.unit
                          ? `${variant.packageSize.value} ${variant.packageSize.unit}`
                          : '—'}
                      </span>
                    )}
                  </td>

                  {/* Net Weight */}
                  <td className="px-4 py-3 text-sm">
                    {variant.type === 'BULK' ? (
                      <span className="text-gray-400 italic">—</span>
                    ) : editingSKUs ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={variant.netWeight?.value || ''}
                          onChange={(e) => handleUpdateSKUField(variantIdx, 'netWeight.value', e.target.value)}
                          className="form-input text-sm w-20"
                          placeholder="Value"
                        />
                        <select
                          value={variant.netWeight?.unit || 'g'}
                          onChange={(e) => handleUpdateSKUField(variantIdx, 'netWeight.unit', e.target.value)}
                          className="form-select text-sm w-16"
                        >
                          <option value="mg">mg</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                        </select>
                      </div>
                    ) : (
                      <span>
                        {variant.netWeight?.value && variant.netWeight?.unit
                          ? `${variant.netWeight.value} ${variant.netWeight.unit}`
                          : '—'}
                      </span>
                    )}
                  </td>

                  {/* Gross Weight */}
                  <td className="px-4 py-3 text-sm">
                    {variant.type === 'BULK' ? (
                      <span className="text-gray-400 italic">—</span>
                    ) : editingSKUs ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={variant.grossWeight?.value || ''}
                          onChange={(e) => handleUpdateSKUField(variantIdx, 'grossWeight.value', e.target.value)}
                          className="form-input text-sm w-20"
                          placeholder="Value"
                        />
                        <select
                          value={variant.grossWeight?.unit || 'g'}
                          onChange={(e) => handleUpdateSKUField(variantIdx, 'grossWeight.unit', e.target.value)}
                          className="form-select text-sm w-16"
                        >
                          <option value="mg">mg</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                        </select>
                      </div>
                    ) : (
                      <span>
                        {variant.grossWeight?.value && variant.grossWeight?.unit
                          ? `${variant.grossWeight.value} ${variant.grossWeight.unit}`
                          : '—'}
                      </span>
                    )}
                  </td>

                  {/* Volume */}
                  <td className="px-4 py-3 text-sm">
                    {variant.type === 'BULK' ? (
                      <span className="text-gray-400 italic">—</span>
                    ) : editingSKUs ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={variant.volume?.value || ''}
                          onChange={(e) => handleUpdateSKUField(variantIdx, 'volume.value', e.target.value)}
                          className="form-input text-sm w-20"
                          placeholder="Value"
                        />
                        <select
                          value={variant.volume?.unit || 'mL'}
                          onChange={(e) => handleUpdateSKUField(variantIdx, 'volume.unit', e.target.value)}
                          className="form-select text-sm w-16"
                        >
                          <option value="mL">mL</option>
                          <option value="L">L</option>
                        </select>
                      </div>
                    ) : (
                      <span>
                        {variant.volume?.value && variant.volume?.unit
                          ? `${variant.volume.value} ${variant.volume.unit}`
                          : '—'}
                      </span>
                    )}
                  </td>

                  {/* List Price */}
                  <td className="px-4 py-3 text-sm">
                    {variant.type === 'BULK' ? (
                      <span className="text-gray-400 italic">—</span>
                    ) : editingSKUs ? (
                      <input
                        type="number"
                        step="0.01"
                        value={variant.pricing?.listPrice || ''}
                        onChange={(e) => handleUpdateSKUField(variantIdx, 'pricing.listPrice', parseFloat(e.target.value) || '')}
                        className="form-input text-sm w-24"
                        placeholder="0.00"
                      />
                    ) : (
                      <span className="font-bold text-green-600">
                        {variant.pricing?.listPrice ? `$${variant.pricing.listPrice.toFixed(2)}` : '—'}
                      </span>
                    )}
                  </td>

                  {/* Actions (edit mode only) */}
                  {editingSKUs && (
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleRemoveSKU(variantIdx)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Prepack Forecast Table - Only show if there are prepacks with forecast data */}
        {(() => {
          const prepacksWithForecast = skusToDisplay.filter(variant =>
            variant.type === 'PREPACK' &&
            variant.forecastedSalesVolume &&
            (variant.forecastedSalesVolume.year1 ||
             variant.forecastedSalesVolume.year2 ||
             variant.forecastedSalesVolume.year3)
          );

          if (prepacksWithForecast.length === 0) return null;

          return (
            <div className="mt-8">
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Prepack Sales Forecast</h4>
                <p className="text-xs text-gray-500 mt-1">Forecasted sales volumes for PREPACK SKUs</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Part Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Package Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Forecast Year 1</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Forecast Year 2</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Forecast Year 3</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prepacksWithForecast.map((variant, idx) => (
                      <tr key={idx} className="hover:bg-purple-50/30">
                        {/* Type */}
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {variant.type}
                          </span>
                        </td>

                        {/* Part Number */}
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {basePartNumber ? `${basePartNumber}-${getPartNumberSuffix(variant)}` : '—'}
                        </td>

                        {/* Package Size */}
                        <td className="px-4 py-3 text-sm font-medium">
                          {variant.packageSize?.value && variant.packageSize?.unit
                            ? `${variant.packageSize.value} ${variant.packageSize.unit}`
                            : '—'}
                        </td>

                        {/* Forecast Year 1 */}
                        <td className="px-4 py-3 text-sm">
                          <span className="font-semibold text-purple-700">
                            {variant.forecastedSalesVolume?.year1 || '—'}
                          </span>
                        </td>

                        {/* Forecast Year 2 */}
                        <td className="px-4 py-3 text-sm">
                          <span className="font-semibold text-purple-700">
                            {variant.forecastedSalesVolume?.year2 || '—'}
                          </span>
                        </td>

                        {/* Forecast Year 3 */}
                        <td className="px-4 py-3 text-sm">
                          <span className="font-semibold text-purple-700">
                            {variant.forecastedSalesVolume?.year3 || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderCorpBaseData = () => {
    if (!ticket.corpbaseData) {
      return <p className="text-gray-500 text-sm italic">No CorpBase data available</p>;
    }

    // Property label mappings for additional PubChem properties
    const additionalPropertyLabels = {
      'meltingPoint': 'Melting Point',
      'boilingPoint': 'Boiling Point',
      'flashPoint': 'Flash Point',
      'density': 'Density',
      'vaporPressure': 'Vapor Pressure',
      'vaporDensity': 'Vapor Density',
      'refractiveIndex': 'Refractive Index',
      'logP': 'LogP',
      'polarSurfaceArea': 'Polar Surface Area',
      'hydrogenBondDonor': 'H-Bond Donors',
      'hydrogenBondAcceptor': 'H-Bond Acceptors',
      'rotatableBonds': 'Rotatable Bonds',
      'exactMass': 'Exact Mass',
      'monoisotopicMass': 'Monoisotopic Mass',
      'complexity': 'Complexity',
      'heavyAtomCount': 'Heavy Atom Count',
      'charge': 'Charge'
    };

    // Build technical specifications from only visible properties
    let technicalSpecs = '';
    if (ticket.chemicalProperties) {
      const specs = [];

      // Add core chemical properties if they exist
      if (ticket.chemicalProperties.molecularFormula) {
        specs.push(`Molecular Formula: ${ticket.chemicalProperties.molecularFormula}`);
      }
      if (ticket.chemicalProperties.molecularWeight) {
        specs.push(`Molecular Weight: ${ticket.chemicalProperties.molecularWeight} g/mol`);
      }
      if (ticket.chemicalProperties.casNumber) {
        specs.push(`CAS Number: ${ticket.chemicalProperties.casNumber}`);
      }
      if (ticket.chemicalProperties.canonicalSMILES) {
        specs.push(`Canonical SMILES: ${ticket.chemicalProperties.canonicalSMILES}`);
      }

      // Only add the visible additional properties (ones the PM explicitly added)
      if (ticket.chemicalProperties.additionalProperties &&
          ticket.chemicalProperties.additionalProperties.visibleProperties) {
        ticket.chemicalProperties.additionalProperties.visibleProperties.forEach(propKey => {
          const value = ticket.chemicalProperties.additionalProperties[propKey];
          if (value !== null && value !== undefined && value !== '') {
            const label = additionalPropertyLabels[propKey] || propKey;
            specs.push(`${label}: ${value}`);
          }
        });
      }

      technicalSpecs = specs.join('\n');
    }

    // Separate HTML fields from other fields
    const htmlFields = {
      productDescription: ticket.corpbaseData.productDescription,
      keyFeatures: ticket.corpbaseData.keyFeatures,
      applications: ticket.corpbaseData.applications
    };

    const otherFields = {
      technicalSpecifications: technicalSpecs || 'No technical specifications available',
      unspscCode: ticket.corpbaseData.unspscCode,
      hazardStatement: ticket.corpbaseData.hazardStatement,
      safetyStatement: ticket.corpbaseData.safetyStatement
    };

    return (
      <div className="space-y-6">
        {/* Toggle for HTML Display Mode */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">HTML Display Mode:</span>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${!showFormattedHtml ? 'font-semibold text-blue-700' : 'text-gray-500'}`}>
                Raw HTML
              </span>
              <button
                onClick={() => setShowFormattedHtml(!showFormattedHtml)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  showFormattedHtml ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showFormattedHtml ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${showFormattedHtml ? 'font-semibold text-blue-700' : 'text-gray-500'}`}>
                Formatted
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            {showFormattedHtml ? 'Showing formatted HTML as it will appear on the website' : 'Showing raw HTML code with tags'}
          </p>
        </div>

        {/* HTML Fields with Preview Buttons */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Product Description */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 w-1/3 align-top">
                  Product Description
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {htmlFields.productDescription ? (
                        showFormattedHtml ? (
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: htmlFields.productDescription }}
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                            {htmlFields.productDescription}
                          </pre>
                        )
                      ) : (
                        <span className="text-gray-500 italic">—</span>
                      )}
                    </div>
                    {htmlFields.productDescription && (
                      <button
                        onClick={() => handlePreview('Product Description', htmlFields.productDescription)}
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                      >
                        Edit HTML
                      </button>
                    )}
                  </div>
                </td>
              </tr>

              {/* Key Features & Benefits */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 w-1/3 align-top">
                  Key Features & Benefits
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {htmlFields.keyFeatures ? (
                        showFormattedHtml ? (
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: htmlFields.keyFeatures }}
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                            {htmlFields.keyFeatures}
                          </pre>
                        )
                      ) : (
                        <span className="text-gray-500 italic">—</span>
                      )}
                    </div>
                    {htmlFields.keyFeatures && (
                      <button
                        onClick={() => handlePreview('Key Features & Benefits', htmlFields.keyFeatures)}
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                      >
                        Edit HTML
                      </button>
                    )}
                  </div>
                </td>
              </tr>

              {/* Applications */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 w-1/3 align-top">
                  Applications
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {htmlFields.applications ? (
                        showFormattedHtml ? (
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: htmlFields.applications }}
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                            {htmlFields.applications}
                          </pre>
                        )
                      ) : (
                        <span className="text-gray-500 italic">—</span>
                      )}
                    </div>
                    {htmlFields.applications && (
                      <button
                        onClick={() => handlePreview('Applications', htmlFields.applications)}
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                      >
                        Edit HTML
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Other Fields */}
        {renderDataTable(otherFields)}
      </div>
    );
  };

  const renderIntellectualProperty = () => {
    if (!ticket.intellectualProperty || !ticket.intellectualProperty.hasIP) {
      return <p className="text-gray-500 text-sm italic">No intellectual property data</p>;
    }

    return renderDataTable(ticket.intellectualProperty);
  };

  const renderAdditionalFields = () => {
    // Collect all fields that aren't in standard categories
    const excludeFields = [
      '_id', '__v', 'ticketNumber', 'status', 'createdBy', 'updatedAt', 'createdAt',
      'productName', 'sbu', 'productionType', 'primaryPlant', 'brand', 'priority',
      'productScope', 'distributionType', 'businessLine', 'materialGroup',
      'countryOfOrigin', 'similarProducts', 'sialProductHierarchy', 'retestOrExpiration',
      'chemicalProperties', 'vendorInformation', 'composition', 'quality',
      'corpbaseData', 'intellectualProperty', 'skuVariants', 'targetMargin',
      'materialCostPerUnit', 'totalMaterialCost', 'partNumber', 'statusHistory', 'comments',
      'npdiTracking', 'hazardClassification', 'regulatoryInfo', 'launchTimeline', 'pubchemData'
    ];

    const additionalData = {};
    Object.keys(ticket).forEach(key => {
      if (!excludeFields.includes(key) && ticket[key] !== null && ticket[key] !== undefined) {
        additionalData[key] = ticket[key];
      }
    });

    if (Object.keys(additionalData).length === 0) {
      return <p className="text-gray-500 text-sm italic">No additional fields</p>;
    }

    return renderDataTable(additionalData);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return renderBasicInfo();
      case 'chemical':
        return renderChemicalProperties();
      case 'vendor':
        return renderVendorInfo();
      case 'composition':
        return renderComposition();
      case 'quality':
        return renderQualitySpecs();
      case 'skus':
        return renderSKUs();
      case 'corpbase':
        return renderCorpBaseData();
      case 'intellectualProperty':
        return renderIntellectualProperty();
      case 'additional':
        return renderAdditionalFields();
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow flex min-h-[600px]" data-tab-view="pmops">
      {/* Vertical Navigation */}
      <nav className="w-56 border-r border-gray-200 flex-shrink-0" aria-label="Sections">
        <div className="py-4">
          {tabs.map((tab) => {
            // Only show flags to PMOps/Admin users
            const needsPartNumber = (isPMOPS || isAdmin) && tab.id === 'skus' && !ticket.partNumber?.baseNumber;
            const needsBulk = (isPMOPS || isAdmin) && tab.id === 'skus' && !hasBulkSKU;
            const showOrangeMarker = needsPartNumber;
            const showBlueMarker = !needsPartNumber && needsBulk; // Blue only if orange not shown

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full text-left px-4 py-3 font-medium text-sm transition-colors border-l-4 relative
                  ${activeTab === tab.id
                    ? needsPartNumber
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : needsBulk
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-millipore-blue bg-blue-50 text-millipore-blue'
                    : needsPartNumber
                      ? 'border-orange-300 bg-orange-50/50 text-orange-600 hover:bg-orange-100'
                      : needsBulk
                      ? 'border-blue-300 bg-blue-50/50 text-blue-600 hover:bg-blue-100'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className="flex items-center justify-between">
                  <span>{tab.name}</span>
                  {showOrangeMarker && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">!</span>
                  )}
                  {showBlueMarker && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">!</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tab Content */}
      <div className="flex-1 p-8 overflow-y-auto overflow-x-auto">
        {renderTabContent()}
      </div>

      {/* HTML Preview Modal */}
      {isPreviewOpen && previewField && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 transition-opacity bg-gray-500/75 z-0" onClick={() => setIsPreviewOpen(false)}></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-10">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    HTML Preview: {previewField.field}
                  </h3>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                {/* Preview Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      Rendered HTML Preview
                    </h4>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                      ✓ Accurate website rendering
                    </span>
                  </div>
                  <div
                    className="p-4 bg-white border-2 border-blue-200 rounded-lg shadow-sm min-h-[100px]
                               [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:text-gray-800
                               [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-3 [&_ul]:space-y-1.5
                               [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-3 [&_ol]:space-y-1.5
                               [&_li]:text-gray-700 [&_li]:leading-relaxed
                               [&_strong]:font-semibold [&_strong]:text-gray-900
                               [&_em]:italic [&_em]:text-gray-700
                               [&_sub]:text-xs [&_sub]:align-sub
                               [&_sup]:text-xs [&_sup]:align-super
                               text-base"
                    dangerouslySetInnerHTML={{ __html: fixOrphanedListItems(editedHtml) }}
                  />
                </div>

                {/* HTML Editor Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      HTML Source Code Editor
                    </h4>
                    <span className="text-xs text-gray-500">Select text and click a button to format</span>
                  </div>

                  {/* Formatting Toolbar */}
                  <div className="space-y-2 mb-3">
                    {/* Text Formatting Row */}
                    <div className="flex gap-2 p-2 bg-gray-100 rounded-lg border border-gray-300">
                      <span className="text-xs text-gray-600 font-medium self-center mr-2">Format:</span>
                      <button
                        type="button"
                        onClick={() => applyFormatting('bold')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                        title="Bold (wraps with <strong>)"
                      >
                        <span className="font-bold text-base">B</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatting('italic')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                        title="Italic (wraps with <em>)"
                      >
                        <span className="italic text-base font-serif">I</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatting('sub')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                        title="Subscript (wraps with <sub>)"
                      >
                        <span className="font-medium">X<sub className="text-xs">2</sub></span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatting('sup')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                        title="Superscript (wraps with <sup>)"
                      >
                        <span className="font-medium">X<sup className="text-xs">2</sup></span>
                      </button>
                    </div>

                    {/* Special Characters Row */}
                    <div className="flex gap-2 p-2 bg-gray-100 rounded-lg border border-gray-300">
                      <span className="text-xs text-gray-600 font-medium self-center mr-2">Symbols:</span>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&deg;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                        title="Degree symbol (&deg;)"
                      >
                        °
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&plusmn;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                        title="Plus-minus symbol (&plusmn;)"
                      >
                        ±
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&ge;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                        title="Greater than or equal to (&ge;)"
                      >
                        ≥
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&le;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                        title="Less than or equal to (&le;)"
                      >
                        ≤
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&trade;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                        title="Trademark symbol (&trade;)"
                      >
                        ™
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&reg;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                        title="Registered trademark (&reg;)"
                      >
                        ®
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&alpha;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium italic"
                        title="Greek letter alpha (&alpha;)"
                      >
                        α
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&beta;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium italic"
                        title="Greek letter beta (&beta;)"
                      >
                        β
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&mu;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium italic"
                        title="Greek letter mu / micro (&mu;)"
                      >
                        μ
                      </button>
                    </div>
                  </div>

                  {/* Editable HTML Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={editedHtml}
                    onChange={(e) => setEditedHtml(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono overflow-x-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="10"
                    placeholder="Enter or edit HTML here..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Format:</strong> Select text and click a button to wrap with tags. <strong>Symbols:</strong> Click to insert HTML entity codes (e.g., &amp;deg;, &amp;plusmn;) - guaranteed to work across all systems and browsers.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveHtml}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

PMOpsTabView.displayName = 'PMOpsTabView';

export default PMOpsTabView;
