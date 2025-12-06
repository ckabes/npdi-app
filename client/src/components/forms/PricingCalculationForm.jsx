import React, { useRef, useEffect } from 'react';
import { getCurrencySymbol, CURRENCY_OPTIONS } from '../../utils/currencyUtils';

/**
 * PricingCalculationForm Component
 * Shared form for pricing calculations across ticket creation and editing
 *
 * @param {Object} props
 * @param {Function} props.register - react-hook-form register function
 * @param {Function} props.watch - react-hook-form watch function
 * @param {boolean} props.readOnly - whether form should be read-only
 * @param {Array} props.missingRequiredFields - array of missing field keys for highlighting
 */
const PricingCalculationForm = ({
  register,
  watch,
  readOnly = false,
  missingRequiredFields = []
}) => {
  const baseUnit = watch('baseUnit.unit') || 'g';
  const baseUnitValue = watch('baseUnit.value') || 0;
  const rawMaterialCostPerUnitValue = watch('pricingData.standardCosts.rawMaterialCostPerUnit');
  const rawMaterialCostPerUnit = rawMaterialCostPerUnitValue !== null && rawMaterialCostPerUnitValue !== undefined && rawMaterialCostPerUnitValue !== ''
    ? parseFloat(rawMaterialCostPerUnitValue)
    : 0;
  const currency = watch('currency') || 'USD';

  const currencySymbol = getCurrencySymbol(currency);

  // Refs for scrolling to fields
  const currencyRef = useRef(null);
  const standardCostRef = useRef(null);
  const targetMarginRef = useRef(null);

  // Check if specific fields are missing
  const isCurrencyMissing = missingRequiredFields.includes('currency');
  const isStandardCostMissing = missingRequiredFields.includes('rawMaterialCostPerUnit') ||
                                 missingRequiredFields.includes('pricingData.standardCosts.rawMaterialCostPerUnit');
  const isTargetMarginMissing = missingRequiredFields.includes('targetMargin') ||
                                 missingRequiredFields.includes('pricingData.targetMargin');

  // Scroll to first missing field
  useEffect(() => {
    if (isCurrencyMissing && currencyRef.current) {
      currencyRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      currencyRef.current.focus();
    } else if (isStandardCostMissing && standardCostRef.current) {
      standardCostRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      standardCostRef.current.focus();
    } else if (isTargetMarginMissing && targetMarginRef.current) {
      targetMarginRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetMarginRef.current.focus();
    }
  }, [isCurrencyMissing, isStandardCostMissing, isTargetMarginMissing]);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Margin & Pricing Calculation</h3>
      </div>
      <div className="card-body space-y-6">
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-purple-900 mb-3">Currency</h4>
          <div className="max-w-xs">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Pricing Currency
            </label>
            <select
              {...register('currency')}
              ref={currencyRef}
              className={`form-select text-sm bg-white ${isCurrencyMissing ? 'border-2 border-red-500 ring-2 ring-red-200' : ''}`}
              disabled={readOnly}
            >
              {CURRENCY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-3">Standard Cost Inputs</h4>

          <div className="max-w-xs">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Standard Cost ({currencySymbol}/{baseUnit || 'unit'})
            </label>
            <input
              {...register('pricingData.standardCosts.rawMaterialCostPerUnit')}
              ref={standardCostRef}
              type="number"
              step="0.01"
              className={`form-input text-sm bg-white ${isStandardCostMissing ? 'border-2 border-red-500 ring-2 ring-red-200' : ''}`}
              placeholder="0.50"
              readOnly={readOnly}
            />
            {isStandardCostMissing && (
              <p className="mt-1 text-xs text-red-600 font-medium">⚠️ This field is required for submission</p>
            )}
          </div>

          {/* Standard Cost Display */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Standard Cost per Base Unit:</span>
              <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-blue-600 text-white">
                {currencySymbol}{(isNaN(rawMaterialCostPerUnit) ? 0 : rawMaterialCostPerUnit).toFixed(2)} / {baseUnit || 'unit'}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              This value is calculated from your standard cost input above
            </p>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-900 mb-3">Target Margin</h4>
          <div className="max-w-xs">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Target Margin (%)
            </label>
            <input
              {...register('pricingData.targetMargin')}
              ref={targetMarginRef}
              type="number"
              step="1"
              className={`form-input text-sm bg-white ${isTargetMarginMissing ? 'border-2 border-red-500 ring-2 ring-red-200' : ''}`}
              placeholder="50"
              readOnly={readOnly}
            />
            {isTargetMarginMissing && (
              <p className="mt-1 text-xs text-red-600 font-medium">⚠️ This field is required for submission</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Single target margin applied to all SKU sizes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCalculationForm;
