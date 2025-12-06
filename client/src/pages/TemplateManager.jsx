import { useState, useEffect } from 'react';
import { templatesAPI } from '../services/api';
import {
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const TemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTemplates, setExpandedTemplates] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [savingTemplate, setSavingTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await templatesAPI.getAll(true); // Include users
      setTemplates(response.data);

      // All templates collapsed by default
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplate = (templateId) => {
    setExpandedTemplates(prev => ({
      ...prev,
      [templateId]: !prev[templateId]
    }));
  };

  const toggleSection = (templateId, sectionKey) => {
    const key = `${templateId}-${sectionKey}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const expandAllSections = (template) => {
    const updates = {};
    template.formConfiguration.sections.forEach(section => {
      const key = `${template._id}-${section.sectionKey}`;
      updates[key] = true;
    });
    setExpandedSections(prev => ({ ...prev, ...updates }));
  };

  const collapseAllSections = (template) => {
    const updates = {};
    template.formConfiguration.sections.forEach(section => {
      const key = `${template._id}-${section.sectionKey}`;
      updates[key] = false;
    });
    setExpandedSections(prev => ({ ...prev, ...updates }));
  };

  const toggleFieldRequirement = async (template, fieldKey) => {
    try {
      setSavingTemplate(template._id);

      // Toggle the field in submission requirements
      const currentRequirements = template.submissionRequirements || [];
      const newRequirements = currentRequirements.includes(fieldKey)
        ? currentRequirements.filter(key => key !== fieldKey)
        : [...currentRequirements, fieldKey];

      // Get current user email from localStorage
      const profileData = localStorage.getItem('currentProfileData');
      const profile = profileData ? JSON.parse(profileData) : null;
      const updatedBy = profile?.email || 'system';

      // Update on backend
      await templatesAPI.updateRequirements(template._id, newRequirements, updatedBy);

      // Update local state
      setTemplates(prevTemplates =>
        prevTemplates.map(t =>
          t._id === template._id
            ? { ...t, submissionRequirements: newRequirements }
            : t
        )
      );
    } catch (err) {
      console.error('Error updating field requirements:', err);
      alert('Failed to update field requirements. Please try again.');
    } finally {
      setSavingTemplate(null);
    }
  };

  const isFieldRequired = (template, fieldKey) => {
    return (template.submissionRequirements || []).includes(fieldKey);
  };

  const getAllFields = (formConfiguration) => {
    if (!formConfiguration?.sections) return [];

    const fields = [];
    formConfiguration.sections.forEach(section => {
      section.fields.forEach(field => {
        fields.push({
          ...field,
          sectionKey: section.sectionKey,
          sectionName: section.name
        });
      });
    });
    return fields;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchTemplates}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Template Manager</h1>
        <p className="mt-2 text-gray-600">
          Manage submission requirements for ticket templates. Toggle which fields are required before tickets can be submitted.
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No templates found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {templates.map(template => (
            <div
              key={template._id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Template Header */}
              <div
                className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 cursor-pointer hover:from-blue-100 hover:to-indigo-100"
                onClick={() => toggleTemplate(template._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {expandedTemplates[template._id] ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                    )}
                    <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {template.formConfiguration?.name || template.name}
                        {template.isDefault && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            Default
                          </span>
                        )}
                        {template.formConfiguration?.version && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                            v{template.formConfiguration.version}
                          </span>
                        )}
                      </h2>
                      {template.description && (
                        <p className="text-sm text-gray-600">{template.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>{template.assignedUsers?.length || 0} users</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>
                        {template.submissionRequirements?.length || 0} required fields
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Content */}
              {expandedTemplates[template._id] && (
                <div className="p-6">
                  {/* Assigned Users */}
                  {template.assignedUsers && template.assignedUsers.length > 0 && (
                    <div className="mb-6 bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        Assigned Users
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {template.assignedUsers.map(user => (
                          <div
                            key={user.email}
                            className="inline-flex items-center px-3 py-1 bg-white border border-gray-200 rounded-full text-sm"
                          >
                            <span className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="ml-2 text-gray-500">({user.role})</span>
                            {user.sbu && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                {user.sbu}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Form Sections and Fields */}
                  {template.formConfiguration?.sections ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">
                          Submission Requirements by Section
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => expandAllSections(template)}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                          >
                            Expand All
                          </button>
                          <button
                            onClick={() => collapseAllSections(template)}
                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200"
                          >
                            Collapse All
                          </button>
                        </div>
                      </div>
                      {template.formConfiguration.sections
                        .filter(section => section.visible !== false)
                        .sort((a, b) => a.order - b.order)
                        .map(section => {
                          const sectionKey = `${template._id}-${section.sectionKey}`;
                          const isSectionExpanded = expandedSections[sectionKey] === true; // Default collapsed

                          return (
                            <div
                              key={section.sectionKey}
                              className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                              {/* Section Header */}
                              <div
                                className="px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                onClick={() => toggleSection(template._id, section.sectionKey)}
                              >
                                <div className="flex items-center space-x-2">
                                  {isSectionExpanded ? (
                                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                                  )}
                                  <h4 className="font-medium text-gray-900">{section.name}</h4>
                                  <span className="text-xs text-gray-500">
                                    ({section.fields.length} fields)
                                  </span>
                                </div>
                                <span className="text-xs text-gray-600">
                                  {section.fields.filter(f => isFieldRequired(template, f.fieldKey)).length} required
                                </span>
                              </div>

                              {/* Section Fields */}
                              {isSectionExpanded && (
                                <div className="divide-y divide-gray-100">
                                  {section.fields
                                    .filter(field => field.visible !== false)
                                    .sort((a, b) => a.order - b.order)
                                    .map(field => {
                                      const isRequired = isFieldRequired(template, field.fieldKey);
                                      const isSaving = savingTemplate === template._id;

                                      return (
                                        <div
                                          key={field.fieldKey}
                                          className="px-4 py-3 hover:bg-gray-50 flex items-center justify-between"
                                        >
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                              <span className="font-medium text-gray-900">
                                                {field.label}
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                ({field.type})
                                              </span>
                                            </div>
                                            {field.helpText && (
                                              <p className="text-xs text-gray-500 mt-1">
                                                {field.helpText}
                                              </p>
                                            )}
                                          </div>
                                          <button
                                            onClick={() => toggleFieldRequirement(template, field.fieldKey)}
                                            disabled={isSaving}
                                            className={`ml-4 flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                              isRequired
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          >
                                            {isRequired ? (
                                              <>
                                                <CheckCircleIcon className="h-4 w-4" />
                                                <span>Required for Submission</span>
                                              </>
                                            ) : (
                                              <>
                                                <XCircleIcon className="h-4 w-4" />
                                                <span>Optional for Submission</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No form configuration found for this template</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
