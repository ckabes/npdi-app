import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '../utils/AuthContext';
import { productAPI } from '../services/api';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CreateTicket = () => {
  const [loading, setLoading] = useState(false);
  const [casLookupLoading, setCasLookupLoading] = useState(false);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const { user, isProductManager } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      priority: 'MEDIUM',
      productLine: 'Chemical Products',
      sbu: isProductManager ? user?.sbu : 'P90',
      skuVariants: [],
      chemicalProperties: {
        casNumber: '',
        physicalState: 'Solid',
        storageConditions: { temperature: { unit: '°C' } }
      },
      hazardClassification: {
        signalWord: 'WARNING'
      },
      corpbaseData: {
        productDescription: '',
        websiteTitle: '',
        metaDescription: '',
        keyFeatures: '',
        applications: '',
        targetIndustries: ''
      },
      pricingData: {
        baseUnit: 'g',
        standardCosts: {
          rawMaterialCostPerUnit: 0.50,
          packagingCost: 2.50,
          laborOverheadCost: 5.00
        },
        targetMargins: {
          smallSize: 75,
          mediumSize: 65,
          largeSize: 55,
          bulkSize: 45
        }
      }
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'skuVariants'
  });

  const casNumber = watch('chemicalProperties.casNumber');
  const productName = watch('productName');
  const molecularFormula = watch('chemicalProperties.molecularFormula');
  const sbu = watch('sbu');
  const baseUnit = watch('pricingData.baseUnit');

  const handleCASLookup = async () => {
    if (!casNumber || !/^\d{1,7}-\d{2}-\d$/.test(casNumber)) {
      toast.error('Please enter a valid CAS number (e.g., 64-17-5)');
      return;
    }

    setCasLookupLoading(true);
    setAutoPopulated(false); // Reset state
    
    try {
      console.log('Starting CAS lookup for:', casNumber);
      const response = await productAPI.lookupCAS(casNumber);
      const data = response.data.data;
      
      console.log('Received data:', data);
      
      // Auto-populate basic fields safely
      if (data.productName && !watch('productName')) {
        setValue('productName', data.productName, { shouldDirty: true });
      }
      
      // Auto-populate chemical properties safely
      if (data.chemicalProperties) {
        if (data.chemicalProperties.molecularFormula) {
          setValue('chemicalProperties.molecularFormula', data.chemicalProperties.molecularFormula, { shouldDirty: true });
        }
        if (data.chemicalProperties.molecularWeight) {
          setValue('chemicalProperties.molecularWeight', parseFloat(data.chemicalProperties.molecularWeight), { shouldDirty: true });
        }
      }
      
      // Handle hazard classification carefully
      if (data.hazardClassification) {
        if (data.hazardClassification.signalWord) {
          setValue('hazardClassification.signalWord', data.hazardClassification.signalWord, { shouldDirty: true });
        }
        
        
        if (data.hazardClassification.hazardStatements && Array.isArray(data.hazardClassification.hazardStatements)) {
          const cleanStatements = data.hazardClassification.hazardStatements
            .filter(s => s && s.trim().length > 0)
            .slice(0, 10) // Limit to first 10 to prevent UI overload
            .join('\n');
          if (cleanStatements) {
            setValue('hazardClassification.hazardStatements', cleanStatements, { shouldDirty: true });
          }
        }
      }
      
      
      // Handle SKU variants replacement more safely
      if (data.skuVariants && Array.isArray(data.skuVariants) && data.skuVariants.length > 0) {
        try {
          // Clear existing SKUs first
          const currentLength = fields.length;
          for (let i = currentLength - 1; i >= 0; i--) {
            remove(i);
          }
          
          // Add new SKUs with timeout to prevent blocking
          setTimeout(() => {
            data.skuVariants.forEach(sku => {
              if (sku && sku.type && sku.sku) {
                append({
                  type: sku.type,
                  sku: sku.sku,
                  description: sku.description || '',
                  packageSize: sku.packageSize || { value: 100, unit: 'g' },
                  pricing: sku.pricing || { listPrice: 0, currency: 'USD' }
                });
              }
            });
          }, 100);
        } catch (skuError) {
          console.warn('SKU replacement failed:', skuError);
        }
      }
      
      setAutoPopulated(true);
      toast.success(`Chemical data loaded for ${data.productName || casNumber}!`);
      
    } catch (error) {
      console.error('CAS lookup error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to lookup CAS number';
      toast.error(errorMsg);
      setAutoPopulated(false);
    } finally {
      setCasLookupLoading(false);
    }
  };

  const calculatePricing = () => {
    const standardCosts = watch('pricingData.standardCosts');
    const targetMargins = watch('pricingData.targetMargins');
    const baseUnit = watch('pricingData.baseUnit') || 'g';
    
    if (!standardCosts?.rawMaterialCostPerUnit || !targetMargins) {
      toast.error('Please fill in standard costs and target margins first');
      return;
    }

    const rawCostPerUnit = parseFloat(standardCosts.rawMaterialCostPerUnit) || 0.50;
    const packagingCost = parseFloat(standardCosts.packagingCost) || 2.50;
    const laborOverheadCost = parseFloat(standardCosts.laborOverheadCost) || 5.00;

    // Unit conversion factors to base unit
    const getConversionFactor = (packageUnit, baseUnit) => {
      const conversions = {
        // Mass conversions
        'mg-g': 0.001, 'g-mg': 1000, 'g-kg': 0.001, 'kg-g': 1000,
        // Volume conversions  
        'mL-L': 0.001, 'L-mL': 1000,
        // Same units
        'g-g': 1, 'kg-kg': 1, 'mL-mL': 1, 'L-L': 1, 'mg-mg': 1,
        'units-units': 1, 'vials-vials': 1, 'plates-plates': 1
      };
      return conversions[`${packageUnit}-${baseUnit}`] || 1;
    };

    // Update pricing for each SKU variant based on container size
    fields.forEach((field, index) => {
      const packageSizeValue = parseFloat(watch(`skuVariants.${index}.packageSize.value`)) || 0;
      const packageUnit = watch(`skuVariants.${index}.packageSize.unit`) || baseUnit;
      const skuType = watch(`skuVariants.${index}.type`);
      
      // Only treat BULK type as true bulk (without material cost calculation)
      if (skuType === 'BULK') {
        // True bulk pricing - use minimum cost calculation without material cost
        const totalStandardCost = packagingCost + laborOverheadCost; // No material cost for bulk
        const targetMarginPercent = targetMargins.bulkSize || 45;
        
        const listPrice = totalStandardCost / (1 - (targetMarginPercent / 100));
        const roundedPrice = Math.round(listPrice * 100) / 100;
        
        setValue(`skuVariants.${index}.pricing.listPrice`, roundedPrice, { shouldDirty: true });
        setValue(`skuVariants.${index}.pricing.calculatedCost`, totalStandardCost, { shouldDirty: true });
        setValue(`skuVariants.${index}.pricing.calculatedMarginPercent`, targetMarginPercent, { shouldDirty: true });
        
      } else if (packageSizeValue > 0) {
        // Standard packaging pricing calculation
        const conversionFactor = getConversionFactor(packageUnit, baseUnit);
        const packageSizeInBaseUnit = packageSizeValue * conversionFactor;
        
        // Calculate total standard cost
        const totalMaterialCost = rawCostPerUnit * packageSizeInBaseUnit;
        const totalStandardCost = totalMaterialCost + packagingCost + laborOverheadCost;
        
        // Determine margin based on size (using converted size)
        let targetMarginPercent;
        if (packageSizeInBaseUnit < 10) {
          targetMarginPercent = targetMargins.smallSize || 75;
        } else if (packageSizeInBaseUnit < 100) {
          targetMarginPercent = targetMargins.mediumSize || 65;
        } else if (packageSizeInBaseUnit < 1000) {
          targetMarginPercent = targetMargins.largeSize || 55;
        } else {
          targetMarginPercent = targetMargins.bulkSize || 45;
        }
        
        // Calculate list price: Cost / (1 - margin%)
        const listPrice = totalStandardCost / (1 - (targetMarginPercent / 100));
        const roundedPrice = Math.round(listPrice * 100) / 100;
        
        setValue(`skuVariants.${index}.pricing.listPrice`, roundedPrice, { shouldDirty: true });
        
        // Store calculated values for margin display
        setValue(`skuVariants.${index}.pricing.calculatedCost`, totalStandardCost, { shouldDirty: true });
        setValue(`skuVariants.${index}.pricing.calculatedMarginPercent`, targetMarginPercent, { shouldDirty: true });
      }
    });
    
    toast.success('Pricing calculated based on container size and margins!');
  };

  const calculateMarginForSKU = (index) => {
    const listPrice = parseFloat(watch(`skuVariants.${index}.pricing.listPrice`)) || 0;
    const calculatedCost = watch(`skuVariants.${index}.pricing.calculatedCost`) || 0;
    
    if (listPrice > 0 && calculatedCost > 0) {
      const margin = ((listPrice - calculatedCost) / listPrice) * 100;
      return Math.round(margin * 10) / 10; // Round to 1 decimal place
    }
    return 0;
  };

  // Handle SKU type change to set appropriate default values
  const handleSKUTypeChange = (index, newType) => {
    const currentSKU = watch(`skuVariants.${index}`);
    
    // Set default package size based on type
    if (['VAR', 'SPEC', 'CONF'].includes(newType)) {
      setValue(`skuVariants.${index}.packageSize.value`, 1); // 1 kg default display
      setValue(`skuVariants.${index}.packageSize.unit`, 'kg');
    } else if (newType === 'PREPACK') {
      setValue(`skuVariants.${index}.packageSize.value`, 100);
      setValue(`skuVariants.${index}.packageSize.unit`, baseUnit || 'g');
    }
    
    // Recalculate pricing after type change
    setTimeout(() => recalculatePricingForSKU(index), 100);
  };

  // Handle package unit change to recalculate pricing
  const handlePackageUnitChange = (index, newUnit) => {
    setTimeout(() => recalculatePricingForSKU(index), 100);
  };

  // Handle package value change to recalculate pricing
  const handlePackageValueChange = (index, newValue) => {
    setTimeout(() => recalculatePricingForSKU(index), 100);
  };

  // Recalculate pricing for a specific SKU
  const recalculatePricingForSKU = (index) => {
    const pricingData = watch('pricingData');
    const packageSizeValue = parseFloat(watch(`skuVariants.${index}.packageSize.value`)) || 0;
    const packageUnit = watch(`skuVariants.${index}.packageSize.unit`) || 'g';
    const skuType = watch(`skuVariants.${index}.type`);
    
    if (!pricingData || !packageSizeValue) return;
    
    // Convert package size to base unit (grams) for calculation
    const conversionToGrams = {
      'mg': 0.001,
      'g': 1,
      'kg': 1000,
      'mL': 1, // Assuming density ~1 for liquids
      'L': 1000,
      'units': 1, // Treat as 1g equivalent
      'vials': 1, // Treat as 1g equivalent
      'plates': 1, // Treat as 1g equivalent
      'bulk': 1000 // Assume 1kg for bulk
    };
    
    const packageSizeInGrams = packageSizeValue * (conversionToGrams[packageUnit] || 1);
    
    // Use pricing data for calculation
    const rawCostPerGram = parseFloat(pricingData.standardCosts?.rawMaterialCostPerUnit) || 0.50;
    const packagingCost = parseFloat(pricingData.standardCosts?.packagingCost) || 2.50;
    const laborOverheadCost = parseFloat(pricingData.standardCosts?.laborOverheadCost) || 5.00;
    
    // Calculate total material cost
    const totalMaterialCost = rawCostPerGram * packageSizeInGrams;
    const totalStandardCost = totalMaterialCost + packagingCost + laborOverheadCost;
    
    // Determine target margin based on package size
    let targetMarginPercent = 50; // Default margin
    const targetMargins = pricingData.targetMargins || {};
    
    if (packageSizeInGrams < 10) {
      targetMarginPercent = targetMargins.smallSize || 75;
    } else if (packageSizeInGrams < 100) {
      targetMarginPercent = targetMargins.mediumSize || 65;
    } else if (packageSizeInGrams < 1000) {
      targetMarginPercent = targetMargins.largeSize || 55;
    } else {
      targetMarginPercent = targetMargins.bulkSize || 45;
    }
    
    // Calculate list price based on margin
    const listPrice = totalStandardCost / (1 - (targetMarginPercent / 100));
    const roundedPrice = Math.round(listPrice * 100) / 100;
    
    // Update the pricing fields
    setValue(`skuVariants.${index}.pricing.calculatedCost`, totalStandardCost.toFixed(2));
    setValue(`skuVariants.${index}.pricing.listPrice`, roundedPrice);
    setValue(`skuVariants.${index}.pricing.margin`, targetMarginPercent);
    
    toast.success(`Pricing recalculated for SKU #${index + 1}: $${roundedPrice} (${targetMarginPercent}% margin)`);
  };

  const generateStandardSKUs = () => {
    // Clear existing SKUs
    const currentLength = fields.length;
    for (let i = currentLength - 1; i >= 0; i--) {
      remove(i);
    }

    // Generate standard SKUs - VAR/CONF/SPEC default to 1 kg
    // BULK defaults to 1 kg, PREPACK size uses actual packaging size for pricing calculations
    const rawMaterialCost = watch('pricingData.standardCosts.rawMaterialCostPerUnit') || 0.50;
    
    const standardSKUs = [
      {
        type: 'BULK',
        sku: '',
        packageSize: { value: 1, unit: 'kg' }, // 1 kg default for BULK
        pricing: { 
          standardCost: rawMaterialCost, // Raw material cost becomes Standard Cost for BULK
          listPrice: 0, 
          currency: 'USD' 
        }
      },
      {
        type: 'VAR',
        sku: '',
        packageSize: { value: 1, unit: 'kg' }, // 1 kg default for VAR
        pricing: { listPrice: 0, currency: 'USD' }
      },
      {
        type: 'CONF',
        sku: '',
        packageSize: { value: 1, unit: 'kg' }, // 1 kg default for CONF
        pricing: { listPrice: 0, currency: 'USD' }
      },
      {
        type: 'SPEC',
        sku: '',
        packageSize: { value: 1, unit: 'kg' }, // 1 kg default for SPEC
        pricing: { listPrice: 0, currency: 'USD' }
      },
      {
        type: 'PREPACK',
        sku: '',
        packageSize: { value: 100, unit: baseUnit || 'g' }, // Actual package size for cost calculation
        pricing: { listPrice: 0, currency: 'USD' }
      }
    ];

    // Add the standard SKUs
    setTimeout(() => {
      standardSKUs.forEach(sku => {
        append(sku);
      });
      toast.success('Standard SKUs generated: VAR, CONF, SPEC (1 kg each) and PREPACK (sized)');
    }, 100);
  };

  const generateProductDescription = () => {
    if (!productName) {
      toast.error('Please enter a product name first');
      return;
    }

    // Generate Claude-style product description based on available information
    const generateDescription = () => {
      const name = productName.trim();
      const formula = molecularFormula || '';
      const cas = casNumber || '';
      const businessUnit = sbu || 'Life Science';
      
      // Create a comprehensive product description
      let description = `${name} is a high-quality chemical compound`;
      
      if (formula) {
        description += ` with the molecular formula ${formula}`;
      }
      
      if (cas) {
        description += ` (CAS: ${cas})`;
      }
      
      description += ` offered by MilliporeSigma for research and development applications.`;
      
      // Add business unit specific context
      switch (businessUnit) {
        case 'Life Science':
          description += ` This product is particularly suited for life science research, including cell biology, molecular biology, and biochemical studies.`;
          break;
        case 'Process Solutions':
          description += ` Designed for process development and manufacturing applications, this product meets stringent quality requirements for industrial use.`;
          break;
        case 'Electronics':
          description += ` This electronic-grade material is ideal for semiconductor manufacturing and electronic component production.`;
          break;
        case 'Healthcare':
          description += ` Formulated to meet healthcare industry standards, suitable for pharmaceutical and medical device applications.`;
          break;
        default:
          description += ` This versatile compound serves multiple research and industrial applications.`;
      }
      
      description += ` Available in multiple package sizes to meet diverse research needs, each lot is carefully tested to ensure consistent quality and purity. Our commitment to excellence makes this an ideal choice for researchers and professionals requiring reliable, high-performance chemical products.`;
      
      return description;
    };

    // Generate and populate the description
    const generatedDesc = generateDescription();
    setValue('corpbaseData.productDescription', generatedDesc, { shouldDirty: true });
    
    // Generate complementary website title
    const websiteTitle = `${productName} | High-Quality Chemical | MilliporeSigma`;
    setValue('corpbaseData.websiteTitle', websiteTitle, { shouldDirty: true });
    
    // Generate meta description
    const metaDesc = `Buy ${productName}${molecularFormula ? ` (${molecularFormula})` : ''} from MilliporeSigma. High purity, reliable quality for research applications. Multiple sizes available.`;
    setValue('corpbaseData.metaDescription', metaDesc.substring(0, 160), { shouldDirty: true });
    
    // Generate key features
    const keyFeatures = `• High purity and consistent quality
• Rigorous quality control testing
• Available in multiple package sizes
• Suitable for research applications
• Reliable supply chain and fast delivery
• Comprehensive documentation and support`;
    setValue('corpbaseData.keyFeatures', keyFeatures, { shouldDirty: true });
    
    toast.success('Product description generated successfully!');
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await productAPI.createTicket(data);
      toast.success('Product ticket created successfully!');
      navigate(`/tickets/${response.data.ticket._id}`);
    } catch (error) {
      console.error('Create ticket error:', error);
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    const data = watch(); // Get all current form data
    setLoading(true);
    try {
      const response = await productAPI.saveDraft(data);
      toast.success('Draft saved successfully!');
      navigate(`/tickets/${response.data.ticket._id}`);
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* MilliporeSigma Branding Header */}
      <div className="bg-gradient-to-r from-millipore-blue to-millipore-blue-dark rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src="/logo-white.svg" alt="MilliporeSigma" className="h-8" />
            <div className="text-white">
              <h1 className="text-2xl font-bold">Chemical Product Development</h1>
              <p className="text-blue-100">New Product Development & Introduction (NPDI) System</p>
            </div>
          </div>
          <div className="text-right text-white">
            <p className="text-sm opacity-90">Powered by PubChem Integration</p>
            <p className="text-xs opacity-75">Auto-populate chemical data with CAS numbers</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Create New Product Ticket</h2>
        <p className="text-gray-600">Enter a CAS number to automatically populate chemical properties, hazard data, and generate SKU variants.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          </div>
          <div className="card-body space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Line *
                </label>
                <input
                  {...register('productLine', { required: 'Product line is required' })}
                  type="text"
                  className="form-input"
                  placeholder="Enter product line"
                />
                {errors.productLine && (
                  <p className="mt-1 text-sm text-red-600">{errors.productLine.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Strategic Business Unit *
                </label>
                <select {...register('sbu')} className="form-select">
                  <option value="775">SBU 775</option>
                  <option value="P90">SBU P90</option>
                  <option value="440">SBU 440</option>
                  <option value="P87">SBU P87</option>
                  <option value="P89">SBU P89</option>
                  <option value="P85">SBU P85</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select {...register('priority')} className="form-select">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Chemical Properties */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Chemical Properties</h3>
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
                  <button
                    type="button"
                    onClick={handleCASLookup}
                    disabled={casLookupLoading || !casNumber}
                    className="text-sm bg-millipore-blue text-white px-3 py-1 rounded hover:bg-millipore-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {casLookupLoading ? 'Loading...' : 'Auto-populate'}
                  </button>
                </div>
                <input
                  {...register('chemicalProperties.casNumber', { 
                    required: 'CAS number is required',
                    pattern: {
                      value: /^\d{1,7}-\d{2}-\d$/,
                      message: 'Please enter a valid CAS number (e.g., 64-17-5)'
                    }
                  })}
                  type="text"
                  className="form-input"
                  placeholder="e.g., 64-17-5"
                />
                {errors.chemicalProperties?.casNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.chemicalProperties.casNumber.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Enter CAS number and click 'Auto-populate' to fetch chemical data from PubChem
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Molecular Formula
                </label>
                <input
                  {...register('chemicalProperties.molecularFormula')}
                  type="text"
                  className={`form-input ${autoPopulated ? 'bg-green-50' : ''}`}
                  placeholder="e.g., C2H6O"
                  readOnly={autoPopulated}
                />
                {autoPopulated && (
                  <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IUPAC Name
                </label>
                <input
                  {...register('chemicalProperties.iupacName')}
                  type="text"
                  className={`form-input ${autoPopulated ? 'bg-green-50' : ''}`}
                  placeholder="IUPAC systematic name"
                  readOnly={autoPopulated}
                />
                {autoPopulated && (
                  <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem</p>
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
                  className={`form-input ${autoPopulated ? 'bg-green-50' : ''}`}
                  placeholder="g/mol"
                  readOnly={autoPopulated}
                />
                {autoPopulated && (
                  <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMILES
                </label>
                <input
                  {...register('chemicalProperties.canonicalSMILES')}
                  type="text"
                  className={`form-input ${autoPopulated ? 'bg-green-50' : ''}`}
                  placeholder="e.g., CCO (for ethanol)"
                  readOnly={autoPopulated}
                />
                {autoPopulated && (
                  <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem</p>
                )}
                {!autoPopulated && (
                  <p className="mt-1 text-xs text-gray-500">Simplified Molecular-Input Line-Entry System</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product/Chemical Name
                </label>
                <input
                  {...register('productName')}
                  type="text"
                  className={`form-input ${autoPopulated ? 'bg-green-50' : ''}`}
                  placeholder="Enter chemical or product name manually if not auto-populated"
                />
                {autoPopulated && (
                  <p className="mt-1 text-xs text-green-600">Auto-populated from PubChem</p>
                )}
                {!productName && (
                  <p className="mt-1 text-xs text-gray-500">Required if cannot be auto-populated from CAS lookup</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Physical State
                </label>
                <select {...register('chemicalProperties.physicalState')} className="form-select">
                  <option value="Solid">Solid</option>
                  <option value="Liquid">Liquid</option>
                  <option value="Gas">Gas</option>
                  <option value="Powder">Powder</option>
                  <option value="Crystal">Crystal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purity Min (%)
                </label>
                <input
                  {...register('chemicalProperties.purity.min')}
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="form-input"
                  placeholder="98.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purity Max (%)
                </label>
                <input
                  {...register('chemicalProperties.purity.max')}
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="form-input"
                  placeholder="99.9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SKU Variants */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">SKU Variants</h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={generateStandardSKUs}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Generate VAR/CONF/SPEC
                </button>
                <button
                  type="button"
                  onClick={calculatePricing}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Calculate Pricing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Default new SKU to appropriate values based on type
                    const newSKU = {
                      type: 'PREPACK',
                      sku: '',
                      packageSize: { value: 100, unit: baseUnit || 'g' },
                      pricing: { listPrice: 0, currency: 'USD' }
                    };
                    append(newSKU);
                  }}
                  className="btn btn-secondary flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add SKU
                </button>
              </div>
            </div>
          </div>
          <div className="card-body space-y-6">
            {fields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg font-medium">No SKU variants created yet</p>
                <p className="text-sm">Click "Generate VAR/CONF/SPEC" to create standard SKUs or "Add SKU" to create custom ones</p>
              </div>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">SKU #{index + 1}</h4>
                  {fields.length > 1 && (
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
                      onChange={(e) => handleSKUTypeChange(index, e.target.value)}
                    >
                      <option value="PREPACK">PREPACK</option>
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
                        onChange={(e) => handlePackageValueChange(index, e.target.value)}
                      />
                      <select 
                        {...register(`skuVariants.${index}.packageSize.unit`)} 
                        className="form-select rounded-l-none border-l-0"
                        onChange={(e) => handlePackageUnitChange(index, e.target.value)}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      List Price *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        $
                      </span>
                      <input
                        {...register(`skuVariants.${index}.pricing.listPrice`, { required: 'List price is required' })}
                        type="number"
                        step="0.01"
                        className="form-input rounded-l-none"
                        placeholder="99.99"
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
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hazard Classification */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Hazard Classification</h3>
          </div>
          <div className="card-body space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GHS Class
                </label>
                <select {...register('hazardClassification.ghsClass')} className="form-select">
                  <option value="">Select GHS Class</option>
                  <option value="H200-H299">H200-H299 (Physical Hazards)</option>
                  <option value="H300-H399">H300-H399 (Health Hazards)</option>
                  <option value="H400-H499">H400-H499 (Environmental Hazards)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signal Word
                </label>
                <select {...register('hazardClassification.signalWord')} className="form-select">
                  <option value="WARNING">WARNING</option>
                  <option value="DANGER">DANGER</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transport Class
                </label>
                <input
                  {...register('hazardClassification.transportClass')}
                  type="text"
                  className="form-input"
                  placeholder="e.g., 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UN Number
                </label>
                <input
                  {...register('hazardClassification.unNumber')}
                  type="text"
                  className="form-input"
                  placeholder="e.g., UN1170"
                />
              </div>
            </div>
            
            {autoPopulated && (
              <div className="grid grid-cols-1 gap-6">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hazard Statements (Auto-populated)
                  </label>
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <textarea
                      {...register('hazardClassification.hazardStatements')}
                      rows="3"
                      className="form-input bg-transparent border-0 p-0 resize-none"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* CorpBase Section */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">CorpBase Website Information</h3>
              <button
                type="button"
                onClick={() => generateProductDescription()}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Generate Description
              </button>
            </div>
          </div>
          <div className="card-body space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Description (Auto-generated by Claude)
              </label>
              <textarea
                {...register('corpbaseData.productDescription')}
                rows="4"
                className="form-input"
                placeholder="Click 'Generate Description' to auto-generate based on product name and chemical properties..."
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website Title
                </label>
                <input
                  {...register('corpbaseData.websiteTitle')}
                  type="text"
                  className="form-input"
                  placeholder="SEO-optimized title for website"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  {...register('corpbaseData.metaDescription')}
                  rows="2"
                  className="form-input"
                  placeholder="Brief description for search engines (150-160 characters)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Features & Benefits
              </label>
              <textarea
                {...register('corpbaseData.keyFeatures')}
                rows="3"
                className="form-input"
                placeholder="• High purity and quality&#10;• Suitable for research applications&#10;• Available in multiple sizes"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applications
                </label>
                <textarea
                  {...register('corpbaseData.applications')}
                  rows="3"
                  className="form-input"
                  placeholder="List key applications..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Industries
                </label>
                <textarea
                  {...register('corpbaseData.targetIndustries')}
                  rows="3"
                  className="form-input"
                  placeholder="Pharmaceutical, Biotechnology, Research..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Margin & Pricing Calculation */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Margin & Pricing Calculation</h3>
          </div>
          <div className="card-body space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Standard Cost Inputs</h4>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Base Costing Unit
                </label>
                <select
                  {...register('pricingData.baseUnit')}
                  className="form-select text-sm w-32"
                >
                  <option value="mg">mg (milligram)</option>
                  <option value="g">g (gram)</option>
                  <option value="kg">kg (kilogram)</option>
                  <option value="mL">mL (milliliter)</option>
                  <option value="L">L (liter)</option>
                  <option value="units">units</option>
                  <option value="vials">vials</option>
                  <option value="plates">plates</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Raw Material Cost ($/{baseUnit || 'unit'})
                  </label>
                  <input
                    {...register('pricingData.standardCosts.rawMaterialCostPerUnit')}
                    type="number"
                    step="0.01"
                    className="form-input text-sm"
                    placeholder="0.50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Packaging Cost ($/unit)
                  </label>
                  <input
                    {...register('pricingData.standardCosts.packagingCost')}
                    type="number"
                    step="0.01"
                    className="form-input text-sm"
                    placeholder="2.50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Labor & Overhead ($/unit)
                  </label>
                  <input
                    {...register('pricingData.standardCosts.laborOverheadCost')}
                    type="number"
                    step="0.01"
                    className="form-input text-sm"
                    placeholder="5.00"
                  />
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-900 mb-3">Target Margins</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Small Size Margin (%)
                  </label>
                  <input
                    {...register('pricingData.targetMargins.smallSize')}
                    type="number"
                    step="1"
                    className="form-input text-sm"
                    placeholder="75"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Medium Size Margin (%)
                  </label>
                  <input
                    {...register('pricingData.targetMargins.mediumSize')}
                    type="number"
                    step="1"
                    className="form-input text-sm"
                    placeholder="65"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Large Size Margin (%)
                  </label>
                  <input
                    {...register('pricingData.targetMargins.largeSize')}
                    type="number"
                    step="1"
                    className="form-input text-sm"
                    placeholder="55"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Bulk Size Margin (%)
                  </label>
                  <input
                    {...register('pricingData.targetMargins.bulkSize')}
                    type="number"
                    step="1"
                    className="form-input text-sm"
                    placeholder="45"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Pricing Guidelines</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Small sizes (&lt;10g): Higher margin due to packaging overhead</li>
                <li>• Medium sizes (10-100g): Standard research quantities</li>
                <li>• Large sizes (100g-1kg): Volume pricing begins</li>
                <li>• Bulk sizes (&gt;1kg): Lowest margin, competitive pricing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={loading}
            className="btn bg-gray-600 hover:bg-gray-700 text-white"
          >
            {loading ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicket;