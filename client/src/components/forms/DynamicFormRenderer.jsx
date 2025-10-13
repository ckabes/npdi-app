import React from 'react';
import { useFormConfig } from '../../hooks/useFormConfig';
import DynamicFormSection from './DynamicFormSection';

/**
 * Renders ALL sections (both built-in and custom) from form configuration based on template
 * This allows templates to control which sections are visible (e.g., hiding Chemical Properties for biologics)
 */
const DynamicFormRenderer = ({
  register,
  errors,
  watch,
  readOnly = false,
  formConfiguration = null,
  setValue
}) => {
  const { config: defaultConfig, loading: defaultLoading } = useFormConfig();

  // Use provided formConfiguration if available, otherwise fall back to default
  const config = formConfiguration || defaultConfig;
  const loading = formConfiguration ? false : defaultLoading;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-8">
        <p className="text-gray-500">Loading form configuration...</p>
      </div>
    );
  }

  if (!config || !config.sections) {
    return (
      <div className="max-w-4xl mx-auto text-center py-8">
        <p className="text-red-500">Error: No form configuration available</p>
      </div>
    );
  }

  // Get all visible sections (both built-in and custom), sorted by order
  const visibleSections = config.sections
    .filter(section => section.visible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (visibleSections.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-8">
        <p className="text-gray-500">No sections configured for this template</p>
      </div>
    );
  }

  return (
    <>
      {visibleSections.map(section => (
        <DynamicFormSection
          key={section.sectionKey}
          section={section}
          register={register}
          errors={errors}
          watch={watch}
          readOnly={readOnly}
          setValue={setValue}
        />
      ))}
    </>
  );
};

export default DynamicFormRenderer;
