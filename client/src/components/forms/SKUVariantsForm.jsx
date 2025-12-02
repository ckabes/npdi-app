import React, { useCallback } from 'react';
import { PlusIcon, TrashIcon, CalculatorIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { calculateMarginPercent } from '../../utils/pricingCalculations';
import { weightMatrixAPI } from '../../services/api';

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
    } else if (newType === 'BULK') {
      // For BULK, set to base unit from pricing (uneditable)
      setValue(`skuVariants.${index}.packageSize.value`, 1);
      setValue(`skuVariants.${index}.packageSize.unit`, baseUnit || 'g');
    }

    // Call parent callback if provided
    if (onSKUTypeChange) {
      onSKUTypeChange(index, newType);
    }
  };

  /**
   * Auto-populate net weight from package size if unit is mass-based
   */
  const autoPopulateNetWeight = useCallback((index) => {
    const packageValue = watch(`skuVariants.${index}.packageSize.value`);
    const packageUnit = watch(`skuVariants.${index}.packageSize.unit`);

    // Only populate if package size is a mass unit
    const massUnits = ['mg', 'g', 'kg'];
    if (packageValue && packageUnit && massUnits.includes(packageUnit.toLowerCase())) {
      setValue(`skuVariants.${index}.netWeight.value`, packageValue);
      setValue(`skuVariants.${index}.netWeight.unit`, packageUnit);
    }
  }, [watch, setValue]);

  /**
   * Calculate volume for liquids based on mass and density
   * Assumes density is in g/mL format (e.g., "0.79 at 68°F" extracts 0.79)
   */
  const calculateVolumeForLiquid = useCallback((index) => {
    const physicalState = watch('chemicalProperties.physicalState');
    const density = watch('chemicalProperties.additionalProperties.density');

    // Only calculate for liquids with density
    if (physicalState !== 'Liquid' || !density) {
      console.log('Volume calc skipped - physicalState:', physicalState, 'density:', density);
      return false;
    }

    const netWeightValue = watch(`skuVariants.${index}.netWeight.value`);
    const netWeightUnit = watch(`skuVariants.${index}.netWeight.unit`);

    if (!netWeightValue || !netWeightUnit) {
      console.log('Volume calc skipped - netWeight:', netWeightValue, netWeightUnit);
      return false;
    }

    try {
      // Convert mass to grams
      let massInGrams = parseFloat(netWeightValue);
      if (netWeightUnit === 'mg') massInGrams = massInGrams / 1000;
      if (netWeightUnit === 'kg') massInGrams = massInGrams * 1000;

      // Parse density value - extract first decimal number from string
      // Handles formats like "0.79 at 68°F", "0.7893 g/cu cm at 20°C", etc.
      const densityMatch = String(density).match(/(\d+\.?\d*)/);
      if (!densityMatch) {
        console.log('Could not parse density:', density);
        return false;
      }

      const densityValue = parseFloat(densityMatch[1]);
      console.log('Calculating volume: mass =', massInGrams, 'g, density =', densityValue, 'g/mL');

      // Volume = Mass / Density (assuming density in g/mL)
      const volumeInML = massInGrams / densityValue;

      // Set volume
      setValue(`skuVariants.${index}.volume.value`, parseFloat(volumeInML.toFixed(2)));
      setValue(`skuVariants.${index}.volume.unit`, 'mL');

      toast.success(`💧 Volume calculated: ${volumeInML.toFixed(2)} mL`, { duration: 2000 });
      return true;
    } catch (error) {
      console.error('Volume calculation failed:', error);
      return false;
    }
  }, [watch, setValue]);

  /**
   * Auto-populate gross weight based on package size
   * Looks up weight matrix for closest match
   */
  const handlePackageSizeChange = useCallback(async (index) => {
    const skuType = watch(`skuVariants.${index}.type`);

    // Only auto-populate for PREPACK SKUs
    if (skuType !== 'PREPACK') return;

    const packageValue = watch(`skuVariants.${index}.packageSize.value`);
    const packageUnit = watch(`skuVariants.${index}.packageSize.unit`);

    if (!packageValue || !packageUnit) return;

    // Auto-populate net weight from package size
    autoPopulateNetWeight(index);

    // Calculate volume for liquids
    setTimeout(() => calculateVolumeForLiquid(index), 100);

    try {
      // Format package size for lookup (e.g., "100G", "1L")
      const packageSize = `${packageValue}${packageUnit.toUpperCase()}`;

      const response = await weightMatrixAPI.lookup(packageSize);

      if (response.data.match !== 'none' && response.data.data) {
        const { grossWeight, weightUnit } = response.data.data;

        // Set gross weight values
        setValue(`skuVariants.${index}.grossWeight.value`, grossWeight);
        // Convert unit to lowercase to match form select options
        setValue(`skuVariants.${index}.grossWeight.unit`, weightUnit.toLowerCase());

        // Show success message with match type
        if (response.data.match === 'exact') {
          toast.success(`✓ Gross weight auto-filled: ${grossWeight} ${weightUnit}`, { duration: 2000 });
        } else {
          toast.success(`≈ Gross weight auto-filled (approx. match): ${grossWeight} ${weightUnit}`, { duration: 2500 });
        }
      }
    } catch (error) {
      // Silently fail - weight matrix is optional
      console.log('Weight matrix lookup failed (optional):', error);
    }
  }, [watch, setValue, autoPopulateNetWeight, calculateVolumeForLiquid]);

  /**
   * Comprehensive "Calculate Weights" function
   * Performs all weight and volume calculations in one go
   */
  const handleCalculateWeights = useCallback(async (index) => {
    const packageValue = watch(`skuVariants.${index}.packageSize.value`);
    const packageUnit = watch(`skuVariants.${index}.packageSize.unit`);

    if (!packageValue || !packageUnit) {
      toast.error('Please enter package size first');
      return;
    }

    const results = {
      netWeight: false,
      grossWeight: false,
      volume: false
    };

    // Step 1: Auto-populate net weight from package size (for mass units)
    const massUnits = ['mg', 'g', 'kg'];
    if (massUnits.includes(packageUnit.toLowerCase())) {
      setValue(`skuVariants.${index}.netWeight.value`, packageValue);
      setValue(`skuVariants.${index}.netWeight.unit`, packageUnit);
      results.netWeight = true;
      console.log('Net weight set to:', packageValue, packageUnit);
    }

    // Step 2: Lookup gross weight from weight matrix
    try {
      const packageSize = `${packageValue}${packageUnit.toUpperCase()}`;
      const response = await weightMatrixAPI.lookup(packageSize);

      if (response.data.match !== 'none' && response.data.data) {
        const { grossWeight, weightUnit } = response.data.data;
        setValue(`skuVariants.${index}.grossWeight.value`, grossWeight);
        // Convert unit to lowercase to match form select options
        setValue(`skuVariants.${index}.grossWeight.unit`, weightUnit.toLowerCase());
        results.grossWeight = true;

        if (response.data.match === 'exact') {
          toast.success(`✓ Gross weight: ${grossWeight} ${weightUnit} (exact match)`);
        } else {
          toast.success(`≈ Gross weight: ${grossWeight} ${weightUnit} (closest match)`);
        }
      } else {
        toast.error('No matching entry found in weight matrix');
      }
    } catch (error) {
      console.error('Gross weight lookup failed:', error);
      toast.error('Failed to lookup gross weight');
    }

    // Step 3: Calculate volume for liquids (with small delay to ensure net weight is set)
    setTimeout(() => {
      const volumeCalculated = calculateVolumeForLiquid(index);
      if (volumeCalculated) {
        results.volume = true;
      }
    }, 200);

    // Summary message
    setTimeout(() => {
      const completed = Object.values(results).filter(Boolean).length;
      if (completed > 0) {
        console.log('Calculate Weights completed:', results);
      }
    }, 400);
  }, [watch, setValue, calculateVolumeForLiquid]);

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
          const showPricing = !['VAR', 'SPEC', 'CONF', 'BULK'].includes(skuType);

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
                      className={`form-input rounded-r-none ${field.type === 'BULK' ? 'bg-amber-50 border-2 border-amber-400 font-semibold' : ''}`}
                      placeholder="100"
                      onChange={(e) => {
                        if (onPackageValueChange) onPackageValueChange(index, e.target.value);
                      }}
                      readOnly={readOnly || field.type === 'BULK'}
                    />
                    <select
                      {...register(`skuVariants.${index}.packageSize.unit`)}
                      className={`form-select rounded-l-none border-l-0 ${field.type === 'BULK' ? 'bg-amber-50 border-2 border-amber-400 font-semibold' : ''}`}
                      onChange={(e) => {
                        if (onPackageUnitChange) onPackageUnitChange(index, e.target.value);
                      }}
                      disabled={readOnly || field.type === 'BULK'}
                    >
                      <option value="mg">mg</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="mL">mL</option>
                      <option value="L">L</option>
                      <option value="EA">EA (each)</option>
                      <option value="units">units</option>
                      <option value="vials">vials</option>
                      <option value="plates">plates</option>
                      <option value="bulk">bulk (configurable)</option>
                    </select>
                  </div>
                  {field.type === 'BULK' && (
                    <p className="mt-1 text-xs text-amber-700 font-medium">
                      📦 BULK SKUs use the base unit from pricing calculations
                    </p>
                  )}
                </div>

                {/* Physical Dimensions - Only for PREPACK */}
                {skuType === 'PREPACK' && (
                  <>
                    {/* Calculate Weights Button - Top of Section */}
                    {!readOnly && (
                      <div className="col-span-full">
                        <button
                          type="button"
                          onClick={() => handleCalculateWeights(index)}
                          className="btn btn-primary btn-sm flex items-center space-x-2"
                        >
                          <CalculatorIcon className="h-4 w-4" />
                          <span>Calculate Weights</span>
                        </button>
                        <p className="mt-1 text-xs text-gray-500">
                          Auto-fills net weight, gross weight (from lookup table), and volume (for liquids)
                        </p>
                      </div>
                    )}

                    {/* Gross Weight */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                        <span>Gross Weight</span>
                        <div className="relative group">
                          <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                            <p className="font-semibold mb-1">Weight Matrix Lookup</p>
                            <p>These are populated from a table of estimated gross weight values depending on your pack size. The table contains 957 entries with standard gross weights for common package sizes.</p>
                          </div>
                        </div>
                      </label>
                      <div className="flex gap-2">
                        <input
                          {...register(`skuVariants.${index}.grossWeight.value`)}
                          type="number"
                          step="0.001"
                          className="form-input flex-1"
                          placeholder="0.0"
                          readOnly={readOnly}
                        />
                        <select
                          {...register(`skuVariants.${index}.grossWeight.unit`)}
                          className="form-select w-24"
                          disabled={readOnly}
                        >
                          <option value="mg">mg</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="lb">lb</option>
                          <option value="oz">oz</option>
                        </select>
                      </div>
                    </div>

                    {/* Net Weight */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Net Weight
                      </label>
                      <div className="flex gap-2">
                        <input
                          {...register(`skuVariants.${index}.netWeight.value`)}
                          type="number"
                          step="0.001"
                          className="form-input flex-1"
                          placeholder="0.0"
                          readOnly={readOnly}
                        />
                        <select
                          {...register(`skuVariants.${index}.netWeight.unit`)}
                          className="form-select w-24"
                          disabled={readOnly}
                        >
                          <option value="mg">mg</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="lb">lb</option>
                          <option value="oz">oz</option>
                        </select>
                      </div>
                    </div>

                    {/* Volume */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Volume
                      </label>
                      <div className="flex gap-2">
                        <input
                          {...register(`skuVariants.${index}.volume.value`)}
                          type="number"
                          step="0.001"
                          className="form-input flex-1"
                          placeholder="0.0"
                          readOnly={readOnly}
                        />
                        <select
                          {...register(`skuVariants.${index}.volume.unit`)}
                          className="form-select w-24"
                          disabled={readOnly}
                        >
                          <option value="µL">µL</option>
                          <option value="mL">mL</option>
                          <option value="L">L</option>
                          <option value="gal">gal</option>
                          <option value="fl oz">fl oz</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

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

              {/* Forecasted Sales Volume - Only for PREPACK */}
              {skuType === 'PREPACK' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Forecasted Sales Volume (Containers)</h5>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year 1
                      </label>
                      <input
                        {...register(`skuVariants.${index}.forecastedSalesVolume.year1`)}
                        type="number"
                        step="1"
                        min="0"
                        className="form-input"
                        placeholder="0"
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year 2
                      </label>
                      <input
                        {...register(`skuVariants.${index}.forecastedSalesVolume.year2`)}
                        type="number"
                        step="1"
                        min="0"
                        className="form-input"
                        placeholder="0"
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year 3
                      </label>
                      <input
                        {...register(`skuVariants.${index}.forecastedSalesVolume.year3`)}
                        type="number"
                        step="1"
                        min="0"
                        className="form-input"
                        placeholder="0"
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Enter forecasted number of containers to be sold annually
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SKUVariantsForm;
