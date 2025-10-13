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
  Bars3Icon
} from '@heroicons/react/24/outline';
import { formConfigAPI } from '../../services/api';
import toast from 'react-hot-toast';
import DynamicFormSection from '../forms/DynamicFormSection';

const FormConfigurationEditor = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(null);
  const [editingOptions, setEditingOptions] = useState(null); // { sectionKey, fieldKey }

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await formConfigAPI.getActive();
      setConfig(response.data.data);
    } catch (error) {
      console.error('Error loading form configuration:', error);
      toast.error('Failed to load form configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      await formConfigAPI.update(config._id, config);
      toast.success('Form configuration saved successfully');
    } catch (error) {
      console.error('Error saving form configuration:', error);
      toast.error('Failed to save form configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateFieldProperty = (sectionKey, fieldKey, property, value) => {
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
              onClick={() => setEditingField(isEditing ? null : `${section.sectionKey}.${field.fieldKey}`)}
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

          {/* Dropdown/Radio Options Editor */}
          {(field.type === 'select' || field.type === 'radio') && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => setEditingOptions({ sectionKey: section.sectionKey, fieldKey: field.fieldKey })}
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
                onClick={() => setEditingSection(isEditing ? null : section.sectionKey)}
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
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddSectionModal(true)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Section</span>
          </button>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 relative">
        <p className="text-sm text-blue-800">
          <strong>Split View:</strong> Edit form configuration on the left, see live preview on the right.
          Click on any label or text to edit it. Use the eye icon to show/hide fields. Custom fields and sections can be deleted.
        </p>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to restore the default form configuration? This will discard all custom changes.')) {
              loadConfig();
              toast.success('Form configuration restored to default');
            }
          }}
          className="absolute top-2 right-2 text-xs text-gray-500 hover:text-blue-700 underline"
          title="Restore default form configuration"
        >
          Restore Default
        </button>
      </div>

      {/* Split View: Editor & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Editor */}
        <div className="space-y-4">
          <div className="sticky top-0 bg-gradient-to-r from-millipore-blue to-blue-600 text-white px-4 py-3 rounded-lg z-10 shadow-md">
            <h3 className="text-lg font-semibold flex items-center">
              <PencilIcon className="h-5 w-5 mr-2" />
              Configuration Editor
            </h3>
            <p className="text-xs text-blue-100 mt-1">Edit form fields and properties</p>
          </div>
          {config.sections.map((section, index) => renderSectionEditor(section, index))}
        </div>

        {/* Right Column - Live Preview */}
        <div className="space-y-4">
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-lg z-10 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  <EyeIcon className="h-5 w-5 mr-2" />
                  Live Preview
                </h3>
                <p className="text-xs text-green-100 mt-1">How the form appears to users</p>
              </div>
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                READ ONLY
              </span>
            </div>
          </div>

          {/* Preview Container with distinct styling */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 shadow-inner">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="space-y-4">
                {config.sections.filter(s => s.visible).length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <EyeSlashIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No visible sections to preview</p>
                    <p className="text-xs mt-1">Toggle section visibility in the editor</p>
                  </div>
                ) : (
                  config.sections.filter(s => s.visible).map(section => (
                    <div key={section.sectionKey} className="relative">
                      {/* Preview Badge */}
                      <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">
                        Preview
                      </div>
                      <DynamicFormSection
                        section={section}
                        register={() => {}} // Mock register for preview
                        errors={{}}
                        watch={() => {}}
                        readOnly={true}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
const AddFieldModal = ({ sectionKey, onClose, onAdd }) => {
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
    options: []
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
