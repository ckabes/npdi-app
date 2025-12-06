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
  const [missingRequiredFields, setMissingRequiredFields] = useState([]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const { user, isPMOPS, isAdmin } = useAuth();
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

  // Fetch all available templates for admin users
  useEffect(() => {
    const fetchAllTemplates = async () => {
      if (!isAdmin) return;

      try {
        const response = await templatesAPI.getAll();
        setAvailableTemplates(response.data || []);
      } catch (error) {
        console.error('Error fetching all templates:', error);
        setAvailableTemplates([]);
      }
    };

    fetchAllTemplates();
  }, [isAdmin]);

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
      setAttemptedSubmit(true);

      // Include template ID with ticket data
      const ticketData = {
        ...data,
        template: template?._id || null
      };

      const response = await productAPI.createTicket(ticketData);
      toast.success('Product ticket created successfully!', { duration: 4000 });

      // Navigate to tickets list (dashboard) after successful creation
      setTimeout(() => {
        navigate('/tickets');
      }, 500); // Small delay to let user see the success message
    } catch (error) {
      console.error('Create ticket error:', error);

      // Enhanced error handling with validation details
      const errorData = error.response?.data;

      // Handle submission requirements validation errors
      if (errorData?.error === 'Submission Requirements Not Met' && errorData?.missingFields) {
        setMissingRequiredFields(errorData.missingFields.map(f => f.fieldKey));

        // Show comprehensive error message
        const fieldLabels = errorData.missingFields.map(f => f.fieldLabel).join(', ');
        toast.error(
          `Cannot submit: Please fill in the following required fields: ${fieldLabels}`,
          { duration: 7000 }
        );

        // Scroll to top so user can see highlighted fields
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (errorData?.validationErrors && errorData.validationErrors.length > 0) {
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

  const handleLoadTemplate = async () => {
    if (!selectedTemplateId) {
      toast.error('Please select a template first');
      return;
    }

    try {
      setLoadingTemplate(true);
      const response = await templatesAPI.getById(selectedTemplateId);
      setTemplate(response.data);
      toast.success(`Template "${response.data.name}" loaded successfully!`);
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template. Please try again.');
    } finally {
      setLoadingTemplate(false);
    }
  };

  return (
    <div>
      {/* Admin Template Selector */}
      {isAdmin && availableTemplates.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label htmlFor="template-selector" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin: Select Ticket Template
                </label>
                <select
                  id="template-selector"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={loadingTemplate}
                >
                  <option value="">-- Select Template --</option>
                  {availableTemplates.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.formConfiguration?.name || t.name}
                      {t.isDefault && ' (Default)'}
                      {t.formConfiguration?.version && ` - v${t.formConfiguration.version}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-6">
                <button
                  onClick={handleLoadTemplate}
                  disabled={!selectedTemplateId || loadingTemplate}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingTemplate ? 'Loading...' : 'LOAD'}
                </button>
              </div>
            </div>
            {template && (
              <div className="mt-3 text-sm text-gray-600">
                Currently loaded: <span className="font-semibold">{template.formConfiguration?.name || template.name}</span>
                {template.formConfiguration?.version && ` (v${template.formConfiguration.version})`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Form */}
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
        missingRequiredFields={missingRequiredFields}
        attemptedSubmit={attemptedSubmit}
        submissionRequirements={template?.submissionRequirements || []}
      />
    </div>
  );
};

export default CreateTicket;
