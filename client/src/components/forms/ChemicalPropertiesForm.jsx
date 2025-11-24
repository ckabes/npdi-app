import React, { useState } from 'react';

/**
 * ChemicalPropertiesForm Component
 * Shared form for chemical properties across ticket creation and editing
 *
 * @param {Object} props
 * @param {Function} props.register - react-hook-form register function
 * @param {Function} props.watch - react-hook-form watch function
 * @param {Function} props.setValue - react-hook-form setValue function
 * @param {Object} props.errors - form validation errors
 * @param {boolean} props.autoPopulated - whether data was auto-populated from PubChem
 * @param {boolean} props.casLookupLoading - whether CAS lookup is in progress
 * @param {Function} props.onCASLookup - callback for CAS lookup button
 * @param {boolean} props.readOnly - whether form should be read-only
 * @param {boolean} props.showAutoPopulateButton - whether to show auto-populate button
 * @param {Set} props.sapImportedFields - set of field paths that were imported from SAP
 * @param {Function} props.getSAPImportedClass - function to get CSS class for SAP-imported fields
 * @param {Function} props.onFieldEdit - handler for when a field is edited (removes green highlight)
 */
const ChemicalPropertiesForm = ({
  register,
  watch,
  setValue,
  errors = {},
  autoPopulated = false,
  casLookupLoading = false,
  onCASLookup,
  readOnly = false,
  showAutoPopulateButton = true,
  sapImportedFields = new Set(),
  getSAPImportedClass = () => '',
  onFieldEdit = null
}) => {
  const casNumber = watch('chemicalProperties.casNumber');
  const visibleProperties = watch('chemicalProperties.additionalProperties.visibleProperties') || [];
  const additionalProps = watch('chemicalProperties.additionalProperties') || {};
  const [showAddPropertyMenu, setShowAddPropertyMenu] = useState(false);
  const [valueSelectionModal, setValueSelectionModal] = useState(null);

  // Track which fields have been manually edited (lose green background when edited)
  const [editedFields, setEditedFields] = useState(new Set());

  // Helper function to mark a field as edited
  const markFieldAsEdited = (fieldName) => {
    setEditedFields(prev => new Set([...prev, fieldName]));
  };

  // Helper function to check if field should have green background
  const isFieldAutoPopulated = (fieldName) => {
    if (!autoPopulated || editedFields.has(fieldName)) {
      return false;
    }

    // Check if the field actually has a value
    const fieldValue = watch(`chemicalProperties.${fieldName}`);
    return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
  };

  // Debug logging
  console.log('ChemicalPropertiesForm - additionalProps:', additionalProps);

  // Available properties that can be added
  const availableProperties = [
    { key: 'meltingPoint', label: 'Melting Point' },
    { key: 'boilingPoint', label: 'Boiling Point' },
    { key: 'flashPoint', label: 'Flash Point' },
    { key: 'density', label: 'Density' },
    { key: 'vaporPressure', label: 'Vapor Pressure' },
    { key: 'vaporDensity', label: 'Vapor Density' },
    { key: 'refractiveIndex', label: 'Refractive Index' },
    { key: 'logP', label: 'LogP' },
    { key: 'polarSurfaceArea', label: 'Polar Surface Area' },
    { key: 'hydrogenBondDonor', label: 'H-Bond Donors' },
    { key: 'hydrogenBondAcceptor', label: 'H-Bond Acceptors' },
    { key: 'rotatableBonds', label: 'Rotatable Bonds' },
    { key: 'exactMass', label: 'Exact Mass' },
    { key: 'monoisotopicMass', label: 'Monoisotopic Mass' },
    { key: 'complexity', label: 'Complexity' },
    { key: 'heavyAtomCount', label: 'Heavy Atom Count' },
    { key: 'charge', label: 'Charge' }
  ];

  const addProperty = (propertyKey) => {
    if (!visibleProperties.includes(propertyKey)) {
      // Check if the property has multiple semicolon-separated Celsius values
      const propertyValue = additionalProps[propertyKey];
      if (propertyValue && typeof propertyValue === 'string' && propertyValue.includes('; ')) {
        // Split by semicolon and check if there are multiple Celsius values
        const values = propertyValue.split('; ').map(v => v.trim()).filter(Boolean);
        const celsiusValues = values.filter(v => v.includes('°C') || v.includes('deg C') || v.includes('degC'));

        if (celsiusValues.length > 1) {
          // Show modal to let user choose
          const prop = availableProperties.find(p => p.key === propertyKey);
          setValueSelectionModal({
            propertyKey,
            propertyLabel: prop?.label || propertyKey,
            values: celsiusValues
          });
          setShowAddPropertyMenu(false);
          return;
        }
      }

      // No multiple values or only one value - add directly
      const updatedVisible = [...visibleProperties, propertyKey];
      setValue('chemicalProperties.additionalProperties.visibleProperties', updatedVisible, { shouldDirty: true });
    }
    setShowAddPropertyMenu(false);
  };

  const selectPropertyValue = (selectedValue) => {
    if (valueSelectionModal) {
      const { propertyKey } = valueSelectionModal;

      // Set the selected value
      setValue(`chemicalProperties.additionalProperties.${propertyKey}`, selectedValue, { shouldDirty: true });

      // Add to visible properties
      const updatedVisible = [...visibleProperties, propertyKey];
      setValue('chemicalProperties.additionalProperties.visibleProperties', updatedVisible, { shouldDirty: true });

      // Close modal
      setValueSelectionModal(null);
    }
  };

  const removeProperty = (propertyKey) => {
    const updatedVisible = visibleProperties.filter(key => key !== propertyKey);
    setValue('chemicalProperties.additionalProperties.visibleProperties', updatedVisible, { shouldDirty: true });
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-gray-900">Chemical Properties</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            PubChem Integration
          </span>
        </div>
      </div>
      <div className="card-body space-y-6">
        {autoPopulated && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Chemical data auto-populated from PubChem
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Chemical properties, hazard information, and SKU variants have been automatically populated. Please review and modify as needed.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                CAS Number *
              </label>
              {showAutoPopulateButton && onCASLookup && (
                <button
                  type="button"
                  onClick={onCASLookup}
                  disabled={casLookupLoading || !casNumber || readOnly}
                  className="text-sm bg-millipore-blue text-white px-3 py-1 rounded hover:bg-millipore-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {casLookupLoading ? 'Loading...' : 'Auto-populate'}
                </button>
              )}
            </div>
            <input
              {...register('chemicalProperties.casNumber', {
                required: 'CAS number is required',
                pattern: {
                  value: /^\d+-\d{2}-\d$/,
                  message: 'Please enter a valid CAS number (e.g., 64-17-5 or 1234567-89-0)'
                }
              })}
              type="text"
              className={`form-input ${getSAPImportedClass('chemicalProperties.casNumber')}`}
              placeholder="e.g., 64-17-5"
              readOnly={readOnly}
              onChange={(e) => {
                // Automatically trim leading and trailing spaces
                const trimmedValue = e.target.value.trim();
                if (trimmedValue !== e.target.value) {
                  setValue('chemicalProperties.casNumber', trimmedValue, { shouldDirty: true });
                }
              }}
              onPaste={(e) => {
                // Handle paste events to trim immediately
                e.preventDefault();
                const pastedText = e.clipboardData.getData('text');
                const trimmedText = pastedText.trim();
                setValue('chemicalProperties.casNumber', trimmedText, { shouldDirty: true });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (onCASLookup && !casLookupLoading && casNumber && !readOnly) {
                    onCASLookup();
                  }
                }
              }}
            />
            {errors.chemicalProperties?.casNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.chemicalProperties.casNumber.message}</p>
            )}
            {showAutoPopulateButton && !readOnly && (
              <p className="mt-1 text-xs text-gray-500">
                Enter CAS number and click 'Auto-populate' to fetch chemical data from PubChem
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Molecular Formula
            </label>
            <input
              {...register('chemicalProperties.molecularFormula')}
              type="text"
              className={`form-input ${isFieldAutoPopulated('molecularFormula') ? 'bg-green-50' : ''}`}
              placeholder="e.g., C2H6O"
              readOnly={readOnly}
              onChange={(e) => {
                markFieldAsEdited('molecularFormula');
              }}
            />
            {isFieldAutoPopulated('molecularFormula') && (
              <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem (editable)</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IUPAC Name
            </label>
            <input
              {...register('chemicalProperties.iupacName')}
              type="text"
              className={`form-input ${isFieldAutoPopulated('iupacName') ? 'bg-green-50' : ''}`}
              placeholder="IUPAC systematic name"
              readOnly={readOnly}
              onChange={(e) => {
                markFieldAsEdited('iupacName');
              }}
            />
            {isFieldAutoPopulated('iupacName') && (
              <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem (editable)</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Molecular Weight (g/mol)
            </label>
            <input
              {...register('chemicalProperties.molecularWeight')}
              type="number"
              step="0.01"
              className={`form-input ${isFieldAutoPopulated('molecularWeight') ? 'bg-green-50' : ''}`}
              placeholder="g/mol"
              readOnly={readOnly}
              onChange={(e) => {
                markFieldAsEdited('molecularWeight');
              }}
            />
            {isFieldAutoPopulated('molecularWeight') && (
              <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem (editable)</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMILES
            </label>
            <input
              {...register('chemicalProperties.canonicalSMILES')}
              type="text"
              className={`form-input ${isFieldAutoPopulated('canonicalSMILES') ? 'bg-green-50' : ''}`}
              placeholder="e.g., CCO (for ethanol)"
              readOnly={readOnly}
              onChange={(e) => {
                markFieldAsEdited('canonicalSMILES');
              }}
            />
            {autoPopulated && (
              <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem</p>
            )}
            {!autoPopulated && !readOnly && (
              <p className="mt-1 text-xs text-gray-500">Simplified Molecular-Input Line-Entry System</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              InChI
            </label>
            <textarea
              {...register('chemicalProperties.inchi')}
              rows="2"
              className={`form-input ${isFieldAutoPopulated('inchi') ? 'bg-green-50' : ''}`}
              placeholder="International Chemical Identifier"
              readOnly={readOnly}
              onChange={(e) => {
                markFieldAsEdited('inchi');
              }}
            />
            {isFieldAutoPopulated('inchi') && (
              <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem (editable)</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              InChI Key
            </label>
            <input
              {...register('chemicalProperties.inchiKey')}
              type="text"
              className={`form-input ${isFieldAutoPopulated('inchiKey') ? 'bg-green-50' : ''}`}
              placeholder="Hashed InChI identifier"
              readOnly={readOnly}
              onChange={(e) => {
                markFieldAsEdited('inchiKey');
              }}
            />
            {isFieldAutoPopulated('inchiKey') && (
              <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem (editable)</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Physical State
            </label>
            <select
              {...register('chemicalProperties.physicalState')}
              className="form-select"
              disabled={readOnly}
            >
              <option value="Solid">Solid</option>
              <option value="Liquid">Liquid</option>
              <option value="Gas">Gas</option>
              <option value="Powder">Powder</option>
              <option value="Crystal">Crystal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipping Conditions
            </label>
            <select
              {...register('chemicalProperties.shippingConditions')}
              className="form-select"
              disabled={readOnly}
            >
              <option value="Standard">Standard (Ambient)</option>
              <option value="Wet Ice">Wet Ice (2-8°C)</option>
              <option value="Dry Ice">Dry Ice (-20°C to -80°C)</option>
              <option value="Liquid Nitrogen">Liquid Nitrogen (-196°C)</option>
            </select>
          </div>
        </div>

        {/* Material Source and Animal Component - Row 2 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 border-t border-gray-200 pt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Material Source
            </label>
            <select
              {...register('chemicalProperties.materialSource')}
              className="form-select"
              disabled={readOnly}
            >
              <option value="">Select source...</option>
              <option value="Human">Human</option>
              <option value="Plant">Plant</option>
              <option value="Fermentation">Fermentation</option>
              <option value="Recombinant">Recombinant</option>
              <option value="Synthetic">Synthetic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Animal Component
            </label>
            <select
              {...register('chemicalProperties.animalComponent')}
              className="form-select"
              disabled={readOnly}
            >
              <option value="">Select...</option>
              <option value="Animal Component Free">Animal Component Free</option>
              <option value="Animal Component Containing">Animal Component Containing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Storage Temperature
            </label>
            <select
              {...register('chemicalProperties.storageTemperature')}
              onChange={(e) => {
                // Call the original onChange from register
                const event = { target: { name: 'chemicalProperties.storageTemperature', value: e.target.value } };
                register('chemicalProperties.storageTemperature').onChange(event);
                // Call onFieldEdit to remove green highlight
                if (onFieldEdit) {
                  onFieldEdit('chemicalProperties.storageTemperature');
                }
              }}
              className={`form-select ${getSAPImportedClass('chemicalProperties.storageTemperature')}`}
              disabled={readOnly}
            >
              <option value="">Select storage temperature...</option>
              <option value="CL (2-8 deg)">CL (2-8 deg)</option>
              <option value="F0 (-20 C)">F0 (-20 C)</option>
              <option value="F7 (-70 C)">F7 (-70 C)</option>
              <option value="RT (RT Controlled)">RT (RT Controlled)</option>
              <option value="RT (Ambient)">RT (Ambient)</option>
              <option value="F0 (-196 C)">F0 (-196 C)</option>
            </select>
          </div>
        </div>

        {/* Additional PubChem Properties - Expandable */}
        {!readOnly && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Additional Properties</h4>
                <p className="text-xs text-gray-500 mt-1">Properties auto-populated from PubChem (when available)</p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAddPropertyMenu(!showAddPropertyMenu)}
                  className="btn btn-secondary text-sm"
                  disabled={readOnly}
                >
                  + Add Property
                </button>
                {showAddPropertyMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1 max-h-64 overflow-y-auto">
                      {availableProperties
                        .filter(prop => !visibleProperties.includes(prop.key))
                        .map(prop => {
                          const hasData = additionalProps[prop.key] !== null &&
                                         additionalProps[prop.key] !== undefined &&
                                         additionalProps[prop.key] !== '';
                          return (
                            <button
                              key={prop.key}
                              type="button"
                              onClick={() => addProperty(prop.key)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                            >
                              <span>{prop.label}</span>
                              {hasData && (
                                <span className="text-green-600 text-xs">✓ Data available</span>
                              )}
                            </button>
                          );
                        })}
                      {availableProperties.filter(prop => !visibleProperties.includes(prop.key)).length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          All properties are visible
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {visibleProperties.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {visibleProperties.map(propKey => {
                  const prop = availableProperties.find(p => p.key === propKey);
                  if (!prop) return null;

                  const value = additionalProps[propKey];
                  const isPopulated = value !== null && value !== undefined && value !== '';

                  return (
                    <div key={propKey}>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {prop.label}
                        </label>
                        <button
                          type="button"
                          onClick={() => removeProperty(propKey)}
                          className="text-xs text-red-600 hover:text-red-800"
                          disabled={readOnly}
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        {...register(`chemicalProperties.additionalProperties.${propKey}`)}
                        type="text"
                        className={`form-input ${isPopulated && autoPopulated ? 'bg-green-50' : ''}`}
                        placeholder={isPopulated ? '' : 'Enter value or populate from PubChem'}
                        readOnly={readOnly}
                      />
                      {isPopulated && autoPopulated && (
                        <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {visibleProperties.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No additional properties visible</p>
                <p className="text-xs mt-1">Click "Add Property" to show properties populated from PubChem</p>
              </div>
            )}
          </div>
        )}

        {/* Additional Chemical Properties - Full Width Fields */}
        <div className="space-y-6 border-t border-gray-200 pt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Synonyms
            </label>
            <textarea
              {...register('chemicalProperties.synonyms')}
              rows="3"
              className={`form-input ${isFieldAutoPopulated('synonyms') ? 'bg-green-50' : ''}`}
              placeholder="Common names, trade names, alternate chemical names (comma-separated)"
              readOnly={readOnly}
              onChange={(e) => {
                markFieldAsEdited('synonyms');
              }}
            />
            {isFieldAutoPopulated('synonyms') && (
              <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem - limited to 10 most common (editable)</p>
            )}
            {!readOnly && (
              <p className="mt-1 text-xs text-gray-500">
                List of common synonyms and alternative names for this chemical
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hazard Statements
            </label>
            <textarea
              {...register('chemicalProperties.hazardStatements')}
              rows="4"
              className={`form-input ${isFieldAutoPopulated('hazardStatements') ? 'bg-green-50' : ''}`}
              placeholder="GHS hazard statements (H-codes), one per line"
              readOnly={readOnly}
              onChange={(e) => {
                markFieldAsEdited('hazardStatements');
              }}
            />
            {isFieldAutoPopulated('hazardStatements') && (
              <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem GHS data (duplicates removed, editable)</p>
            )}
            {!readOnly && (
              <p className="mt-1 text-xs text-gray-500">
                Globally Harmonized System (GHS) hazard statements such as H302, H315, etc.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UN Number
              </label>
              <input
                {...register('chemicalProperties.unNumber')}
                type="text"
                className={`form-input ${isFieldAutoPopulated('unNumber') ? 'bg-green-50' : ''}`}
                placeholder="e.g., UN1170"
                readOnly={readOnly}
                onChange={(e) => {
                  markFieldAsEdited('unNumber');
                }}
              />
              {isFieldAutoPopulated('unNumber') && (
                <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem (editable)</p>
              )}
              {!readOnly && (
                <p className="mt-1 text-xs text-gray-500">
                  United Nations number for hazardous materials transport
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Value Selection Modal */}
      {valueSelectionModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Select {valueSelectionModal.propertyLabel} Value
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Multiple values are available from PubChem. Please select the value you want to use:
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {valueSelectionModal.values.map((value, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectPropertyValue(value)}
                  className="w-full text-left px-4 py-3 border border-gray-300 rounded-md hover:bg-millipore-blue hover:text-white hover:border-millipore-blue transition-colors"
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setValueSelectionModal(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChemicalPropertiesForm;
