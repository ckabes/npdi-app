import React from 'react';

const DynamicFormSection = ({
  section,
  register,
  errors,
  watch,
  setValue,
  readOnly = false,
  data = {},
  previewMode = false,  // New prop: when true, show all fields regardless of visibility conditions
  sapImportedFields = new Set(),  // Set of field paths that were imported from SAP
  getSAPImportedClass = () => '',  // Function to get CSS class for SAP-imported fields
  sapMetadata = {}  // Metadata from SAP import (e.g., descriptions)
}) => {
  if (!section || !section.visible) return null;

  // Track which fields have been edited by the user
  const [editedFields, setEditedFields] = React.useState(new Set());

  // Handle field edit to hide metadata descriptions
  const handleFieldEdit = (fieldKey) => {
    setEditedFields(prev => new Set([...prev, fieldKey]));
  };

  // Helper function to check if a field would be visible
  const isFieldVisible = (field) => {
    if (!field.visible) return false;

    // In preview mode, show all fields regardless of visibility conditions
    if (previewMode) return true;

    // Check field visibility dependencies
    if (field.visibleWhen) {
      const { fieldKey: dependentFieldKey, value: requiredValue, values: requiredValues } = field.visibleWhen;

      // If visibleWhen exists but has no actual conditions, treat as always visible
      const hasNoConditions = !dependentFieldKey &&
                              requiredValue === undefined &&
                              (!requiredValues || requiredValues.length === 0);
      if (hasNoConditions) {
        return true;
      }

      // In read-only preview mode, get the default value of the dependent field
      const dependentField = section.fields?.find(f => f.fieldKey === dependentFieldKey);
      const currentValue = readOnly && dependentField?.defaultValue !== undefined
        ? dependentField.defaultValue
        : (watch ? watch(dependentFieldKey) : data[dependentFieldKey]);

      // Handle array of values (OR condition)
      if (requiredValues && Array.isArray(requiredValues) && requiredValues.length > 0) {
        return requiredValues.includes(currentValue);
      }

      // Convert checkbox string values to boolean for comparison
      let compareValue = currentValue;
      let compareRequired = requiredValue;

      if (requiredValue === 'true' || requiredValue === 'false') {
        compareRequired = requiredValue === 'true';
        compareValue = Boolean(currentValue);
      }

      // Only show this field if the dependent field has the required value
      if (compareValue !== compareRequired) {
        return false;
      }
    }

    return true;
  };

  // Check if any fields in this section would be visible
  // If no fields are visible, hide the entire section (unless in preview mode)
  if (!previewMode) {
    const hasVisibleFields = section.fields?.some(field => isFieldVisible(field));
    if (!hasVisibleFields) return null;
  }

  const renderField = (field) => {
    if (!field.visible) return null;

    // Check field visibility dependencies (skip in preview mode)
    if (!previewMode && field.visibleWhen) {
      const { fieldKey: dependentFieldKey, value: requiredValue, values: requiredValues } = field.visibleWhen;

      // If visibleWhen exists but has no actual conditions, treat as always visible
      const hasNoConditions = !dependentFieldKey &&
                              requiredValue === undefined &&
                              (!requiredValues || requiredValues.length === 0);
      if (hasNoConditions) {
        // Continue rendering - field is always visible
      } else {
        // In read-only preview mode, get the default value of the dependent field
        const dependentField = section.fields?.find(f => f.fieldKey === dependentFieldKey);
        const currentValue = readOnly && dependentField?.defaultValue !== undefined
          ? dependentField.defaultValue
          : (watch ? watch(dependentFieldKey) : data[dependentFieldKey]);

        // Handle array of values (OR condition)
        if (requiredValues && Array.isArray(requiredValues) && requiredValues.length > 0) {
          if (!requiredValues.includes(currentValue)) {
            return null;
          }
        } else {
          // Convert checkbox string values to boolean for comparison
          let compareValue = currentValue;
          let compareRequired = requiredValue;

          if (requiredValue === 'true' || requiredValue === 'false') {
            compareRequired = requiredValue === 'true';
            compareValue = Boolean(currentValue);
          }

          // Only show this field if the dependent field has the required value
          if (compareValue !== compareRequired) {
            return null;
          }
        }
      }
    }

    const fieldPath = field.fieldKey;
    // In read-only preview mode, prefer field.defaultValue over watch/data
    // This ensures the preview shows the configured default value
    const value = readOnly && field.defaultValue !== undefined
      ? field.defaultValue
      : (watch ? watch(fieldPath) : data[field.fieldKey]);
    const error = errors?.[field.fieldKey];
    // When readOnly is false (create/edit mode), ignore field.editable - all fields should be editable
    // Only apply field.editable restriction when in readOnly (view) mode
    const isReadOnly = readOnly && !field.editable;

    // Grid column class mapping
    const gridClass = {
      full: 'col-span-full',
      half: 'sm:col-span-1',
      third: 'sm:col-span-1 lg:col-span-1',
      quarter: 'sm:col-span-1 lg:col-span-1'
    }[field.gridColumn || 'full'] || 'col-span-full';

    // Add green highlight for SAP-imported fields
    const sapHighlight = getSAPImportedClass(fieldPath);
    const baseInputClass = isReadOnly
      ? `form-input bg-gray-50 cursor-not-allowed ${sapHighlight}`
      : `form-input ${sapHighlight}`;

    // Check if there's metadata description for this field
    const metadataKey = `${field.fieldKey}Description`;
    const hasMetadata = sapMetadata[metadataKey] && !editedFields.has(field.fieldKey);

    const renderInput = () => {
      switch (field.type) {
        case 'textarea':
          if (isReadOnly) {
            return (
              <textarea
                className={baseInputClass}
                value={value || ''}
                rows={4}
                disabled={true}
                readOnly={true}
              />
            );
          }
          return (
            <textarea
              {...register(fieldPath, {
                required: field.required ? `${field.label} is required` : false
              })}
              className={baseInputClass}
              placeholder={field.placeholder}
              rows={4}
            />
          );

        case 'number':
          if (isReadOnly) {
            return (
              <input
                type="number"
                className={baseInputClass}
                value={value || ''}
                disabled={true}
                readOnly={true}
              />
            );
          }
          return (
            <input
              type="number"
              {...register(fieldPath, {
                required: field.required ? `${field.label} is required` : false,
                valueAsNumber: true,
                ...(field.validation?.min !== undefined && { min: field.validation.min }),
                ...(field.validation?.max !== undefined && { max: field.validation.max })
              })}
              className={baseInputClass}
              placeholder={field.placeholder}
              step={field.validation?.step || 'any'}
            />
          );

        case 'select':
          if (isReadOnly) {
            return (
              <select
                className="form-select bg-gray-50 cursor-not-allowed"
                value={value || ''}
                disabled={true}
              >
                <option value="">Select {field.label}...</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            );
          }
          return (
            <select
              {...register(fieldPath, {
                required: field.required ? `${field.label} is required` : false
              })}
              className="form-select"
            >
              <option value="">Select {field.label}...</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        case 'radio':
          return (
            <div className="flex items-center space-x-4">
              {field.options?.map(option => (
                <label key={option.value} className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    {...register(fieldPath, {
                      required: field.required ? `${field.label} is required` : false
                    })}
                    value={option.value}
                    className="form-radio h-4 w-4 text-millipore-blue"
                    disabled={isReadOnly}
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          );

        case 'checkbox':
          return (
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register(fieldPath)}
                className="form-checkbox rounded"
                disabled={isReadOnly}
              />
              <span className="ml-2 text-sm text-gray-700">{field.label}</span>
            </div>
          );

        case 'date':
          if (isReadOnly) {
            return (
              <input
                type="date"
                className={baseInputClass}
                value={value || ''}
                disabled={true}
                readOnly={true}
              />
            );
          }
          return (
            <input
              type="date"
              {...register(fieldPath, {
                required: field.required ? `${field.label} is required` : false
              })}
              className={baseInputClass}
            />
          );

        case 'email':
          if (isReadOnly) {
            return (
              <input
                type="email"
                className={baseInputClass}
                value={value || ''}
                disabled={true}
                readOnly={true}
              />
            );
          }
          return (
            <input
              type="email"
              {...register(fieldPath, {
                required: field.required ? `${field.label} is required` : false,
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className={baseInputClass}
              placeholder={field.placeholder}
            />
          );

        case 'url':
          if (isReadOnly) {
            return (
              <input
                type="url"
                className={baseInputClass}
                value={value || ''}
                disabled={true}
                readOnly={true}
              />
            );
          }
          return (
            <input
              type="url"
              {...register(fieldPath, {
                required: field.required ? `${field.label} is required` : false
              })}
              className={baseInputClass}
              placeholder={field.placeholder}
            />
          );

        case 'text':
        default:
          // In readOnly mode, use a plain input with value
          // In edit mode, use react-hook-form's register without defaultValue
          if (isReadOnly) {
            return (
              <input
                type="text"
                className={baseInputClass}
                value={value || ''}
                disabled={true}
                readOnly={true}
              />
            );
          }

          // Editable mode - use register if available
          if (!register) {
            console.warn(`DynamicFormSection: register not provided for field ${fieldPath}`);
            return (
              <input
                type="text"
                className={baseInputClass}
                placeholder={field.placeholder}
              />
            );
          }

          // Special handling for productName - using controlled input with manual onChange
          // This works around an issue with react-hook-form's register
          if (fieldPath === 'productName') {
            const currentValue = watch ? watch('productName') : '';
            return (
              <input
                type="text"
                name="productName"
                value={currentValue || ''}
                className={baseInputClass}
                placeholder={field.placeholder}
                onChange={(e) => {
                  if (setValue) {
                    setValue('productName', e.target.value, { shouldDirty: true, shouldValidate: true });
                  }
                }}
              />
            );
          }

          const { onChange: registerOnChange, ...registerProps } = register(fieldPath, {
            required: field.required ? `${field.label} is required` : false,
            ...(field.validation?.pattern && {
              pattern: {
                value: new RegExp(field.validation.pattern),
                message: `Invalid ${field.label.toLowerCase()} format`
              }
            }),
            ...(field.validation?.minLength && {
              minLength: {
                value: field.validation.minLength,
                message: `${field.label} must be at least ${field.validation.minLength} characters`
              }
            }),
            ...(field.validation?.maxLength && {
              maxLength: {
                value: field.validation.maxLength,
                message: `${field.label} must be at most ${field.validation.maxLength} characters`
              }
            })
          });

          return (
            <input
              type="text"
              {...registerProps}
              onChange={(e) => {
                registerOnChange(e);
                handleFieldEdit(field.fieldKey);
              }}
              className={baseInputClass}
              placeholder={field.placeholder}
            />
          );
      }
    };

    // Don't show label for checkbox type (label is inline)
    if (field.type === 'checkbox') {
      return (
        <div key={field.fieldKey} className={gridClass}>
          {renderInput()}
          {field.helpText && (
            <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
          )}
          {error && (
            <p className="mt-1 text-sm text-red-600">{error.message}</p>
          )}
        </div>
      );
    }

    return (
      <div key={field.fieldKey} className={gridClass}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {renderInput()}
        {hasMetadata && (
          <p className="mt-1 text-xs text-gray-500 italic">
            {sapMetadata[metadataKey]}
          </p>
        )}
        {field.helpText && (
          <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error.message}</p>
        )}
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{section.name}</h3>
          {section.description && (
            <p className="text-sm text-gray-500 mt-1">{section.description}</p>
          )}
        </div>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {section.fields
            ?.sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(field => renderField(field))}
        </div>
      </div>
    </div>
  );
};

export default DynamicFormSection;
