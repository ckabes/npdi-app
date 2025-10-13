import React from 'react';

const DynamicFormSection = ({
  section,
  register,
  errors,
  watch,
  readOnly = false,
  data = {}
}) => {
  if (!section || !section.visible) return null;

  const renderField = (field) => {
    if (!field.visible) return null;

    const fieldPath = field.fieldKey;
    const value = watch ? watch(fieldPath) : data[field.fieldKey];
    const error = errors?.[field.fieldKey];
    const isReadOnly = readOnly || !field.editable;

    // Grid column class mapping
    const gridClass = {
      full: 'col-span-full',
      half: 'sm:col-span-1',
      third: 'sm:col-span-1 lg:col-span-1',
      quarter: 'sm:col-span-1 lg:col-span-1'
    }[field.gridColumn || 'full'] || 'col-span-full';

    const baseInputClass = isReadOnly
      ? 'form-input bg-gray-50 cursor-not-allowed'
      : 'form-input';

    const renderInput = () => {
      switch (field.type) {
        case 'textarea':
          return (
            <textarea
              {...(register ? register(fieldPath, {
                required: field.required ? `${field.label} is required` : false
              }) : {})}
              className={baseInputClass}
              placeholder={field.placeholder}
              rows={4}
              disabled={isReadOnly}
              defaultValue={isReadOnly ? value : undefined}
            />
          );

        case 'number':
          return (
            <input
              type="number"
              {...(register ? register(fieldPath, {
                required: field.required ? `${field.label} is required` : false,
                valueAsNumber: true,
                ...(field.validation?.min !== undefined && { min: field.validation.min }),
                ...(field.validation?.max !== undefined && { max: field.validation.max })
              }) : {})}
              className={baseInputClass}
              placeholder={field.placeholder}
              step={field.validation?.step || 'any'}
              disabled={isReadOnly}
              defaultValue={isReadOnly ? value : field.defaultValue}
            />
          );

        case 'select':
          return (
            <select
              {...(register ? register(fieldPath, {
                required: field.required ? `${field.label} is required` : false
              }) : {})}
              className={isReadOnly ? 'form-select bg-gray-50 cursor-not-allowed' : 'form-select'}
              disabled={isReadOnly}
              defaultValue={isReadOnly ? value : field.defaultValue}
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
                    {...(register ? register(fieldPath, {
                      required: field.required ? `${field.label} is required` : false
                    }) : {})}
                    value={option.value}
                    className="form-radio h-4 w-4 text-millipore-blue"
                    disabled={isReadOnly}
                    defaultChecked={isReadOnly ? value === option.value : field.defaultValue === option.value}
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
                {...(register ? register(fieldPath) : {})}
                className="form-checkbox rounded"
                disabled={isReadOnly}
                defaultChecked={isReadOnly ? value : field.defaultValue}
              />
              <span className="ml-2 text-sm text-gray-700">{field.label}</span>
            </div>
          );

        case 'date':
          return (
            <input
              type="date"
              {...(register ? register(fieldPath, {
                required: field.required ? `${field.label} is required` : false
              }) : {})}
              className={baseInputClass}
              disabled={isReadOnly}
              defaultValue={isReadOnly ? value : field.defaultValue}
            />
          );

        case 'email':
          return (
            <input
              type="email"
              {...(register ? register(fieldPath, {
                required: field.required ? `${field.label} is required` : false,
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              }) : {})}
              className={baseInputClass}
              placeholder={field.placeholder}
              disabled={isReadOnly}
              defaultValue={isReadOnly ? value : field.defaultValue}
            />
          );

        case 'url':
          return (
            <input
              type="url"
              {...(register ? register(fieldPath, {
                required: field.required ? `${field.label} is required` : false
              }) : {})}
              className={baseInputClass}
              placeholder={field.placeholder}
              disabled={isReadOnly}
              defaultValue={isReadOnly ? value : field.defaultValue}
            />
          );

        case 'text':
        default:
          return (
            <input
              type="text"
              {...(register ? register(fieldPath, {
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
              }) : {})}
              className={baseInputClass}
              placeholder={field.placeholder}
              disabled={isReadOnly}
              defaultValue={isReadOnly ? value : field.defaultValue}
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
