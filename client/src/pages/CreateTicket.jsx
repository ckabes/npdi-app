import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '../utils/AuthContext';
import { productAPI, templatesAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  DynamicFormRenderer,
  DynamicFormSection,
  ChemicalPropertiesForm,
  QualitySpecificationsForm,
  PricingCalculationForm,
  SKUVariantsForm,
  CorpBaseDataForm,
  DynamicCustomSections
} from '../components/forms';
import MARASearchPopup from '../components/admin/MARASearchPopup';

const CreateTicket = () => {
  const [loading, setLoading] = useState(false);
  const [casLookupLoading, setCasLookupLoading] = useState(false);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [compositionLoadingIndex, setCompositionLoadingIndex] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [generatingAIContent, setGeneratingAIContent] = useState(false);
  const [aiFieldsLoading, setAIFieldsLoading] = useState({
    productDescription: false,
    websiteTitle: false,
    metaDescription: false,
    keyFeatures: false,
    applications: false,
    targetIndustries: false
  });
  const [showSAPPopup, setShowSAPPopup] = useState(false);
  const [sapImportedFields, setSapImportedFields] = useState(new Set());
  const [sapMetadata, setSapMetadata] = useState({});
  const { user, isProductManager, isPMOPS } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      productName: '',
      priority: 'MEDIUM',
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
        targetIndustries: '',
        unspscCode: ''
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

  // Load user's template on mount and when returning to the page
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!user?.email || !user?.role) return;

      try {
        setLoadingTemplate(true);
        const response = await templatesAPI.getUserTemplate(user.email, user.role);

        // Handle PM Ops case (no template)
        if (isPMOPS || !response.data) {
          setTemplate(null);
        } else {
          setTemplate(response.data);
        }
      } catch (error) {
        console.error('Error fetching template:', error);
        setTemplate(null);
      } finally {
        setLoadingTemplate(false);
      }
    };

    fetchTemplate();

    // Also reload template when window regains focus (user returns from another tab/window)
    const handleFocus = () => {
      fetchTemplate();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, isPMOPS]);

  const handleCASLookup = async () => {
    if (!casNumber || !/^\d{1,7}-\d{2}-\d$/.test(casNumber)) {
      toast.error('Please enter a valid CAS number (e.g., 64-17-5)');
      return;
    }

    setCasLookupLoading(true);
    setAutoPopulated(false); // Reset state

    // Clear all existing fields before fetching new data
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
        // Remove duplicates by using a Set, then filter and limit
        const uniqueStatements = [...new Set(data.chemicalProperties.hazardStatements)]
          .filter(s => s && s.trim().length > 0)
          .slice(0, 10); // Limit to first 10 unique statements

        const cleanStatements = uniqueStatements.join('\n');
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

          // Add new SKUs and wait for completion
          await new Promise(resolve => {
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
              resolve();
            }, 100);
          });
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

  const generateProductDescription = async () => {
    if (!productName) {
      toast.error('Please enter a product name first');
      return;
    }

    setGeneratingAIContent(true);

    // Reset all field loading states
    setAIFieldsLoading({
      productDescription: false,
      websiteTitle: false,
      metaDescription: false,
      keyFeatures: false,
      applications: false,
      targetIndustries: false
    });

    try {
      // Prepare product data for AI generation
      const productData = {
        productName: productName.trim(),
        casNumber: casNumber || '',
        molecularFormula: molecularFormula || '',
        molecularWeight: watch('chemicalProperties.molecularWeight') || '',
        iupacName: watch('chemicalProperties.iupacName') || '',
        sbu: sbu || 'Life Science'
      };

      console.log('Generating AI content for:', productData);

      const toastId = toast.loading('Starting AI content generation...', { duration: Infinity });

      // Call the AI generation endpoint
      const response = await productAPI.generateCorpBaseContent(productData);
      const result = response.data;

      console.log('AI generation result:', result);

      if (result.success && result.content) {
        // Populate fields one by one with visual feedback
        const fields = [
          { key: 'productDescription', label: 'Product Description', data: result.content.productDescription },
          { key: 'websiteTitle', label: 'Website Title', data: result.content.websiteTitle },
          { key: 'metaDescription', label: 'Meta Description', data: result.content.metaDescription },
          { key: 'keyFeatures', label: 'Key Features', data: result.content.keyFeatures },
          { key: 'applications', label: 'Applications', data: result.content.applications },
          { key: 'targetIndustries', label: 'Target Industries', data: result.content.targetIndustries }
        ];

        for (const field of fields) {
          if (field.data) {
            // Show loading state for this field
            setAIFieldsLoading(prev => ({ ...prev, [field.key]: true }));
            toast.loading(`Generating ${field.label}...`, { id: toastId });

            // Small delay for visual feedback
            await new Promise(resolve => setTimeout(resolve, 300));

            // Set the value
            setValue(`corpbaseData.${field.key}`, field.data, { shouldDirty: true });

            // Mark as complete
            setAIFieldsLoading(prev => ({ ...prev, [field.key]: false }));
          }
        }

        toast.dismiss(toastId);

        // Show different message based on whether AI was used
        if (result.aiGenerated) {
          toast.success('✨ AI-generated content created successfully!', { duration: 4000 });
        } else {
          toast.success('Template-based content generated (AI not available).', { duration: 4000 });
        }

      } else {
        console.warn('AI generation failed:', result.message);
        toast.dismiss(toastId);
        toast.error(result.message || 'Failed to generate content. Please try again.');
      }

    } catch (error) {
      console.error('Generate description error:', error);
      toast.dismiss();

      const errorMsg = error.response?.data?.message || error.message || 'Failed to generate content';

      // Check if it's a VPN/network connectivity issue
      if (errorMsg.includes('VPN') || errorMsg.includes('ENOTFOUND') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('network')) {
        toast('Not connected to Merck network. Generating content using standard templates instead.', {
          icon: '⚠️',
          duration: 5000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #FCD34D'
          }
        });

        // Try to generate with templates anyway
        try {
          const response = await productAPI.generateCorpBaseContent({
            productName: productName.trim(),
            casNumber: casNumber || '',
            molecularFormula: molecularFormula || '',
            molecularWeight: watch('chemicalProperties.molecularWeight') || '',
            iupacName: watch('chemicalProperties.iupacName') || '',
            sbu: sbu || 'Life Science',
            forceTemplate: true // Flag to force template-based generation
          });

          const result = response.data;
          if (result.success && result.content) {
            // Populate fields with template content
            const fields = [
              { key: 'productDescription', label: 'Product Description', data: result.content.productDescription },
              { key: 'websiteTitle', label: 'Website Title', data: result.content.websiteTitle },
              { key: 'metaDescription', label: 'Meta Description', data: result.content.metaDescription },
              { key: 'keyFeatures', label: 'Key Features', data: result.content.keyFeatures },
              { key: 'applications', label: 'Applications', data: result.content.applications },
              { key: 'targetIndustries', label: 'Target Industries', data: result.content.targetIndustries }
            ];

            for (const field of fields) {
              if (field.data) {
                setValue(`corpbaseData.${field.key}`, field.data, { shouldDirty: true });
              }
            }
            toast.success('Standard template content generated successfully.');
          }
        } catch (templateError) {
          console.error('Template generation also failed:', templateError);
          toast.error('Unable to generate content. Please enter information manually.');
        }
      }
      // Check if it's an AI configuration issue
      else if (errorMsg.includes('not enabled') || errorMsg.includes('API key')) {
        toast.error('AI content generation is not configured. Please contact your administrator.');
      } else {
        toast.error(`Content generation failed: ${errorMsg}`);
      }
    } finally {
      setGeneratingAIContent(false);
      // Reset all field loading states
      setAIFieldsLoading({
        productDescription: false,
        websiteTitle: false,
        metaDescription: false,
        keyFeatures: false,
        applications: false,
        targetIndustries: false
      });
    }
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

    const newWeightNum = parseFloat(newWeight) || 0;

    // First, set the changed field's value explicitly to ensure it's registered
    setValue(`composition.components.${changedIndex}.weightPercent`, newWeightNum, { shouldDirty: true });

    if (totalComponents <= 1) return; // No adjustment needed for single component

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

      // Enhanced error handling with validation details
      const errorData = error.response?.data;

      if (errorData?.validationErrors && errorData.validationErrors.length > 0) {
        // Show each validation error
        errorData.validationErrors.forEach((msg, index) => {
          setTimeout(() => {
            toast.error(msg, { duration: 5000 });
          }, index * 100); // Stagger toasts slightly
        });
      } else if (errorData?.message) {
        toast.error(errorData.message, { duration: 5000 });
      } else {
        toast.error('Failed to create ticket. Please check your input and try again.');
      }
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

      // Enhanced error handling with validation details
      const errorData = error.response?.data;

      if (errorData?.validationErrors && errorData.validationErrors.length > 0) {
        // Show each validation error
        errorData.validationErrors.forEach((msg, index) => {
          setTimeout(() => {
            toast.error(msg, { duration: 5000 });
          }, index * 100); // Stagger toasts slightly
        });
      } else if (errorData?.message) {
        toast.error(errorData.message, { duration: 5000 });
      } else {
        toast.error('Failed to save draft. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Smooth scroll to a specific section by ID or element
   * Adds a brief highlight animation to draw attention
   */
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add temporary highlight effect
      element.style.transition = 'box-shadow 0.3s ease-in-out';
      element.style.boxShadow = '0 0 20px 5px rgba(59, 130, 246, 0.5)';

      // Remove highlight after animation
      setTimeout(() => {
        element.style.boxShadow = '';
      }, 2000);
    }
  };

  /**
   * Handle SAP data import approval
   * Populates form fields with mapped SAP data and tracks which fields were imported
   * Then automatically triggers CAS lookup and AI generation if applicable
   */
  const handleSAPImport = async (mappedFields, metadata = {}) => {
    console.log('[SAP Import] Importing mapped fields:', mappedFields);
    console.log('[SAP Import] Metadata:', metadata);

    // Store metadata for later use (e.g., plant descriptions)
    setSapMetadata(metadata);

    const importedFieldPaths = new Set();

    // First pass: populate all non-SKU fields
    Object.entries(mappedFields).forEach(([fieldPath, value]) => {
      // Track this field as imported
      importedFieldPaths.add(fieldPath);

      // Handle nested paths (e.g., 'corpbaseData.productDescription')
      if (fieldPath.includes('.')) {
        setValue(fieldPath, value, { shouldDirty: true });
      } else if (fieldPath === 'skuVariants') {
        // Skip SKU variants for now - will handle separately
      } else {
        setValue(fieldPath, value, { shouldDirty: true });
      }
    });

    // Second pass: handle SKU variants separately and wait for completion
    if (mappedFields.skuVariants) {
      // Clear existing SKUs first
      const currentLength = fields.length;
      for (let i = currentLength - 1; i >= 0; i--) {
        remove(i);
      }

      // Add imported SKUs and wait for state to update
      await new Promise(resolve => {
        setTimeout(() => {
          mappedFields.skuVariants.forEach(sku => append(sku));
          resolve();
        }, 100);
      });
    }

    // Store which fields were imported for green highlighting
    setSapImportedFields(importedFieldPaths);

    toast.success(`Imported ${Object.keys(mappedFields).length} fields from SAP!`);

    // Wait a moment for state to update
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create a progress toast that we'll update
    const progressToastId = toast.loading('Starting automated enrichment...', { duration: Infinity });

    // Step 1: If CAS number is populated, trigger CAS lookup
    const importedCAS = mappedFields['chemicalProperties.casNumber'];
    if (importedCAS) {
      console.log('[SAP Import] CAS number found, triggering automatic lookup...');

      toast.loading('Step 1/2: Populating chemical data from PubChem...', { id: progressToastId });

      // Scroll to chemical properties section
      scrollToSection('chemical-properties-section');

      try {
        await handleCASLookup();
        console.log('[SAP Import] CAS lookup completed successfully');
        toast.success('✓ Chemical data populated from PubChem!', { id: progressToastId });
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (error) {
        console.warn('[SAP Import] CAS lookup failed:', error);
        toast.error('Could not auto-populate chemical data', { id: progressToastId });
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    // Step 2: Trigger AI generation for CorpBase data
    const importedProductName = mappedFields.productName;
    if (importedProductName) {
      console.log('[SAP Import] Product name found, triggering AI generation...');

      toast.loading('Step 2/2: Generating marketing content with AI...', { id: progressToastId });

      // Scroll to CorpBase section
      scrollToSection('corpbase-section');

      try {
        await generateProductDescription();
        console.log('[SAP Import] AI generation completed successfully');
        toast.success('✓ Marketing content generated!', { id: progressToastId });
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (error) {
        console.warn('[SAP Import] AI generation failed:', error);
        toast.error('Could not generate marketing content', { id: progressToastId });
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    // Step 3: Scroll back to top
    console.log('[SAP Import] Automation complete, scrolling to top...');
    toast.success('✨ SAP import automation complete!', { id: progressToastId, duration: 3000 });
    await new Promise(resolve => setTimeout(resolve, 500));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Get CSS class for SAP-imported fields (green highlight)
   */
  const getSAPImportedClass = (fieldPath) => {
    return sapImportedFields.has(fieldPath) ? 'border-2 border-green-500 bg-green-50' : '';
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
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Create New Product Ticket</h2>
            <p className="text-gray-600">Enter a CAS number to automatically populate chemical properties, or import data from SAP.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSAPPopup(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span>Import from SAP</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Render all sections dynamically based on template configuration */}
        {!loadingTemplate && template?.formConfiguration ? (
          <>
            {/* Render template-configured sections */}
            {template.formConfiguration.sections
              ?.filter(section => section.visible)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(section => {
                // Use specialized components for sections that need special functionality
                switch (section.sectionKey) {
                  case 'chemical':
                    return (
                      <div key={section.sectionKey} id="chemical-properties-section">
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
                      </div>
                    );

                  case 'composition':
                    // Check if composition section is visible
                    if (!section.visible) return null;
                    return (
                      <div key={section.sectionKey} className="card">
                          <div className="card-header">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">Product Composition</h3>
                                <p className="text-sm text-gray-500 mt-1">Define the chemical components that make up this product</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  console.log('Adding new component to composition (header button)');
                                  appendComposition({
                                    proprietary: false,
                                    componentCAS: '',
                                    weightPercent: 0,
                                    componentName: '',
                                    componentFormula: ''
                                  });
                                  toast.success('New component added to table');
                                }}
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
                                    onClick={() => {
                                      console.log('Populating composition with main chemical data');
                                      appendComposition({
                                        proprietary: false,
                                        componentCAS: casNumber,
                                        weightPercent: 100,
                                        componentName: productName,
                                        componentFormula: molecularFormula
                                      });
                                      toast.success(`Added ${productName} at 100%`);
                                    }}
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
                                                e.preventDefault();
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
                                {(() => {
                                  const totalWeight = compositionFields.reduce((sum, _, idx) => {
                                    const weight = watch(`composition.components.${idx}.weightPercent`) || 0;
                                    return sum + parseFloat(weight);
                                  }, 0);
                                  const roundedTotal = parseFloat(totalWeight.toFixed(2));
                                  const isOffBy = Math.abs(roundedTotal - 100) > 0.1;

                                  return (
                                    <>
                                      <p className="font-medium">Total Weight: {roundedTotal.toFixed(2)}%</p>
                                      {isOffBy && (
                                        <p className="text-orange-600 mt-1">⚠ Warning: Total weight should equal 100%</p>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>

                    );

                  case 'quality':
                    // Check if quality section is visible
                    if (!section.visible) return null;
                    return (
                      <QualitySpecificationsForm
                        key={section.sectionKey}
                        register={register}
                        watch={watch}
                        qualityFields={qualityFields}
                        appendQuality={appendQuality}
                        removeQuality={removeQuality}
                        readOnly={false}
                        editMode={false}
                      />
                    );

                  case 'pricing':
                    return (
                      <React.Fragment key={section.sectionKey}>
                        <PricingCalculationForm
                          register={register}
                          watch={watch}
                          readOnly={false}
                        />

                        {/* SKU Variants - shown after pricing */}
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
                      </React.Fragment>
                    );

                  case 'corpbase':
                    return (
                      <div key={section.sectionKey} id="corpbase-section">
                        <CorpBaseDataForm
                          register={register}
                          setValue={setValue}
                          watch={watch}
                          onGenerateDescription={generateProductDescription}
                          readOnly={false}
                          showGenerateButton={true}
                          isGenerating={generatingAIContent}
                          fieldsLoading={aiFieldsLoading}
                        />
                      </div>
                    );

                  // For all other sections (productionType, basic, vendor, custom sections), use DynamicFormSection
                  default:
                    return (
                      <DynamicFormSection
                        key={section.sectionKey}
                        section={section}
                        register={register}
                        errors={errors}
                        watch={watch}
                        setValue={setValue}
                        readOnly={false}
                        sapImportedFields={sapImportedFields}
                        getSAPImportedClass={getSAPImportedClass}
                        sapMetadata={sapMetadata}
                      />
                    );
                }
              })}
          </>
        ) : (
          // Fallback: use full dynamic renderer if template not loaded
          <DynamicFormRenderer
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            readOnly={false}
            formConfiguration={template?.formConfiguration}
          />
        )}

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

      {/* SAP Search Popup */}
      {showSAPPopup && (
        <MARASearchPopup
          onClose={() => setShowSAPPopup(false)}
          onApprove={handleSAPImport}
        />
      )}
    </div>
  );
};

export default CreateTicket;