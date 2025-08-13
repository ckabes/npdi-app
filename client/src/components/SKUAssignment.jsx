import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { PlusIcon, TrashIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';

const SKUAssignment = ({ ticket, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      partNumber: ticket.partNumber?.baseNumber || '',
      skuVariants: ticket.skuVariants || [
        {
          type: 'BULK',
          sku: '',
          description: 'Bulk packaging',
          packageSize: { value: 100, unit: 'g' },
          pricing: {
            standardCost: ticket.pricingData?.standardCosts?.rawMaterialCostPerUnit || 0,
            margin: ticket.margin || 50,
            limitPrice: 0,
            listPrice: 0,
            currency: 'USD'
          }
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'skuVariants'
  });

  const partNumber = watch('partNumber');
  const standardCost = ticket.pricingData?.standardCosts?.rawMaterialCostPerUnit || 0;
  const margin = ticket.margin || 50;

  const generateSKUFromPartNumber = (partNumber, type, packageSize = null) => {
    if (!partNumber) return '';
    
    // For PREPACK types, generate suffix based on package size
    if (type === 'PREPACK' && packageSize) {
      const { value, unit } = packageSize;
      
      // Handle "units" specially - use -EA suffix
      if (unit === 'units') {
        return `${partNumber}-EA`;
      }
      
      // For other units, format as size + uppercase unit
      // 100 g -> -100G, 1 kg -> -1KG, 500 mL -> -500ML, etc.
      let formattedValue = value;
      let formattedUnit = unit.replace('L', 'L').toUpperCase(); // Keep L uppercase, make others uppercase
      
      // Remove decimal if it's a whole number
      if (formattedValue % 1 === 0) {
        formattedValue = Math.floor(formattedValue);
      }
      
      return `${partNumber}-${formattedValue}${formattedUnit}`;
    }
    
    // For non-PREPACK types, use the standard type suffix
    return `${partNumber}-${type}`;
  };

  const calculatePricing = (cost, marginPercent) => {
    const costNum = parseFloat(cost) || 0;
    const marginNum = parseFloat(marginPercent) || 50;
    const limitPrice = costNum * (1 + marginNum / 100);
    const listPrice = limitPrice * 1.25;
    
    return {
      limitPrice: parseFloat(limitPrice.toFixed(2)),
      listPrice: parseFloat(listPrice.toFixed(2))
    };
  };

  const handlePartNumberChange = (newPartNumber) => {
    setValue('partNumber', newPartNumber);
    
    // Auto-generate SKU codes for all variants
    fields.forEach((field, index) => {
      const currentPackageSize = watch(`skuVariants.${index}.packageSize`);
      const newSKU = generateSKUFromPartNumber(newPartNumber, field.type, currentPackageSize);
      setValue(`skuVariants.${index}.sku`, newSKU);
      
      // DO NOT update pricing when assigning base numbers - preserve original Product Manager pricing
    });
  };

  const addSKUVariant = (type) => {
    const defaultPackageSize = { value: 100, unit: 'g' };
    const newSKU = generateSKUFromPartNumber(partNumber, type, type === 'PREPACK' ? defaultPackageSize : null);
    
    // For new variants, use minimal default pricing - PMOps should not set pricing during assignment
    append({
      type,
      sku: newSKU,
      description: `${type} packaging`,
      packageSize: defaultPackageSize,
      pricing: {
        standardCost: ticket.pricingData?.standardCosts?.rawMaterialCostPerUnit || 0,
        margin: null,
        limitPrice: null,
        listPrice: null,
        currency: 'USD'
      }
    });
  };

  const handlePackageSizeChange = (index, field, value) => {
    setValue(`skuVariants.${index}.packageSize.${field}`, value);
    
    // Regenerate SKU code if this is a PREPACK type
    const skuType = watch(`skuVariants.${index}.type`);
    if (skuType === 'PREPACK' && partNumber) {
      // Get updated package size
      const packageSize = {
        value: field === 'value' ? parseFloat(value) || 0 : watch(`skuVariants.${index}.packageSize.value`),
        unit: field === 'unit' ? value : watch(`skuVariants.${index}.packageSize.unit`)
      };
      
      const newSKU = generateSKUFromPartNumber(partNumber, skuType, packageSize);
      setValue(`skuVariants.${index}.sku`, newSKU);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const updateData = {
        partNumber: {
          baseNumber: data.partNumber,
          assignedAt: new Date()
        },
        skuVariants: data.skuVariants,
        status: 'IN_PROCESS' // Move to in-process once SKUs are assigned
      };

      await productAPI.updateTicket(ticket._id, updateData);
      toast.success('SKU assignments saved successfully!');
      onUpdate();
    } catch (error) {
      console.error('SKU assignment error:', error);
      toast.error('Failed to save SKU assignments');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">SKU Assignment</h3>
        <p className="text-sm text-gray-600">Assign part numbers and manage SKU variants</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Part Number Assignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Part Number *
          </label>
          <div className="flex">
            <input
              {...register('partNumber', { required: 'Part number is required' })}
              type="text"
              className="form-input rounded-r-none"
              placeholder="e.g., 176036"
              onChange={(e) => handlePartNumberChange(e.target.value)}
            />
            <button
              type="button"
              onClick={() => copyToClipboard(partNumber)}
              disabled={!partNumber}
              className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 text-sm rounded-r-md hover:bg-gray-100 disabled:opacity-50"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
            </button>
          </div>
          {errors.partNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.partNumber.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            This will cascade to all SKU variants (e.g., {partNumber || '176036'}-BULK, {partNumber || '176036'}-CONF, {partNumber || '176036'}-100G for PREPACK)
          </p>
        </div>


        {/* SKU Variants */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">SKU Variants</h4>
            <div className="flex space-x-2">
              {['BULK', 'CONF', 'SPEC', 'VAR', 'PREPACK'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addSKUVariant(type)}
                  className="btn btn-secondary text-xs flex items-center"
                  disabled={fields.some(field => field.type === type)}
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => {
              const pricing = calculatePricing(standardCost, margin);
              
              return (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-medium text-gray-900">{field.type} Variant</h5>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU Code *
                      </label>
                      <div className="flex">
                        <input
                          {...register(`skuVariants.${index}.sku`, { required: 'SKU is required' })}
                          type="text"
                          className="form-input rounded-r-none text-sm"
                          readOnly
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(watch(`skuVariants.${index}.sku`))}
                          className="inline-flex items-center px-2 py-1 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 text-sm rounded-r-md hover:bg-gray-100"
                        >
                          <ClipboardDocumentIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Package Size *
                      </label>
                      <div className="flex">
                        <input
                          {...register(`skuVariants.${index}.packageSize.value`, { required: 'Size is required' })}
                          type="number"
                          step="0.1"
                          className="form-input rounded-r-none text-sm"
                          placeholder="100"
                          onChange={(e) => handlePackageSizeChange(index, 'value', e.target.value)}
                        />
                        <select 
                          {...register(`skuVariants.${index}.packageSize.unit`)} 
                          className="form-select rounded-l-none border-l-0 text-sm"
                          onChange={(e) => handlePackageSizeChange(index, 'unit', e.target.value)}
                        >
                          <option value="mg">mg</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="mL">mL</option>
                          <option value="L">L</option>
                          <option value="units">units</option>
                          <option value="vials">vials</option>
                          <option value="plates">plates</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Information - Read-only during SKU assignment */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h6 className="text-sm font-medium text-gray-900 mb-3">Pricing Information (From Product Manager)</h6>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                      {field.type === 'BULK' && (
                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-1">
                            Standard Cost ($)
                          </label>
                          <div className="form-input text-sm bg-green-50 border-green-200 font-medium">
                            {field.pricing?.standardCost ? `$${field.pricing.standardCost.toFixed(2)}` : 'Not set'}
                          </div>
                          <p className="text-xs text-green-600 mt-1">From Raw Material Cost</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          List Price ($)
                        </label>
                        <div className="form-input text-sm bg-gray-50 border-gray-200">
                          {field.pricing?.listPrice ? `$${field.pricing.listPrice}` : 'Not set'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Currency
                        </label>
                        <div className="form-input text-sm bg-gray-50 border-gray-200">
                          {field.pricing?.currency || 'USD'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                          Pricing preserved from Product Manager - editable only after ticket editing in IN_PROCESS status
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Saving...' : 'Save SKU Assignments'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SKUAssignment;