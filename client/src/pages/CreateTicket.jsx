import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '../utils/AuthContext';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  ChemicalPropertiesForm,
  QualitySpecificationsForm,
  PricingCalculationForm,
  SKUVariantsForm,
  CorpBaseDataForm,
  DynamicCustomSections
} from '../components/forms';

const CreateTicket = () => {
  const [loading, setLoading] = useState(false);
  const [casLookupLoading, setCasLookupLoading] = useState(false);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [compositionLoadingIndex, setCompositionLoadingIndex] = useState(null);
  const { user, isProductManager } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      priority: 'MEDIUM',
      productLine: 'Chemical Products',
      sbu: isProductManager ? user?.sbu : 'P90',
      productionType: 'Produced', // Default to Produced
      skuVariants: [],
      primaryPlant: '',
      productScope: {
        scope: 'Worldwide',
        otherSpecification: ''
      },
      distributionType: 'Standard',
      retestOrExpiration: {
        type: 'None',
        shelfLife: {
          value: '',
          unit: 'months'
        }
      },
      sialProductHierarchy: '',
      materialGroup: '',
      countryOfOrigin: '',
      brand: '',
      vendorInformation: {
        vendorName: '',
        vendorProductName: '',
        vendorSAPNumber: '',
        vendorProductNumber: ''
      },
      chemicalProperties: {
        casNumber: '',
        physicalState: 'Solid',
        materialSource: '',
        animalComponent: '',
        storageConditions: { temperature: { unit: '°C' } },
        additionalProperties: {
          visibleProperties: []
        }
      },
      quality: {
        mqQualityLevel: 'N/A',
        attributes: []
      },
      composition: {
        components: []
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
        targetMargin: 50
      }
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'skuVariants'
  });

  const { fields: qualityFields, append: appendQuality, remove: removeQuality } = useFieldArray({
    control,
    name: 'quality.attributes'
  });

  const { fields: compositionFields, append: appendComposition, remove: removeComposition } = useFieldArray({
    control,
    name: 'composition.components'
  });

  const casNumber = watch('chemicalProperties.casNumber');
  const productName = watch('productName');
  const molecularFormula = watch('chemicalProperties.molecularFormula');
  const sbu = watch('sbu');
  const baseUnit = watch('pricingData.baseUnit');
  const productScope = watch('productScope.scope');
  const retestOrExpirationType = watch('retestOrExpiration.type');
  const productionType = watch('productionType');

  const handleCASLookup = async () => {
    if (!casNumber || !/^\d{1,7}-\d{2}-\d$/.test(casNumber)) {
      toast.error('Please enter a valid CAS number (e.g., 64-17-5)');
      return;
    }

    setCasLookupLoading(true);
    setAutoPopulated(false); // Reset state

    // Clear all existing fields before fetching new data
    setValue('productName', '', { shouldDirty: true });
    setValue('chemicalProperties.molecularFormula', '', { shouldDirty: true });
    setValue('chemicalProperties.molecularWeight', '', { shouldDirty: true });
    setValue('chemicalProperties.iupacName', '', { shouldDirty: true });
    setValue('chemicalProperties.canonicalSMILES', '', { shouldDirty: true });
    setValue('chemicalProperties.isomericSMILES', '', { shouldDirty: true });
    setValue('chemicalProperties.inchi', '', { shouldDirty: true });
    setValue('chemicalProperties.inchiKey', '', { shouldDirty: true });
    setValue('chemicalProperties.synonyms', '', { shouldDirty: true });
    setValue('chemicalProperties.hazardStatements', '', { shouldDirty: true });
    setValue('chemicalProperties.unNumber', '', { shouldDirty: true });
    setValue('chemicalProperties.pubchemCID', '', { shouldDirty: true });

    // Clear additional properties
    setValue('chemicalProperties.additionalProperties', {
      meltingPoint: null,
      boilingPoint: null,
      flashPoint: null,
      density: null,
      vaporPressure: null,
      vaporDensity: null,
      refractiveIndex: null,
      logP: null,
      polarSurfaceArea: null,
      hydrogenBondDonor: null,
      hydrogenBondAcceptor: null,
      rotatableBonds: null,
      exactMass: null,
      monoisotopicMass: null,
      complexity: null,
      heavyAtomCount: null,
      charge: null,
      visibleProperties: []
    }, { shouldDirty: true });

    // Clear SKU variants
    const currentLength = fields.length;
    for (let i = currentLength - 1; i >= 0; i--) {
      remove(i);
    }

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
        if (data.chemicalProperties.iupacName) {
          setValue('chemicalProperties.iupacName', data.chemicalProperties.iupacName, { shouldDirty: true });
        }
        if (data.chemicalProperties.canonicalSMILES) {
          setValue('chemicalProperties.canonicalSMILES', data.chemicalProperties.canonicalSMILES, { shouldDirty: true });
        }
        if (data.chemicalProperties.inchi) {
          setValue('chemicalProperties.inchi', data.chemicalProperties.inchi, { shouldDirty: true });
        }
        if (data.chemicalProperties.inchiKey) {
          setValue('chemicalProperties.inchiKey', data.chemicalProperties.inchiKey, { shouldDirty: true });
        }
      }
      
      // Handle synonyms and hazard statements in chemical properties
      if (data.chemicalProperties.synonyms && Array.isArray(data.chemicalProperties.synonyms)) {
        const cleanSynonyms = data.chemicalProperties.synonyms
          .filter(s => s && s.trim().length > 0)
          .slice(0, 10) // Limit to first 10
          .join(', ');
        if (cleanSynonyms) {
          setValue('chemicalProperties.synonyms', cleanSynonyms, { shouldDirty: true });
        }
      }

      if (data.chemicalProperties.hazardStatements && Array.isArray(data.chemicalProperties.hazardStatements)) {
        const cleanStatements = data.chemicalProperties.hazardStatements
          .filter(s => s && s.trim().length > 0)
          .slice(0, 10) // Limit to first 10
          .join('\n');
        if (cleanStatements) {
          setValue('chemicalProperties.hazardStatements', cleanStatements, { shouldDirty: true });
        }
      }

      if (data.chemicalProperties.unNumber) {
        setValue('chemicalProperties.unNumber', data.chemicalProperties.unNumber, { shouldDirty: true });
      }

      // Populate additional properties from PubChem (if available)
      if (data.chemicalProperties.additionalProperties) {
        console.log('Setting additional properties:', data.chemicalProperties.additionalProperties);
        setValue('chemicalProperties.additionalProperties', data.chemicalProperties.additionalProperties, { shouldDirty: true });
      } else {
        console.log('No additional properties in response');
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
    const targetMargin = parseFloat(watch('pricingData.targetMargin')) || 50;
    const baseUnit = watch('pricingData.baseUnit') || 'g';

    if (!standardCosts?.rawMaterialCostPerUnit || !targetMargin) {
      toast.error('Please fill in standard costs and target margin first');
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

    // Update pricing for each SKU variant - skip VAR/SPEC/CONF types
    fields.forEach((_, index) => {
      const packageSizeValue = parseFloat(watch(`skuVariants.${index}.packageSize.value`)) || 0;
      const packageUnit = watch(`skuVariants.${index}.packageSize.unit`) || baseUnit;
      const skuType = watch(`skuVariants.${index}.type`);

      // Skip pricing calculation for VAR, SPEC, and CONF types
      if (['VAR', 'SPEC', 'CONF'].includes(skuType)) {
        return;
      }

      // Only treat BULK type as true bulk (without material cost calculation)
      if (skuType === 'BULK') {
        // True bulk pricing - use minimum cost calculation without material cost
        const totalStandardCost = packagingCost + laborOverheadCost; // No material cost for bulk

        const listPrice = totalStandardCost / (1 - (targetMargin / 100));
        const roundedPrice = Math.round(listPrice * 100) / 100;

        setValue(`skuVariants.${index}.pricing.listPrice`, roundedPrice, { shouldDirty: true });
        setValue(`skuVariants.${index}.pricing.calculatedCost`, totalStandardCost, { shouldDirty: true });
        setValue(`skuVariants.${index}.pricing.calculatedMarginPercent`, targetMargin, { shouldDirty: true });

      } else if (packageSizeValue > 0) {
        // Standard packaging pricing calculation
        const conversionFactor = getConversionFactor(packageUnit, baseUnit);
        const packageSizeInBaseUnit = packageSizeValue * conversionFactor;

        // Calculate total standard cost
        const totalMaterialCost = rawCostPerUnit * packageSizeInBaseUnit;
        const totalStandardCost = totalMaterialCost + packagingCost + laborOverheadCost;

        // Use single target margin for all sizes
        const targetMarginPercent = targetMargin;

        // Calculate list price: Cost / (1 - margin%)
        const listPrice = totalStandardCost / (1 - (targetMarginPercent / 100));
        const roundedPrice = Math.round(listPrice * 100) / 100;

        setValue(`skuVariants.${index}.pricing.listPrice`, roundedPrice, { shouldDirty: true });

        // Store calculated values for margin display
        setValue(`skuVariants.${index}.pricing.calculatedCost`, totalStandardCost, { shouldDirty: true });
        setValue(`skuVariants.${index}.pricing.calculatedMarginPercent`, targetMarginPercent, { shouldDirty: true });
      }
    });

    toast.success('Pricing calculated based on container size and margin!');
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

    // Skip pricing calculation for VAR, SPEC, and CONF types
    if (['VAR', 'SPEC', 'CONF'].includes(skuType)) {
      return;
    }

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

    // Use single target margin
    const targetMarginPercent = parseFloat(pricingData.targetMargin) || 50;

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
    // PREPACK size uses actual packaging size for pricing calculations
    // Note: BULK is NOT generated here - it's added separately if needed
    const standardSKUs = [
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

  // CAS lookup for composition components
  const handleCompositionCASLookup = async (index, casValue) => {
    if (!casValue || !/^\d{1,7}-\d{2}-\d$/.test(casValue)) {
      return; // Silently return if invalid CAS format
    }

    setCompositionLoadingIndex(index);

    try {
      const response = await productAPI.lookupCAS(casValue);
      const data = response.data.data;

      // Populate component name and formula
      if (data.productName) {
        setValue(`composition.components.${index}.componentName`, data.productName, { shouldDirty: true });
      }
      if (data.chemicalProperties?.molecularFormula) {
        setValue(`composition.components.${index}.componentFormula`, data.chemicalProperties.molecularFormula, { shouldDirty: true });
      }

      toast.success(`Component data loaded for ${data.productName || casValue}`);
    } catch (error) {
      console.error('Component CAS lookup error:', error);
      toast.error(`Could not find data for CAS ${casValue}`);
    } finally {
      setCompositionLoadingIndex(null);
    }
  };

  // Auto-adjust weights proportionally to total 100%
  const handleWeightChange = (changedIndex, newWeight) => {
    const totalComponents = compositionFields.length;
    if (totalComponents <= 1) return; // No adjustment needed for single component

    const newWeightNum = parseFloat(newWeight) || 0;

    // Get current weights for all other components
    const otherComponents = compositionFields
      .map((_, idx) => idx)
      .filter(idx => idx !== changedIndex);

    const otherWeights = otherComponents.map(idx =>
      parseFloat(watch(`composition.components.${idx}.weightPercent`)) || 0
    );

    const currentOtherTotal = otherWeights.reduce((sum, w) => sum + w, 0);
    const remainingWeight = 100 - newWeightNum;

    if (remainingWeight < 0) {
      toast.error('Weight cannot exceed 100%');
      return;
    }

    // Proportionally adjust other components
    if (currentOtherTotal > 0 && remainingWeight >= 0) {
      otherComponents.forEach((idx, i) => {
        const proportionalWeight = (otherWeights[i] / currentOtherTotal) * remainingWeight;
        setValue(`composition.components.${idx}.weightPercent`, parseFloat(proportionalWeight.toFixed(2)), { shouldDirty: true });
      });
    } else if (remainingWeight > 0) {
      // Distribute remaining weight equally among other components
      const equalWeight = remainingWeight / otherComponents.length;
      otherComponents.forEach(idx => {
        setValue(`composition.components.${idx}.weightPercent`, parseFloat(equalWeight.toFixed(2)), { shouldDirty: true });
      });
    }
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
            <img src="/M.png" alt="MilliporeSigma" className="h-12" />
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
        {/* Production Type Toggle */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Production Type
                </label>
                <p className="text-xs text-gray-500">
                  Select whether this product is produced internally or procured from external suppliers
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    {...register('productionType')}
                    value="Produced"
                    className="form-radio h-4 w-4 text-millipore-blue"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Produced</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    {...register('productionType')}
                    value="Procured"
                    className="form-radio h-4 w-4 text-millipore-blue"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Procured</span>
                </label>
              </div>
            </div>
          </div>
        </div>

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

            {/* New Fields - Row 2 */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Plant
                </label>
                <input
                  {...register('primaryPlant')}
                  type="text"
                  className="form-input"
                  placeholder="Enter primary manufacturing plant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Scope
                </label>
                <select {...register('productScope.scope')} className="form-select">
                  <option value="Worldwide">Worldwide</option>
                  <option value="North America">North America</option>
                  <option value="South America">South America</option>
                  <option value="Europe">Europe</option>
                  <option value="Asia">Asia</option>
                  <option value="Africa">Africa</option>
                  <option value="Oceania">Oceania</option>
                  <option value="Other">Other (Specify)</option>
                </select>
              </div>

              {productScope === 'Other' && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specify Product Scope
                  </label>
                  <input
                    {...register('productScope.otherSpecification')}
                    type="text"
                    className="form-input"
                    placeholder="Enter specific product scope details"
                  />
                </div>
              )}
            </div>

            {/* New Fields - Row 3 */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distribution Type
                </label>
                <select {...register('distributionType')} className="form-select">
                  <option value="Standard">Standard</option>
                  <option value="Purchase on Demand">Purchase on Demand</option>
                  <option value="Dock-to-Stock">Dock-to-Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retest/Expiration
                </label>
                <select {...register('retestOrExpiration.type')} className="form-select">
                  <option value="None">None</option>
                  <option value="Retest">Retest Date</option>
                  <option value="Expiration">Expiration Date</option>
                </select>
              </div>

              {(retestOrExpirationType === 'Retest' || retestOrExpirationType === 'Expiration') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shelf Life Value
                    </label>
                    <input
                      {...register('retestOrExpiration.shelfLife.value')}
                      type="number"
                      className="form-input"
                      placeholder="Enter value"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shelf Life Unit
                    </label>
                    <select {...register('retestOrExpiration.shelfLife.unit')} className="form-select">
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* New Fields - Row 4 */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SIAL Product Hierarchy
                </label>
                <input
                  {...register('sialProductHierarchy')}
                  type="text"
                  className="form-input"
                  placeholder="Enter SIAL product hierarchy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Group
                </label>
                <input
                  {...register('materialGroup')}
                  type="text"
                  className="form-input"
                  placeholder="Enter material group"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country of Origin
                </label>
                <select {...register('countryOfOrigin')} className="form-select">
                  <option value="">Select country...</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="Mexico">Mexico</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Italy">Italy</option>
                  <option value="Spain">Spain</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="Belgium">Belgium</option>
                  <option value="Switzerland">Switzerland</option>
                  <option value="Austria">Austria</option>
                  <option value="Sweden">Sweden</option>
                  <option value="Denmark">Denmark</option>
                  <option value="Norway">Norway</option>
                  <option value="Finland">Finland</option>
                  <option value="Poland">Poland</option>
                  <option value="Czech Republic">Czech Republic</option>
                  <option value="Ireland">Ireland</option>
                  <option value="China">China</option>
                  <option value="Japan">Japan</option>
                  <option value="South Korea">South Korea</option>
                  <option value="India">India</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Taiwan">Taiwan</option>
                  <option value="Hong Kong">Hong Kong</option>
                  <option value="Australia">Australia</option>
                  <option value="New Zealand">New Zealand</option>
                  <option value="Brazil">Brazil</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Chile">Chile</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Israel">Israel</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <select {...register('brand')} className="form-select">
                  <option value="">Select brand...</option>
                  <option value="Sigma-Aldrich">Sigma-Aldrich</option>
                  <option value="SAFC">SAFC</option>
                  <option value="Supelco">Supelco</option>
                  <option value="Milli-Q">Milli-Q</option>
                  <option value="Millipore">Millipore</option>
                  <option value="BioReliance">BioReliance</option>
                  <option value="Calbiochem">Calbiochem</option>
                  <option value="Merck">Merck</option>
                </select>
              </div>
            </div>

            {/* Vendor Information - Only shown if Procured */}
            {productionType === 'Procured' && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Vendor Information</h4>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Name
                    </label>
                    <input
                      {...register('vendorInformation.vendorName')}
                      type="text"
                      className="form-input"
                      placeholder="Enter vendor name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Product Name
                    </label>
                    <input
                      {...register('vendorInformation.vendorProductName')}
                      type="text"
                      className="form-input"
                      placeholder="Enter vendor product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor SAP Number
                    </label>
                    <input
                      {...register('vendorInformation.vendorSAPNumber')}
                      type="text"
                      className="form-input"
                      placeholder="Enter vendor SAP number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Product #
                    </label>
                    <input
                      {...register('vendorInformation.vendorProductNumber')}
                      type="text"
                      className="form-input"
                      placeholder="Enter vendor product number"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chemical Properties */}
        <ChemicalPropertiesForm
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          autoPopulated={autoPopulated}
          casLookupLoading={casLookupLoading}
          onCASLookup={handleCASLookup}
          readOnly={false}
          showAutoPopulateButton={true}
        />

        {/* Composition Section */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Product Composition</h3>
                <p className="text-sm text-gray-500 mt-1">Define the chemical components that make up this product</p>
              </div>
              <button
                type="button"
                onClick={() => appendComposition({
                  proprietary: false,
                  componentCAS: '',
                  weightPercent: 0,
                  componentName: '',
                  componentFormula: ''
                })}
                className="btn btn-sm btn-secondary"
              >
                + Add Component
              </button>
            </div>
          </div>
          <div className="card-body">
            {compositionFields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No components added yet.</p>
                {casNumber && productName && molecularFormula && (
                  <button
                    type="button"
                    onClick={() => appendComposition({
                      proprietary: false,
                      componentCAS: casNumber,
                      weightPercent: 100,
                      componentName: productName,
                      componentFormula: molecularFormula
                    })}
                    className="mt-3 btn btn-sm btn-primary"
                  >
                    Populate with Chemical Data (100%)
                  </button>
                )}
                <p className="text-sm mt-2">Or click "+ Add Component" above to add manually.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proprietary
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Component CAS
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight %
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Component Name
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Component Formula
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {compositionFields.map((field, index) => (
                      <tr key={field.id}>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <select
                            {...register(`composition.components.${index}.proprietary`)}
                            className="form-select text-sm"
                          >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            {...register(`composition.components.${index}.componentCAS`)}
                            type="text"
                            className="form-input text-sm w-32"
                            placeholder="CAS Number"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault(); // Prevent form submission
                              }
                            }}
                            onBlur={(e) => {
                              const casValue = e.target.value;
                              handleCompositionCASLookup(index, casValue);
                            }}
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            {...register(`composition.components.${index}.weightPercent`, {
                              valueAsNumber: true,
                              min: 0,
                              max: 100
                            })}
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className="form-input text-sm w-24"
                            placeholder="0-100"
                            onChange={(e) => {
                              const newWeight = e.target.value;
                              handleWeightChange(index, newWeight);
                            }}
                          />
                        </td>
                        <td className="px-3 py-4">
                          <div className="relative">
                            <input
                              {...register(`composition.components.${index}.componentName`)}
                              type="text"
                              className="form-input text-sm w-48"
                              placeholder="Component Name"
                            />
                            {compositionLoadingIndex === index && (
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg className="animate-spin h-4 w-4 text-millipore-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="relative">
                            <input
                              {...register(`composition.components.${index}.componentFormula`)}
                              type="text"
                              className="form-input text-sm w-32"
                              placeholder="Formula"
                            />
                            {compositionLoadingIndex === index && (
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg className="animate-spin h-4 w-4 text-millipore-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => removeComposition(index)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {compositionFields.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium">Total Weight: {compositionFields.reduce((sum, _, idx) => {
                  const weight = watch(`composition.components.${idx}.weightPercent`) || 0;
                  return sum + parseFloat(weight);
                }, 0).toFixed(2)}%</p>
                {Math.abs(compositionFields.reduce((sum, _, idx) => {
                  const weight = watch(`composition.components.${idx}.weightPercent`) || 0;
                  return sum + parseFloat(weight);
                }, 0) - 100) > 0.01 && (
                  <p className="text-orange-600 mt-1">⚠ Warning: Total weight should equal 100%</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quality Section */}
        <QualitySpecificationsForm
          register={register}
          watch={watch}
          qualityFields={qualityFields}
          appendQuality={appendQuality}
          removeQuality={removeQuality}
          readOnly={false}
          editMode={false}
        />

        {/* Margin & Pricing Calculation */}
        <PricingCalculationForm
          register={register}
          watch={watch}
          readOnly={false}
        />

        {/* SKU Variants */}
        <SKUVariantsForm
          register={register}
          watch={watch}
          setValue={setValue}
          fields={fields}
          append={append}
          remove={remove}
          onCalculatePricing={calculatePricing}
          onGenerateStandardSKUs={generateStandardSKUs}
          onSKUTypeChange={handleSKUTypeChange}
          onPackageUnitChange={handlePackageUnitChange}
          onPackageValueChange={handlePackageValueChange}
          readOnly={false}
          showActionButtons={true}
          errors={errors}
        />

        {/* CorpBase Section */}
        <CorpBaseDataForm
          register={register}
          onGenerateDescription={generateProductDescription}
          readOnly={false}
          showGenerateButton={true}
        />

        {/* Dynamic Custom Sections (added by admin via Form Configuration) */}
        <DynamicCustomSections
          register={register}
          errors={errors}
          watch={watch}
          readOnly={false}
        />

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