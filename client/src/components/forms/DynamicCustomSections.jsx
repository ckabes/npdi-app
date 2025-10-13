import React from 'react';
import { useFormConfig } from '../../hooks/useFormConfig';
import DynamicFormSection from './DynamicFormSection';

/**
 * Renders custom sections (isCustom: true) from form configuration
 * For rendering ALL sections including built-in ones, use DynamicFormRenderer
 */
const DynamicCustomSections = ({ register, errors, watch, readOnly = false, formConfiguration = null }) => {
  const { config: defaultConfig, loading: defaultLoading } = useFormConfig();

  // Use provided formConfiguration if available, otherwise fall back to default
  const config = formConfiguration || defaultConfig;
  const loading = formConfiguration ? false : defaultLoading;

  if (loading || !config) return null;

  // Get only custom sections (ones added by admin)
  const customSections = config.sections
    ?.filter(section => section.isCustom && section.visible)
    .sort((a, b) => (a.order || 0) - (b.order || 0)) || [];

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
