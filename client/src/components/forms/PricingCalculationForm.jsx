import React from 'react';
import { getCurrencySymbol, CURRENCY_OPTIONS } from '../../utils/currencyUtils';

/**
 * PricingCalculationForm Component
 * Shared form for pricing calculations across ticket creation and editing
 *
 * @param {Object} props
 * @param {Function} props.register - react-hook-form register function
 * @param {Function} props.watch - react-hook-form watch function
 * @param {boolean} props.readOnly - whether form should be read-only
 */
const PricingCalculationForm = ({
  register,
  watch,
  readOnly = false
}) => {
  const baseUnit = watch('baseUnit.unit') || 'g';
  const baseUnitValue = watch('baseUnit.value') || 0;
  const rawMaterialCostPerUnit = watch('pricingData.standardCosts.rawMaterialCostPerUnit') || 0;
  const currency = watch('currency') || 'USD';

  const currencySymbol = getCurrencySymbol(currency);

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
              className="form-select text-sm bg-white"
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
              type="number"
              step="0.01"
              className="form-input text-sm bg-white"
              placeholder="0.50"
              readOnly={readOnly}
            />
          </div>

          {/* Standard Cost Display */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Standard Cost per Base Unit:</span>
              <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-blue-600 text-white">
                {currencySymbol}{parseFloat(rawMaterialCostPerUnit).toFixed(2)} / {baseUnit || 'unit'}
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
              type="number"
              step="1"
              className="form-input text-sm"
              placeholder="50"
              readOnly={readOnly}
            />
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
