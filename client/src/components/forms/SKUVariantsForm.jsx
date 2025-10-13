import React from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { calculateMarginPercent } from '../../utils/pricingCalculations';

/**
 * SKUVariantsForm Component
 * Shared form for SKU variant management across ticket creation and editing
 *
 * @param {Object} props
 * @param {Function} props.register - react-hook-form register function
 * @param {Function} props.watch - react-hook-form watch function
 * @param {Function} props.setValue - react-hook-form setValue function
 * @param {Array} props.fields - useFieldArray fields for SKU variants
 * @param {Function} props.append - useFieldArray append function
 * @param {Function} props.remove - useFieldArray remove function
 * @param {Function} props.onCalculatePricing - callback for calculate pricing button
 * @param {Function} props.onGenerateStandardSKUs - callback for generate standard SKUs button
 * @param {Function} props.onSKUTypeChange - callback when SKU type changes
 * @param {Function} props.onPackageUnitChange - callback when package unit changes
 * @param {Function} props.onPackageValueChange - callback when package value changes
 * @param {boolean} props.readOnly - whether form should be read-only
 * @param {boolean} props.showActionButtons - whether to show action buttons (generate, calculate)
 * @param {Object} props.errors - form validation errors
 */
const SKUVariantsForm = ({
  register,
  watch,
  setValue,
  fields = [],
  append,
  remove,
  onCalculatePricing,
  onGenerateStandardSKUs,
  onSKUTypeChange,
  onPackageUnitChange,
  onPackageValueChange,
  readOnly = false,
  showActionButtons = true,
  errors = {}
}) => {
  const baseUnit = watch('pricingData.baseUnit') || 'g';

  /**
   * Calculate and display margin for a specific SKU
   */
  const calculateMarginForSKU = (index) => {
    const listPrice = parseFloat(watch(`skuVariants.${index}.pricing.listPrice`)) || 0;
    const calculatedCost = watch(`skuVariants.${index}.pricing.calculatedCost`) || 0;

    return calculateMarginPercent(listPrice, calculatedCost);
  };

  /**
   * Handle adding a new SKU with defaults
   */
  const handleAddSKU = () => {
    const newSKU = {
      type: 'PREPACK',
      sku: '',
      packageSize: { value: 100, unit: baseUnit || 'g' },
      pricing: { listPrice: 0, currency: 'USD' }
    };
    append(newSKU);
  };

  /**
   * Handle SKU type change with defaults
   */
  const handleTypeChange = (index, newType) => {
    // Set default package size based on type
    if (['VAR', 'SPEC', 'CONF'].includes(newType)) {
      setValue(`skuVariants.${index}.packageSize.value`, 1);
      setValue(`skuVariants.${index}.packageSize.unit`, 'kg');
    } else if (newType === 'PREPACK') {
      setValue(`skuVariants.${index}.packageSize.value`, 100);
      setValue(`skuVariants.${index}.packageSize.unit`, baseUnit || 'g');
    }

    // Call parent callback if provided
    if (onSKUTypeChange) {
      onSKUTypeChange(index, newType);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">SKU Variants</h3>
          {showActionButtons && !readOnly && (
            <div className="flex items-center space-x-2">
              {onGenerateStandardSKUs && (
                <button
                  type="button"
                  onClick={onGenerateStandardSKUs}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Generate VAR/CONF/SPEC
                </button>
              )}
              {onCalculatePricing && (
                <button
                  type="button"
                  onClick={onCalculatePricing}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Calculate Pricing
                </button>
              )}
              <button
                type="button"
                onClick={handleAddSKU}
                className="btn btn-secondary flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add SKU
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="card-body space-y-6">
        {fields.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium">No SKU variants created yet</p>
            {showActionButtons && !readOnly && (
              <p className="text-sm">Click "Generate VAR/CONF/SPEC" to create standard SKUs or "Add SKU" to create custom ones</p>
            )}
          </div>
        )}
        {fields.map((field, index) => {
          const skuType = watch(`skuVariants.${index}.type`);
          const showPricing = !['VAR', 'SPEC', 'CONF'].includes(skuType);

          return (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">SKU #{index + 1}</h4>
                {fields.length > 1 && !readOnly && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    {...register(`skuVariants.${index}.type`, { required: 'Type is required' })}
                    className="form-select"
                    onChange={(e) => handleTypeChange(index, e.target.value)}
                    disabled={readOnly}
                  >
                    <option value="PREPACK">PREPACK</option>
                    <option value="BULK">BULK</option>
                    <option value="CONF">CONF</option>
                    <option value="SPEC">SPEC</option>
                    <option value="VAR">VAR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU (PMOps will assign)
                  </label>
                  <input
                    {...register(`skuVariants.${index}.sku`)}
                    type="text"
                    className="form-input bg-gray-50"
                    placeholder="Will be assigned by PMOps (e.g., 176036-100G)"
                    readOnly
                  />
                  <p className="mt-1 text-xs text-gray-500">PMOps creates the base part number which cascades to all SKUs</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Size *
                  </label>
                  <div className="flex">
                    <input
                      {...register(`skuVariants.${index}.packageSize.value`, { required: 'Package size is required' })}
                      type="number"
                      step="0.1"
                      className="form-input rounded-r-none"
                      placeholder="100"
                      onChange={(e) => onPackageValueChange && onPackageValueChange(index, e.target.value)}
                      readOnly={readOnly}
                    />
                    <select
                      {...register(`skuVariants.${index}.packageSize.unit`)}
                      className="form-select rounded-l-none border-l-0"
                      onChange={(e) => onPackageUnitChange && onPackageUnitChange(index, e.target.value)}
                      disabled={readOnly}
                    >
                      <option value="mg">mg</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="mL">mL</option>
                      <option value="L">L</option>
                      <option value="units">units</option>
                      <option value="vials">vials</option>
                      <option value="plates">plates</option>
                      <option value="bulk">bulk (configurable)</option>
                    </select>
                  </div>
                </div>

                {/* Only show pricing for non-VAR/SPEC/CONF types */}
                {showPricing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      List Price *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        $
                      </span>
                      <input
                        {...register(`skuVariants.${index}.pricing.listPrice`, { required: showPricing ? 'List price is required' : false })}
                        type="number"
                        step="0.01"
                        className="form-input rounded-l-none"
                        placeholder="99.99"
                        readOnly={readOnly}
                      />
                    </div>
                    {/* Margin Display */}
                    {calculateMarginForSKU(index) > 0 && (
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          calculateMarginForSKU(index) >= 50
                            ? 'bg-green-100 text-green-800'
                            : calculateMarginForSKU(index) >= 30
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {calculateMarginForSKU(index)}% margin
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          Cost: ${watch(`skuVariants.${index}.pricing.calculatedCost`)
                            ? parseFloat(watch(`skuVariants.${index}.pricing.calculatedCost`)).toFixed(2)
                            : '0.00'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SKUVariantsForm;
