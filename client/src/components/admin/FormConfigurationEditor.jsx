import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckIcon,
  XMarkIcon,
  Bars3Icon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { formConfigAPI } from '../../services/api';
import toast from 'react-hot-toast';
import DynamicFormSection from '../forms/DynamicFormSection';

const FormConfigurationEditor = ({ configId, templateId, templateName }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(null);
  const [editingOptions, setEditingOptions] = useState(null); // { sectionKey, fieldKey }
  const [showDefaultFormWarning, setShowDefaultFormWarning] = useState(false);
  const [defaultFormWarningStep, setDefaultFormWarningStep] = useState(1);
  const [defaultFormConfirmed, setDefaultFormConfirmed] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // Store the action to execute after confirmation
  const [selectedSectionKey, setSelectedSectionKey] = useState(null); // Track which section is being edited
  const [showVersionManagementModal, setShowVersionManagementModal] = useState(false);
  const [versionAction, setVersionAction] = useState(null); // 'restore', 'discard', or 'rollback'

  useEffect(() => {
    loadConfig();
  }, [configId]);

  // Set first section as selected when config loads
  useEffect(() => {
    if (config && config.sections.length > 0 && !selectedSectionKey) {
      setSelectedSectionKey(config.sections[0].sectionKey);
    }
  }, [config, selectedSectionKey]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      // If configId is provided, load that specific config
      // Otherwise, load the active config (for backwards compatibility)
      const response = configId
        ? await formConfigAPI.getById(configId)
        : await formConfigAPI.getActive();
      setConfig(response.data.data);
    } catch (error) {
      console.error('Error loading form configuration:', error);
      toast.error('Failed to load form configuration');
    } finally {
      setLoading(false);
    }
  };

  // Check if this is the default template (not just the default form configuration)
  const isDefaultForm = () => {
    // Only show warnings if editing the "Default" template specifically
    // Multiple templates can share the same form configuration, but warnings should only appear for the Default template
    return templateName === 'Default';
  };

  // Helper function to require confirmation before editing default form
  const requireDefaultFormConfirmation = (action) => {
    if (isDefaultForm() && !defaultFormConfirmed) {
      setPendingAction({ type: 'action', execute: action });
      setShowDefaultFormWarning(true);
      setDefaultFormWarningStep(1);
      return false;
    }
    return true;
  };

  // Execute the pending action after confirmation
  const executePendingAction = () => {
    if (pendingAction && pendingAction.execute) {
      pendingAction.execute();
    }
    setPendingAction(null);
    setShowDefaultFormWarning(false);
    setDefaultFormConfirmed(true);
  };

  // Cancel the pending action
  const cancelPendingAction = () => {
    setPendingAction(null);
    setShowDefaultFormWarning(false);
    setDefaultFormWarningStep(1);
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      const response = await formConfigAPI.update(config._id, config);
      setConfig(response.data.data);
      toast.success('Form configuration saved as draft');
    } catch (error) {
      console.error('Error saving form configuration:', error);
      toast.error('Failed to save form configuration');
    } finally {
      setSaving(false);
    }
  };

  const publishConfig = async () => {
    try {
      setPublishing(true);

      // First, save the current configuration to ensure all changes are persisted
      toast.loading('Saving changes before publishing...', { id: 'save-publish' });
      const saveResponse = await formConfigAPI.update(config._id, config);
      const savedConfig = saveResponse.data.data;
      setConfig(savedConfig);

      // Then publish the saved configuration
      toast.loading('Publishing configuration...', { id: 'save-publish' });
      const publishResponse = await formConfigAPI.publish(savedConfig._id);
      setConfig(publishResponse.data.data);
      setShowPublishModal(false);

      toast.success(publishResponse.data.message || 'Form configuration saved and published successfully', { id: 'save-publish' });
    } catch (error) {
      console.error('Error publishing form configuration:', error);
      toast.error(error.response?.data?.message || 'Failed to save and publish form configuration', { id: 'save-publish' });
    } finally {
      setPublishing(false);
    }
  };

  const handleRestoreDefault = async () => {
    try {
      toast.loading('Restoring default configuration...', { id: 'version-action' });
      const response = await formConfigAPI.restoreDefault(config._id);
      setConfig(response.data.data);
      setShowVersionManagementModal(false);
      setVersionAction(null);
      toast.success(response.data.message || 'Configuration restored to default successfully', { id: 'version-action' });
    } catch (error) {
      console.error('Error restoring default configuration:', error);
      toast.error(error.response?.data?.message || 'Failed to restore default configuration', { id: 'version-action' });
    }
  };

  const handleDiscardDraft = async () => {
    try {
      toast.loading('Discarding draft changes...', { id: 'version-action' });
      const response = await formConfigAPI.discardDraft(config._id);
      setConfig(response.data.data);
      setShowVersionManagementModal(false);
      setVersionAction(null);
      toast.success(response.data.message || 'Draft discarded successfully', { id: 'version-action' });
    } catch (error) {
      console.error('Error discarding draft:', error);
      toast.error(error.response?.data?.message || 'Failed to discard draft', { id: 'version-action' });
    }
  };

  const handleRollback = async () => {
    try {
      toast.loading('Rolling back to previous version...', { id: 'version-action' });
      const response = await formConfigAPI.rollback(config._id);
      setConfig(response.data.data);
      setShowVersionManagementModal(false);
      setVersionAction(null);
      toast.success(response.data.message || 'Successfully rolled back to previous version', { id: 'version-action' });
    } catch (error) {
      console.error('Error rolling back:', error);
      toast.error(error.response?.data?.message || 'Failed to rollback', { id: 'version-action' });
    }
  };

  const updateFieldProperty = (sectionKey, fieldKey, property, value) => {
    if (!requireDefaultFormConfirmation(() => updateFieldProperty(sectionKey, fieldKey, property, value))) {
      return;
    }

    setConfig(prev => {
      const updated = { ...prev };
      const section = updated.sections.find(s => s.sectionKey === sectionKey);
      if (section) {
        const field = section.fields.find(f => f.fieldKey === fieldKey);
        if (field) {
          field[property] = value;
        }
      }
      return updated;
    });
  };

  const updateFieldOptions = (sectionKey, fieldKey, options) => {
    if (!requireDefaultFormConfirmation(() => updateFieldOptions(sectionKey, fieldKey, options))) {
      return;
    }

    setConfig(prev => {
      const updated = { ...prev };
      const section = updated.sections.find(s => s.sectionKey === sectionKey);
      if (section) {
        const field = section.fields.find(f => f.fieldKey === fieldKey);
        if (field) {
          field.options = options;
        }
      }
      return updated;
    });
  };

  const updateSectionProperty = (sectionKey, property, value) => {
    if (!requireDefaultFormConfirmation(() => updateSectionProperty(sectionKey, property, value))) {
      return;
    }

    setConfig(prev => {
      const updated = { ...prev };
      const section = updated.sections.find(s => s.sectionKey === sectionKey);
      if (section) {
        section[property] = value;
      }
      return updated;
    });
  };

  const moveSectionUp = (index) => {
    if (index === 0) return;
    if (!requireDefaultFormConfirmation(() => moveSectionUp(index))) {
      return;
    }

    setConfig(prev => {
      const updated = { ...prev };
      const sections = [...updated.sections];
      [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
      sections.forEach((section, idx) => {
        section.order = idx + 1;
      });
      updated.sections = sections;
      return updated;
    });
  };

  const moveSectionDown = (index) => {
    if (!config || index === config.sections.length - 1) return;
    if (!requireDefaultFormConfirmation(() => moveSectionDown(index))) {
      return;
    }

    setConfig(prev => {
      const updated = { ...prev };
      const sections = [...updated.sections];
      [sections[index + 1], sections[index]] = [sections[index], sections[index + 1]];
      sections.forEach((section, idx) => {
        section.order = idx + 1;
      });
      updated.sections = sections;
      return updated;
    });
  };

  const addSection = (newSection) => {
    setConfig(prev => {
      const updated = { ...prev };
      updated.sections.push({
        ...newSection,
        isCustom: true,
        order: updated.sections.length + 1,
        fields: []
      });
      return updated;
    });
    setShowAddSectionModal(false);
    toast.success('Section added successfully');
  };

  const deleteSection = (sectionKey) => {
    const section = config.sections.find(s => s.sectionKey === sectionKey);
    if (!section.isCustom) {
      toast.error('Cannot delete built-in sections');
      return;
    }
    if (window.confirm('Are you sure you want to delete this section?')) {
      setConfig(prev => {
        const updated = { ...prev };
        updated.sections = updated.sections.filter(s => s.sectionKey !== sectionKey);
        updated.sections.forEach((section, idx) => {
          section.order = idx + 1;
        });
        return updated;
      });
      // If deleted section was selected, select the first section
      if (selectedSectionKey === sectionKey && config.sections.length > 1) {
        const remainingSections = config.sections.filter(s => s.sectionKey !== sectionKey);
        if (remainingSections.length > 0) {
          setSelectedSectionKey(remainingSections[0].sectionKey);
        }
      }
      toast.success('Section deleted successfully');
    }
  };

  const addField = (sectionKey, newField) => {
    setConfig(prev => {
      const updated = { ...prev };
      const section = updated.sections.find(s => s.sectionKey === sectionKey);
      if (section) {
        section.fields.push({
          ...newField,
          isCustom: true,
          order: section.fields.length + 1
        });
      }
      return updated;
    });
    setShowAddFieldModal(null);
    toast.success('Field added successfully');
  };

  const deleteField = (sectionKey, fieldKey) => {
    const section = config.sections.find(s => s.sectionKey === sectionKey);
    const field = section?.fields.find(f => f.fieldKey === fieldKey);

    if (!field?.isCustom) {
      toast.error('Cannot delete built-in fields');
      return;
    }

    if (window.confirm('Are you sure you want to delete this field?')) {
      setConfig(prev => {
        const updated = { ...prev };
        const section = updated.sections.find(s => s.sectionKey === sectionKey);
        if (section) {
          section.fields = section.fields.filter(f => f.fieldKey !== fieldKey);
        }
        return updated;
      });
      toast.success('Field deleted successfully');
    }
  };

  const renderFieldEditor = (section, field) => {
    const isEditing = editingField === `${section.sectionKey}.${field.fieldKey}`;

    return (
      <div key={field.fieldKey} className="border-2 border-gray-200 rounded-xl p-6 bg-white hover:border-millipore-blue transition-all shadow-sm hover:shadow-md">
        {/* Header with Label and Actions */}
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Field Label</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateFieldProperty(section.sectionKey, field.fieldKey, 'label', e.target.value)}
                    className="form-input text-base font-medium w-full"
                    placeholder="Enter field label..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Help Text</label>
                  <textarea
                    value={field.helpText || ''}
                    onChange={(e) => updateFieldProperty(section.sectionKey, field.fieldKey, 'helpText', e.target.value)}
                    className="form-input text-sm w-full"
                    rows={2}
                    placeholder="Enter help text..."
                  />
                </div>
              </div>
            ) : (
              <div>
                <h4 className="text-base font-semibold text-gray-900 flex items-center">
                  {field.label}
                  {field.isCustom && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                      Custom
                    </span>
                  )}
                </h4>
                {field.helpText && (
                  <p className="text-sm text-gray-600 mt-2">{field.helpText}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => {
                const newValue = isEditing ? null : `${section.sectionKey}.${field.fieldKey}`;
                if (!isEditing && !requireDefaultFormConfirmation(() => setEditingField(newValue))) {
                  return;
                }
                setEditingField(newValue);
              }}
              className="p-2 text-gray-400 hover:text-millipore-blue hover:bg-blue-50 rounded-lg transition-colors"
              title={isEditing ? 'Done editing' : 'Edit label & help text'}
            >
              {isEditing ? <CheckIcon className="h-5 w-5" /> : <PencilIcon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => updateFieldProperty(section.sectionKey, field.fieldKey, 'visible', !field.visible)}
              className={`p-2 rounded-lg transition-colors ${
                field.visible
                  ? 'text-green-600 hover:bg-green-50'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
              title={field.visible ? 'Visible' : 'Hidden'}
            >
              {field.visible ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
            </button>
            {field.isCustom && (
              <button
                onClick={() => deleteField(section.sectionKey, field.fieldKey)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete field"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Field Configuration */}
        <div className="space-y-4">
          {/* Field Type and Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
              <select
                value={field.type}
                onChange={(e) => updateFieldProperty(section.sectionKey, field.fieldKey, 'type', e.target.value)}
                className="form-select w-full"
              >
                <option value="text">Text Input</option>
                <option value="textarea">Text Area (Multi-line)</option>
                <option value="number">Number Input</option>
                <option value="select">Dropdown Select</option>
                <option value="radio">Radio Buttons</option>
                <option value="checkbox">Checkbox</option>
                <option value="date">Date Picker</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grid Width</label>
              <select
                value={field.gridColumn || 'full'}
                onChange={(e) => updateFieldProperty(section.sectionKey, field.fieldKey, 'gridColumn', e.target.value)}
                className="form-select w-full"
              >
                <option value="full">Full Width (100%)</option>
                <option value="half">Half Width (50%)</option>
                <option value="third">Third Width (33%)</option>
                <option value="quarter">Quarter Width (25%)</option>
              </select>
            </div>
          </div>

          {/* Field Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder Text</label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => updateFieldProperty(section.sectionKey, field.fieldKey, 'placeholder', e.target.value)}
                className="form-input w-full"
                placeholder="e.g., Enter product name..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Value</label>
              {(field.type === 'select' || field.type === 'radio') && field.options?.length > 0 ? (
                <select
                  value={field.defaultValue || ''}
                  onChange={(e) => updateFieldProperty(section.sectionKey, field.fieldKey, 'defaultValue', e.target.value)}
                  className="form-select w-full"
                >
                  <option value="">No default (user must select)</option>
                  {field.options.map((option, idx) => (
                    <option key={idx} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <select
                  value={field.defaultValue === true ? 'true' : field.defaultValue === false ? 'false' : ''}
                  onChange={(e) => {
                    const val = e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined;
                    updateFieldProperty(section.sectionKey, field.fieldKey, 'defaultValue', val);
                  }}
                  className="form-select w-full"
                >
                  <option value="">No default</option>
                  <option value="true">Checked</option>
                  <option value="false">Unchecked</option>
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  value={field.defaultValue || ''}
                  onChange={(e) => updateFieldProperty(section.sectionKey, field.fieldKey, 'defaultValue', e.target.value)}
                  className="form-input w-full"
                  placeholder="e.g., Default value..."
                />
              )}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap items-center gap-6 bg-gray-50 rounded-lg p-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateFieldProperty(section.sectionKey, field.fieldKey, 'required', e.target.checked)}
                className="form-checkbox rounded h-5 w-5"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">Required Field</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={field.editable}
                onChange={(e) => updateFieldProperty(section.sectionKey, field.fieldKey, 'editable', e.target.checked)}
                className="form-checkbox rounded h-5 w-5"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">Editable in Tickets</span>
            </label>
          </div>

          {/* Field Visibility Dependencies */}
          <div className="pt-4 border-t border-gray-200">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field Visibility Dependencies
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Make this field visible only when another field has a specific value (e.g., show vendor info only when "Procured" is selected)
              </p>
            </div>

            {/* Dependency Configuration */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Depends On Field
                  </label>
                  <select
                    value={field.visibleWhen?.fieldKey || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (!newValue) {
                        updateFieldProperty(section.sectionKey, field.fieldKey, 'visibleWhen', undefined);
                      } else {
                        updateFieldProperty(section.sectionKey, field.fieldKey, 'visibleWhen', {
                          ...field.visibleWhen,
                          fieldKey: newValue,
                          value: ''
                        });
                      }
                    }}
                    className="form-select text-sm"
                  >
                    <option value="">No dependency (always visible)</option>
                    {config.sections.flatMap(s =>
                      s.fields
                        .filter(f => f.fieldKey !== field.fieldKey)
                        .map(f => (
                          <option key={f.fieldKey} value={f.fieldKey}>
                            {f.label} ({s.name})
                          </option>
                        ))
                    )}
                  </select>
                </div>

                {field.visibleWhen?.fieldKey && (() => {
                  // Find the dependent field to get its options
                  const dependentField = config.sections
                    .flatMap(s => s.fields)
                    .find(f => f.fieldKey === field.visibleWhen.fieldKey);

                  return (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Has Value
                      </label>
                      {(dependentField?.type === 'select' || dependentField?.type === 'radio') && dependentField?.options?.length > 0 ? (
                        <select
                          value={field.visibleWhen?.value || ''}
                          onChange={(e) => {
                            updateFieldProperty(section.sectionKey, field.fieldKey, 'visibleWhen', {
                              ...field.visibleWhen,
                              value: e.target.value
                            });
                          }}
                          className="form-select text-sm"
                        >
                          <option value="">Select value...</option>
                          {dependentField?.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : dependentField?.type === 'checkbox' ? (
                        <select
                          value={field.visibleWhen?.value || ''}
                          onChange={(e) => {
                            updateFieldProperty(section.sectionKey, field.fieldKey, 'visibleWhen', {
                              ...field.visibleWhen,
                              value: e.target.value
                            });
                          }}
                          className="form-select text-sm"
                        >
                          <option value="">Select value...</option>
                          <option value="true">Checked</option>
                          <option value="false">Unchecked</option>
                        </select>
                      ) : (
                        <input
                          type={dependentField?.type === 'number' ? 'number' : dependentField?.type === 'date' ? 'date' : 'text'}
                          value={field.visibleWhen?.value || ''}
                          onChange={(e) => {
                            updateFieldProperty(section.sectionKey, field.fieldKey, 'visibleWhen', {
                              ...field.visibleWhen,
                              value: e.target.value
                            });
                          }}
                          className="form-input text-sm"
                          placeholder={`Enter ${dependentField?.label || 'value'}...`}
                        />
                      )}
                    </div>
                  );
                })()}

                {field.visibleWhen?.fieldKey && (
                  <div className="flex items-end">
                    <button
                      onClick={() => updateFieldProperty(section.sectionKey, field.fieldKey, 'visibleWhen', undefined)}
                      className="btn btn-sm bg-red-100 hover:bg-red-200 text-red-700 w-full"
                    >
                      Clear Dependency
                    </button>
                  </div>
                )}
              </div>

              {field.visibleWhen?.fieldKey && field.visibleWhen?.value && (
                <div className="mt-3 p-2 bg-white rounded border border-blue-300">
                  <p className="text-xs text-gray-700">
                    <strong>Preview:</strong> This field will only be visible when <strong>{config.sections.flatMap(s => s.fields).find(f => f.fieldKey === field.visibleWhen.fieldKey)?.label}</strong> is set to <strong>{config.sections.flatMap(s => s.fields).find(f => f.fieldKey === field.visibleWhen.fieldKey)?.options?.find(o => o.value === field.visibleWhen.value)?.label}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dropdown/Radio Options Editor */}
          {(field.type === 'select' || field.type === 'radio') && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  if (!requireDefaultFormConfirmation(() => setEditingOptions({ sectionKey: section.sectionKey, fieldKey: field.fieldKey }))) {
                    return;
                  }
                  setEditingOptions({ sectionKey: section.sectionKey, fieldKey: field.fieldKey });
                }}
                className="btn btn-secondary w-full flex items-center justify-center space-x-2"
              >
                <Bars3Icon className="h-5 w-5" />
                <span>Edit {field.type === 'radio' ? 'Radio Button' : 'Dropdown'} Options ({field.options?.length || 0} options)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSectionEditor = (section, index) => {
    const isEditing = editingSection === section.sectionKey;

    return (
      <div key={section.sectionKey} className="bg-white shadow-lg rounded-xl mb-6 border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1">
              <Bars3Icon className="h-6 w-6 text-gray-400 cursor-move" />
              {isEditing ? (
                <input
                  type="text"
                  value={section.name}
                  onChange={(e) => updateSectionProperty(section.sectionKey, 'name', e.target.value)}
                  className="form-input text-xl font-semibold"
                  placeholder="Section Name"
                />
              ) : (
                <h3 className="text-xl font-semibold text-gray-900">{section.name}</h3>
              )}
              {section.isCustom && (
                <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                  Custom Section
                </span>
              )}
              <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  const newValue = isEditing ? null : section.sectionKey;
                  if (!isEditing && !requireDefaultFormConfirmation(() => setEditingSection(newValue))) {
                    return;
                  }
                  setEditingSection(newValue);
                }}
                className="p-2 text-gray-400 hover:text-millipore-blue hover:bg-blue-50 rounded-lg transition-colors"
                title={isEditing ? 'Done editing' : 'Edit section name'}
              >
                {isEditing ? <CheckIcon className="h-5 w-5" /> : <PencilIcon className="h-5 w-5" />}
              </button>
              <button
                onClick={() => updateSectionProperty(section.sectionKey, 'visible', !section.visible)}
                className={`p-2 rounded-lg transition-colors ${
                  section.visible
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={section.visible ? 'Visible' : 'Hidden'}
              >
                {section.visible ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
              </button>
              <button
                onClick={() => moveSectionUp(index)}
                disabled={index === 0}
                className="p-2 text-gray-400 hover:text-millipore-blue hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Move up"
              >
                <ArrowUpIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => moveSectionDown(index)}
                disabled={index === config.sections.length - 1}
                className="p-2 text-gray-400 hover:text-millipore-blue hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Move down"
              >
                <ArrowDownIcon className="h-5 w-5" />
              </button>
              {section.isCustom && (
                <button
                  onClick={() => deleteSection(section.sectionKey)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete section"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-2">Section Description</label>
              <textarea
                value={section.description || ''}
                onChange={(e) => updateSectionProperty(section.sectionKey, 'description', e.target.value)}
                className="form-input text-sm w-full"
                rows={2}
                placeholder="Enter section description..."
              />
            </div>
          )}

          {!isEditing && section.description && (
            <p className="text-sm text-gray-600 mt-2">{section.description}</p>
          )}
        </div>

        <div className="p-6">
          <div className="space-y-4 mb-6">
            {section.fields.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                <p className="text-sm">No fields in this section</p>
                <p className="text-xs mt-1">Click below to add a custom field</p>
              </div>
            ) : (
              section.fields.map(field => renderFieldEditor(section, field))
            )}
          </div>

          <button
            onClick={() => setShowAddFieldModal(section.sectionKey)}
            className="btn btn-secondary w-full flex items-center justify-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Custom Field</span>
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading form configuration...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No form configuration found</p>
        <button className="btn btn-primary">Create Default Configuration</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Form Configuration Editor</h2>
          <p className="text-gray-600 mt-1">
            Customize the product ticket submission form. Edit labels, add custom fields, and reorder sections.
          </p>
          <div className="mt-2 flex items-center space-x-4 text-sm">
            <span className="text-gray-500">
              <strong>Version:</strong> {config.version}
            </span>
            <span className="text-gray-500">
              <strong>Sections:</strong> {config.sections.length}
            </span>
            <span className="text-gray-500">
              <strong>Total Fields:</strong> {config.metadata?.totalFields || 0}
            </span>
            <span className="text-gray-500">
              <strong>Custom Fields:</strong> {config.metadata?.customFieldsCount || 0}
            </span>
            {config.isDraft && (
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center animate-pulse">
                <PencilIcon className="h-4 w-4 mr-1" />
                DRAFT - Unpublished Changes
              </span>
            )}
            {isDefaultForm() && (
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                Default Form
              </span>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowVersionManagementModal(true)}
            className="btn btn-secondary flex items-center space-x-2 text-gray-700 hover:bg-gray-100"
            title="Manage versions and rollback options"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Version Management</span>
          </button>
          <button
            onClick={() => setShowAddSectionModal(true)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Section</span>
          </button>
          <button
            onClick={saveConfig}
            disabled={saving || publishing}
            className="btn bg-gray-600 hover:bg-gray-700 text-white"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => setShowPublishModal(true)}
            disabled={saving || publishing}
            className="btn btn-primary"
          >
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Navigation:</strong> Select a section from the tabs above to edit. Changes appear in the live preview below.
          Click on labels to edit them, use the eye icon to show/hide fields. Custom fields and sections can be deleted.
        </p>
      </div>

      {/* Default Form Warning Banner */}
      {isDefaultForm() && !defaultFormConfirmed && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900 mb-1">Modifying Default Form Configuration</h3>
              <p className="text-sm text-amber-800">
                You are editing the default form configuration used by all users. Changes to this form will affect the entire system.
                Please proceed with caution and ensure you understand the implications of your modifications.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Section Navigator */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-millipore-blue to-blue-600 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bars3Icon className="h-5 w-5" />
            <h3 className="text-sm font-semibold">Form Sections</h3>
            <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
              {config.sections.length} total
            </span>
          </div>
        </div>

        {/* Horizontal Scrollable Tab Navigation */}
        <div className="overflow-x-auto bg-gray-50 border-b border-gray-200">
          <div className="flex items-stretch min-w-full">
            {config.sections.map((section, index) => (
              <button
                key={section.sectionKey}
                onClick={() => setSelectedSectionKey(section.sectionKey)}
                className={`flex-shrink-0 px-6 py-4 border-r border-gray-200 hover:bg-blue-50 transition-colors relative ${
                  selectedSectionKey === section.sectionKey
                    ? 'bg-white border-b-4 border-b-millipore-blue'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-start min-w-[160px]">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-sm font-medium ${
                      selectedSectionKey === section.sectionKey ? 'text-millipore-blue' : 'text-gray-900'
                    }`}>
                      {section.name}
                    </span>
                    {section.isCustom && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 w-full">
                    <span className="text-xs text-gray-500">
                      {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center space-x-1">
                      {section.visible ? (
                        <EyeIcon className="h-3.5 w-3.5 text-green-600" title="Visible" />
                      ) : (
                        <EyeSlashIcon className="h-3.5 w-3.5 text-gray-400" title="Hidden" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSectionUp(index);
                        }}
                        disabled={index === 0}
                        className="p-0.5 text-gray-400 hover:text-millipore-blue disabled:opacity-30"
                        title="Move left"
                      >
                        <ArrowUpIcon className="h-3 w-3 transform -rotate-90" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSectionDown(index);
                        }}
                        disabled={index === config.sections.length - 1}
                        className="p-0.5 text-gray-400 hover:text-millipore-blue disabled:opacity-30"
                        title="Move right"
                      >
                        <ArrowDownIcon className="h-3 w-3 transform -rotate-90" />
                      </button>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Editor and Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Section Editor */}
        <div>
          <div className="sticky top-0 bg-gradient-to-r from-millipore-blue to-blue-600 text-white px-4 py-3 rounded-lg z-10 shadow-md mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <PencilIcon className="h-5 w-5 mr-2" />
              Configuration Editor
            </h3>
            <p className="text-xs text-blue-100 mt-1">Edit form fields and properties</p>
          </div>
          {config.sections
            .filter(section => section.sectionKey === selectedSectionKey)
            .map((section, index) => {
              const actualIndex = config.sections.findIndex(s => s.sectionKey === selectedSectionKey);
              return renderSectionEditor(section, actualIndex);
            })}
        </div>

        {/* Right Column - Live Preview */}
        <div>
          <div className="sticky top-0">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold flex items-center">
                    <EyeIcon className="h-5 w-5 mr-2" />
                    Live Preview
                  </h3>
                  <p className="text-xs text-green-100 mt-1">Current section</p>
                </div>
                <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                  READ ONLY
                </span>
              </div>
            </div>

            {/* Preview Container with distinct styling */}
            <div className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 shadow-inner max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                {(() => {
                  const selectedSection = config.sections.find(s => s.sectionKey === selectedSectionKey);
                  if (!selectedSection) {
                    return (
                      <div className="text-center py-12 text-gray-400">
                        <EyeSlashIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No section selected</p>
                      </div>
                    );
                  }
                  if (!selectedSection.visible) {
                    return (
                      <div className="text-center py-12 text-gray-400">
                        <EyeSlashIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Section is hidden</p>
                        <p className="text-xs mt-1">Enable visibility to preview</p>
                      </div>
                    );
                  }
                  return (
                    <div className="relative">
                      {/* Preview Badge */}
                      <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">
                        Preview
                      </div>
                      <DynamicFormSection
                        section={selectedSection}
                        register={() => {}} // Mock register for preview
                        errors={{}}
                        watch={(fieldKey) => {
                          // Mock watch for preview - return current default values for dependency checking
                          const field = config.sections
                            .flatMap(s => s.fields)
                            .find(f => f.fieldKey === fieldKey);
                          return field?.defaultValue || '';
                        }}
                        readOnly={true}
                        previewMode={true}  // Show all fields in preview, ignore visibility conditions
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Default Form Warning Modal */}
      {showDefaultFormWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            {defaultFormWarningStep === 1 ? (
              // First Warning
              <div>
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 rounded-t-xl">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-8 w-8 text-white mr-3" />
                    <h3 className="text-xl font-bold text-white">Critical System Configuration Warning</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                    <p className="text-base text-amber-900 font-semibold mb-2">
                      You are about to modify the default form configuration that is actively used across the entire system.
                    </p>
                    <p className="text-sm text-amber-800">
                      This form serves as the foundation for all user interactions with the product ticket submission system.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                      Potential Impact of Changes:
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700 ml-7">
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <span><strong>All active users</strong> will immediately see modifications to form fields, labels, and structure</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <span><strong>Data integrity issues</strong> may arise if required fields are removed or field types are changed</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <span><strong>Workflow disruptions</strong> for users currently completing or reviewing tickets</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <span><strong>Historical data compatibility</strong> concerns with existing submitted tickets</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <span><strong>Integration dependencies</strong> that rely on specific field configurations may fail</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Before Proceeding:</h4>
                    <ul className="space-y-1 text-sm text-blue-800 ml-4">
                      <li>✓ Ensure you have documented the current configuration</li>
                      <li>✓ Verify that stakeholders have approved these changes</li>
                      <li>✓ Confirm that you understand the downstream effects</li>
                      <li>✓ Consider testing changes in a development environment first</li>
                    </ul>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={cancelPendingAction}
                      className="btn bg-gray-500 hover:bg-gray-600 text-white px-6"
                    >
                      Cancel - Return to Safety
                    </button>
                    <button
                      onClick={() => setDefaultFormWarningStep(2)}
                      className="btn bg-amber-500 hover:bg-amber-600 text-white px-6"
                    >
                      I Understand - Continue
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Second Warning - Final Confirmation
              <div>
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-xl">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-8 w-8 text-white mr-3 animate-pulse" />
                    <h3 className="text-xl font-bold text-white">Final Confirmation Required</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                    <p className="text-base text-red-900 font-bold mb-3">
                      This is your final opportunity to reconsider.
                    </p>
                    <p className="text-sm text-red-800 mb-2">
                      By proceeding, you acknowledge that:
                    </p>
                    <ul className="space-y-2 text-sm text-red-900 ml-4">
                      <li className="flex items-start">
                        <span className="mr-2">□</span>
                        <span>You have the necessary authority to modify system-wide configurations</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">□</span>
                        <span>You accept full responsibility for any unintended consequences</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">□</span>
                        <span>You understand that these changes will affect all users immediately upon saving</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">□</span>
                        <span>You have considered the impact on existing workflows and data structures</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                    <p className="text-sm text-gray-700 italic">
                      <strong>Reminder:</strong> If you are uncertain about any aspect of these modifications, please consult with
                      your system administrator or cancel this operation and seek guidance from appropriate stakeholders.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={cancelPendingAction}
                      className="btn bg-gray-500 hover:bg-gray-600 text-white px-6"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executePendingAction}
                      className="btn bg-red-600 hover:bg-red-700 text-white px-6 font-semibold"
                    >
                      Proceed with Modification
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <AddSectionModal
          onClose={() => setShowAddSectionModal(false)}
          onAdd={addSection}
        />
      )}

      {/* Add Field Modal */}
      {showAddFieldModal && (
        <AddFieldModal
          sectionKey={showAddFieldModal}
          onClose={() => setShowAddFieldModal(null)}
          onAdd={addField}
          config={config}
        />
      )}

      {/* Options Editor Modal */}
      {editingOptions && (
        <OptionsEditorModal
          sectionKey={editingOptions.sectionKey}
          fieldKey={editingOptions.fieldKey}
          options={config.sections.find(s => s.sectionKey === editingOptions.sectionKey)?.fields.find(f => f.fieldKey === editingOptions.fieldKey)?.options || []}
          onClose={() => setEditingOptions(null)}
          onSave={(options) => {
            updateFieldOptions(editingOptions.sectionKey, editingOptions.fieldKey, options);
            setEditingOptions(null);
            toast.success('Options updated successfully');
          }}
        />
      )}

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Publish Form Configuration</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to save and publish this form configuration?
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Publishing will:</strong>
                </p>
                <ul className="mt-2 text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Save all current changes to the database</li>
                  <li>Increment the version number (e.g., {config.version} → {(() => {
                    const parts = config.version.split('.').map(Number);
                    parts[1]++;
                    return parts.join('.');
                  })()})</li>
                  <li>Make changes visible to all assigned users immediately</li>
                  <li>Mark the configuration as published (not draft)</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                All unsaved changes will be automatically saved before publishing. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPublishModal(false)}
                className="btn btn-secondary"
                disabled={publishing}
              >
                Cancel
              </button>
              <button
                onClick={publishConfig}
                className="btn btn-primary"
                disabled={publishing}
              >
                {publishing ? 'Publishing...' : 'Confirm Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version Management Modal */}
      {showVersionManagementModal && !versionAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-xl">
              <div className="flex items-center">
                <ArrowPathIcon className="h-7 w-7 text-white mr-3" />
                <h3 className="text-xl font-bold text-white">Version Management</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Current Version:</strong> {config.version} {config.isDraft && <span className="text-orange-600">(Draft)</span>}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Published Version:</strong> {config.publishedVersion || config.version}
                </p>
                {config.lastPublishedAt && (
                  <p className="text-xs text-gray-600 mt-1">
                    Last published: {new Date(config.lastPublishedAt).toLocaleString()}
                  </p>
                )}
              </div>

              <p className="text-sm text-gray-600">
                Choose a version management action below. Each option has different implications for your current configuration.
              </p>

              <div className="space-y-3">
                {/* Restore Default Option */}
                <button
                  onClick={() => setVersionAction('restore')}
                  className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-start">
                    <ArrowPathIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Restore Default Configuration</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Reload the configuration from the database, discarding any unsaved changes in your current session.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Discard Draft Option */}
                <button
                  onClick={() => setVersionAction('discard')}
                  disabled={!config.isDraft}
                  className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                    config.isDraft
                      ? 'border-orange-200 hover:border-orange-400 hover:bg-orange-50'
                      : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start">
                    <XMarkIcon className="h-6 w-6 text-orange-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Discard Draft Changes</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Revert to the last published version, discarding all draft changes since publishing.
                        {!config.isDraft && <span className="text-orange-700 font-medium"> (No draft to discard)</span>}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Rollback Option */}
                <button
                  onClick={() => setVersionAction('rollback')}
                  disabled={!config.lastPublishedSections || config.lastPublishedSections.length === 0}
                  className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                    config.lastPublishedSections && config.lastPublishedSections.length > 0
                      ? 'border-red-200 hover:border-red-400 hover:bg-red-50'
                      : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Roll Back to Previous Version</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Restore the previous published version, undoing the last publish action and decrementing the version number.
                        {(!config.lastPublishedSections || config.lastPublishedSections.length === 0) && (
                          <span className="text-red-700 font-medium"> (No previous version available)</span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                <button
                  onClick={() => setShowVersionManagementModal(false)}
                  className="btn bg-gray-500 hover:bg-gray-600 text-white px-6"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Default Confirmation */}
      {versionAction === 'restore' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">Confirm Restore Default</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-900">
                  This action will reload the configuration from the database, discarding any unsaved changes you've made in this editing session.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">What will happen:</h4>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• All unsaved changes in your current session will be lost</li>
                  <li>• The configuration will be reloaded from the database</li>
                  <li>• Your edits will not be persisted</li>
                </ul>
              </div>
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                <p className="text-xs text-gray-700">
                  <strong>Note:</strong> This does not affect saved drafts or published versions. It only discards changes made since you last saved or loaded the configuration.
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setVersionAction(null)}
                  className="btn bg-gray-500 hover:bg-gray-600 text-white px-6"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestoreDefault}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  Confirm Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discard Draft Confirmation */}
      {versionAction === 'discard' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">Confirm Discard Draft</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                <p className="text-sm text-orange-900 font-semibold">
                  This action will permanently discard all draft changes and revert to the last published version.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">What will happen:</h4>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• All changes made since the last publish will be permanently lost</li>
                  <li>• The configuration will revert to version {config.publishedVersion || config.version}</li>
                  <li>• The draft flag will be removed</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                <p className="text-xs text-gray-700">
                  <strong>Important:</strong> Make sure you don't have any important unsaved work. Consider saving as a draft first if you're unsure.
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setVersionAction(null)}
                  className="btn bg-gray-500 hover:bg-gray-600 text-white px-6"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDiscardDraft}
                  className="btn bg-orange-600 hover:bg-orange-700 text-white px-6"
                >
                  Confirm Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Confirmation */}
      {versionAction === 'rollback' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-7 w-7 text-white mr-3" />
                <h3 className="text-xl font-bold text-white">Confirm Rollback to Previous Version</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-sm text-red-900 font-bold mb-2">
                  WARNING: This is a destructive action that cannot be undone!
                </p>
                <p className="text-sm text-red-800">
                  This will restore the previous published version and permanently discard the current published configuration.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">What will happen:</h4>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• Current version ({config.version}) will be replaced with the previous version</li>
                  <li>• Version number will be decremented (e.g., {config.version} → {(() => {
                    const parts = config.version.split('.').map(Number);
                    parts[1]--;
                    if (parts[1] < 0) parts[1] = 0;
                    return parts.join('.');
                  })()})</li>
                  <li>• All users will immediately see the previous form configuration</li>
                  <li>• This action is immediate and irreversible</li>
                  <li>• The rollback history will be cleared</li>
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
                <p className="text-xs text-amber-900">
                  <strong>Recommendation:</strong> Only use this if the current published version has critical issues. Consider creating a new draft with corrections instead if possible.
                </p>
              </div>
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                <p className="text-xs text-gray-700">
                  <strong>Impact Assessment:</strong> This will affect all users immediately. Ensure stakeholders are aware and that a rollback is the appropriate solution.
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setVersionAction(null)}
                  className="btn bg-gray-500 hover:bg-gray-600 text-white px-6"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRollback}
                  className="btn bg-red-600 hover:bg-red-700 text-white px-6 font-semibold"
                >
                  Confirm Rollback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal for adding new section
const AddSectionModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    sectionKey: '',
    name: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.sectionKey || !formData.name) {
      toast.error('Section key and name are required');
      return;
    }
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Add New Section</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Key *
            </label>
            <input
              type="text"
              value={formData.sectionKey}
              onChange={(e) => setFormData({ ...formData, sectionKey: e.target.value })}
              className="form-input"
              placeholder="e.g., customSection1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              placeholder="e.g., Additional Information"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input"
              rows={3}
              placeholder="Brief description of this section..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal for adding new field
const AddFieldModal = ({ sectionKey, onClose, onAdd, config }) => {
  const [formData, setFormData] = useState({
    fieldKey: '',
    label: '',
    type: 'text',
    required: false,
    visible: true,
    editable: true,
    placeholder: '',
    helpText: '',
    defaultValue: '',
    gridColumn: 'full',
    options: [],
    visibleWhen: undefined
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fieldKey || !formData.label) {
      toast.error('Field key and label are required');
      return;
    }
    onAdd(sectionKey, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Add New Field</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field Key *
              </label>
              <input
                type="text"
                value={formData.fieldKey}
                onChange={(e) => setFormData({ ...formData, fieldKey: e.target.value })}
                className="form-input"
                placeholder="e.g., customField1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="form-input"
                placeholder="e.g., Custom Property"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="form-select"
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="number">Number</option>
                <option value="select">Select</option>
                <option value="radio">Radio Buttons</option>
                <option value="checkbox">Checkbox</option>
                <option value="date">Date</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grid Size
              </label>
              <select
                value={formData.gridColumn}
                onChange={(e) => setFormData({ ...formData, gridColumn: e.target.value })}
                className="form-select"
              >
                <option value="full">Full Width</option>
                <option value="half">Half Width</option>
                <option value="third">Third Width</option>
                <option value="quarter">Quarter Width</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Help Text
            </label>
            <textarea
              value={formData.helpText}
              onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
              className="form-input"
              rows={2}
              placeholder="Help text shown below the field..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placeholder
              </label>
              <input
                type="text"
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                className="form-input"
                placeholder="Placeholder text..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Value
              </label>
              {(formData.type === 'select' || formData.type === 'radio') && formData.options.length > 0 ? (
                <select
                  value={formData.defaultValue || ''}
                  onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                  className="form-select"
                >
                  <option value="">No default</option>
                  {formData.options.map((option, idx) => (
                    <option key={idx} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : formData.type === 'checkbox' ? (
                <select
                  value={formData.defaultValue === true ? 'true' : formData.defaultValue === false ? 'false' : ''}
                  onChange={(e) => {
                    const val = e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined;
                    setFormData({ ...formData, defaultValue: val });
                  }}
                  className="form-select"
                >
                  <option value="">No default</option>
                  <option value="true">Checked</option>
                  <option value="false">Unchecked</option>
                </select>
              ) : (
                <input
                  type={formData.type === 'number' ? 'number' : formData.type === 'date' ? 'date' : 'text'}
                  value={formData.defaultValue || ''}
                  onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                  className="form-input"
                  placeholder="Default value..."
                />
              )}
            </div>
          </div>

          {(formData.type === 'select' || formData.type === 'radio') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'radio' ? 'Radio Button Options' : 'Dropdown Options'}
              </label>
              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 space-y-2 max-h-60 overflow-y-auto">
                {formData.options.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No options added yet</p>
                ) : (
                  formData.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded border border-gray-200">
                      <input
                        type="text"
                        value={option.value}
                        onChange={(e) => {
                          const updated = [...formData.options];
                          updated[index].value = e.target.value;
                          setFormData({ ...formData, options: updated });
                        }}
                        className="form-input text-xs flex-1"
                        placeholder="Value"
                      />
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => {
                          const updated = [...formData.options];
                          updated[index].label = e.target.value;
                          setFormData({ ...formData, options: updated });
                        }}
                        className="form-input text-xs flex-1"
                        placeholder="Label"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.options.filter((_, i) => i !== index);
                          setFormData({ ...formData, options: updated });
                        }}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      options: [...formData.options, { value: '', label: '' }]
                    });
                  }}
                  className="btn btn-sm btn-secondary w-full flex items-center justify-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Option</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                className="form-checkbox rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Required</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                className="form-checkbox rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Visible</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.editable}
                onChange={(e) => setFormData({ ...formData, editable: e.target.checked })}
                className="form-checkbox rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Editable</span>
            </label>
          </div>

          {/* Field Visibility Dependencies */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conditional Visibility
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Make this field visible only when another field has a specific value
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Depends On Field
                </label>
                <select
                  value={formData.visibleWhen?.fieldKey || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (!newValue) {
                      setFormData({ ...formData, visibleWhen: undefined });
                    } else {
                      setFormData({
                        ...formData,
                        visibleWhen: { fieldKey: newValue, value: '' }
                      });
                    }
                  }}
                  className="form-select text-sm"
                >
                  <option value="">No dependency (always visible)</option>
                  {config?.sections.flatMap(s =>
                    s.fields.map(f => (
                      <option key={f.fieldKey} value={f.fieldKey}>
                        {f.label} ({s.name})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {formData.visibleWhen?.fieldKey && (() => {
                const dependentField = config?.sections
                  .flatMap(s => s.fields)
                  .find(f => f.fieldKey === formData.visibleWhen.fieldKey);

                return (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Has Value
                    </label>
                    {(dependentField?.type === 'select' || dependentField?.type === 'radio') && dependentField?.options?.length > 0 ? (
                      <select
                        value={formData.visibleWhen?.value || ''}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            visibleWhen: {
                              ...formData.visibleWhen,
                              value: e.target.value
                            }
                          });
                        }}
                        className="form-select text-sm"
                      >
                        <option value="">Select value...</option>
                        {dependentField?.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : dependentField?.type === 'checkbox' ? (
                      <select
                        value={formData.visibleWhen?.value || ''}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            visibleWhen: {
                              ...formData.visibleWhen,
                              value: e.target.value
                            }
                          });
                        }}
                        className="form-select text-sm"
                      >
                        <option value="">Select value...</option>
                        <option value="true">Checked</option>
                        <option value="false">Unchecked</option>
                      </select>
                    ) : (
                      <input
                        type={dependentField?.type === 'number' ? 'number' : dependentField?.type === 'date' ? 'date' : 'text'}
                        value={formData.visibleWhen?.value || ''}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            visibleWhen: {
                              ...formData.visibleWhen,
                              value: e.target.value
                            }
                          });
                        }}
                        className="form-input text-sm"
                        placeholder={`Enter ${dependentField?.label || 'value'}...`}
                      />
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Field
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal for editing dropdown options
const OptionsEditorModal = ({ sectionKey, fieldKey, options, onClose, onSave }) => {
  const [optionsList, setOptionsList] = useState(options || []);
  const [editingIndex, setEditingIndex] = useState(null);

  const addOption = () => {
    setOptionsList([...optionsList, { value: '', label: '' }]);
    setEditingIndex(optionsList.length);
  };

  const updateOption = (index, field, value) => {
    const updated = [...optionsList];
    updated[index][field] = value;
    setOptionsList(updated);
  };

  const deleteOption = (index) => {
    if (window.confirm('Are you sure you want to delete this option?')) {
      const updated = optionsList.filter((_, i) => i !== index);
      setOptionsList(updated);
      toast.success('Option deleted');
    }
  };

  const handleSave = () => {
    // Validate all options have both value and label
    const invalid = optionsList.some(opt => !opt.value || !opt.label);
    if (invalid) {
      toast.error('All options must have both a value and a label');
      return;
    }

    // Check for duplicate values
    const values = optionsList.map(opt => opt.value);
    const hasDuplicates = values.length !== new Set(values).size;
    if (hasDuplicates) {
      toast.error('Option values must be unique');
      return;
    }

    onSave(optionsList);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <h3 className="text-lg font-bold mb-4">Edit Dropdown Options</h3>

        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {optionsList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No options yet. Click "Add Option" to create one.</p>
            </div>
          ) : (
            optionsList.map((option, index) => (
              <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Value *
                      </label>
                      <input
                        type="text"
                        value={option.value}
                        onChange={(e) => updateOption(index, 'value', e.target.value)}
                        className="form-input text-sm"
                        placeholder="e.g., option1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Label *
                      </label>
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => updateOption(index, 'label', e.target.value)}
                        className="form-input text-sm"
                        placeholder="e.g., Option 1"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => deleteOption(index)}
                    className="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete option"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4 flex justify-between items-center">
          <button
            onClick={addOption}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Option</span>
          </button>

          <div className="flex space-x-3">
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              Save Options
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormConfigurationEditor;
