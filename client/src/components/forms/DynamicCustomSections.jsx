import React from 'react';
import { useFormConfig } from '../../hooks/useFormConfig';
import DynamicFormSection from './DynamicFormSection';

const DynamicCustomSections = ({ register, errors, watch, readOnly = false }) => {
  const { config, loading } = useFormConfig();

  if (loading || !config) return null;

  // Get only custom sections (ones added by admin)
  const customSections = config.sections
    .filter(section => section.isCustom && section.visible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (customSections.length === 0) return null;

  return (
    <>
      {customSections.map(section => (
        <DynamicFormSection
          key={section.sectionKey}
          section={section}
          register={register}
          errors={errors}
          watch={watch}
          readOnly={readOnly}
        />
      ))}
    </>
  );
};

export default DynamicCustomSections;
