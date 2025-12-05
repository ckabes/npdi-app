import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../utils/AuthContext';
import { productAPI, templatesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ProductTicketForm } from '../components/forms';

const CreateTicket = () => {
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const { user, isPMOPS } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, control, setValue, watch, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      productName: '',
      priority: 'MEDIUM',
      sbu: '',
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
      similarProducts: '',
      businessLine: {
        line: '',
        mainGroupGPH: '',  // SAP GPH Product Line (YYD_GPHPL)
        otherSpecification: ''
      },
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
        storageTemperature: '',
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
      baseUnit: {
        value: 1,
        unit: 'kg'
      },
      pricingData: {
        standardCosts: {
          rawMaterialCostPerUnit: 0.50,
          packagingCost: 2.50,
          laborOverheadCost: 5.00
        },
        targetMargin: 50
      }
    }
  });

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

  const onSubmit = async (data) => {
    try {
      const response = await productAPI.createTicket(data);
      toast.success('Product ticket created successfully!', { duration: 4000 });

      // Navigate to tickets list (dashboard) after successful creation
      setTimeout(() => {
        navigate('/tickets');
      }, 500); // Small delay to let user see the success message
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
    }
  };

  const handleCancel = () => {
    navigate('/tickets');
  };

  return (
    <ProductTicketForm
      mode="create"
      template={template}
      loadingTemplate={loadingTemplate}
      register={register}
      handleSubmit={handleSubmit}
      control={control}
      setValue={setValue}
      watch={watch}
      errors={errors}
      isDirty={isDirty}
      onSubmit={onSubmit}
      onCancel={handleCancel}
      user={user}
    />
  );
};

export default CreateTicket;
