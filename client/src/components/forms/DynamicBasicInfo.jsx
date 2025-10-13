import React from 'react';
import DynamicFormSection from './DynamicFormSection';

const DynamicBasicInfo = ({
  section,
  register,
  errors,
  watch,
  readOnly = false,
  productionType
}) => {
  if (!section) return null;

  // Filter fields and handle conditional display
  const visibleFields = section.fields?.filter(field => {
    if (!field.visible) return false;

    // Handle conditional display for vendor information fields
    if (field.fieldKey?.startsWith('vendorInformation.') && productionType !== 'Procured') {
      return false;
    }

    return true;
  }) || [];

  // Create modified section with filtered fields
  const modifiedSection = {
    ...section,
    fields: visibleFields
  };

  return (
    <>
      <DynamicFormSection
        section={modifiedSection}
        register={register}
        errors={errors}
        watch={watch}
        readOnly={readOnly}
      />

      {/* Vendor Information Section - shown conditionally */}
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
                disabled={readOnly}
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
                disabled={readOnly}
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
                disabled={readOnly}
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
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DynamicBasicInfo;
