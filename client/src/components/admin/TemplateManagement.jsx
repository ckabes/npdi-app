import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { templatesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../utils/AuthContext';

const TemplateManagement = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await templatesAPI.getAll();
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId, templateName) => {
    if (!window.confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
      return;
    }

    try {
      await templatesAPI.delete(templateId);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error(error.response?.data?.message || 'Failed to delete template');
    }
  };

  const handleSetDefault = async (templateId) => {
    try {
      await templatesAPI.update(templateId, { isDefault: true, updatedBy: user.email });
      toast.success('Default template updated');
      loadTemplates();
    } catch (error) {
      console.error('Error setting default template:', error);
      toast.error('Failed to set default template');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-millipore-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Management</h2>
          <p className="text-gray-600 mt-1">
            Manage ticket templates and assign them to users
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Templates:</strong> Each Product Manager is assigned a template that defines their ticket form structure.
          PM Ops users can edit any ticket regardless of template. The Default template is used when no specific template is assigned.
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <DocumentDuplicateIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first template</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Create Template
            </button>
          </div>
        ) : (
          templates.map(template => (
            <TemplateCard
              key={template._id}
              template={template}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
              onAssignUsers={() => setShowAssignModal(template)}
              onEdit={() => {
                // Navigate to form configuration editor with this template
                toast.info('Form configuration editor coming soon');
              }}
            />
          ))
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTemplates();
          }}
        />
      )}

      {/* Assign Users Modal */}
      {showAssignModal && (
        <AssignUsersModal
          template={showAssignModal}
          onClose={() => setShowAssignModal(null)}
          onSuccess={() => {
            setShowAssignModal(null);
            loadTemplates();
          }}
        />
      )}
    </div>
  );
};

const TemplateCard = ({ template, onDelete, onSetDefault, onAssignUsers, onEdit }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md border-2 ${
      template.isDefault ? 'border-green-500' : 'border-gray-200'
    } hover:shadow-lg transition-shadow`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${
        template.isDefault ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
              {template.isDefault && (
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Default
                </span>
              )}
            </div>
            {template.description && (
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-3">
        {/* Form Configuration Info */}
        <div className="flex items-center text-sm text-gray-600">
          <Cog6ToothIcon className="h-5 w-5 mr-2 text-gray-400" />
          <span>
            <strong>Form:</strong> {template.formConfiguration?.name || 'Loading...'}
          </span>
        </div>

        {/* Section and Field Counts */}
        {template.formConfiguration && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <span className="text-gray-600">
                <strong>Sections:</strong> {template.formConfiguration.sections?.filter(s => s.visible).length || 0} visible
              </span>
              <span className="text-gray-400 ml-1">
                / {template.formConfiguration.sections?.length || 0} total
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600">
                <strong>Fields:</strong> {template.formConfiguration.sections?.reduce((total, section) => {
                  return total + (section.visible ? section.fields.filter(f => f.visible).length : 0);
                }, 0) || 0} visible
              </span>
              <span className="text-gray-400 ml-1">
                / {template.formConfiguration.metadata?.totalFields || 0} total
              </span>
            </div>
          </div>
        )}

        {/* Assigned Users */}
        <div className="flex items-start text-sm text-gray-600">
          <UserGroupIcon className="h-5 w-5 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
          <div className="flex-1">
            <strong>Assigned Users:</strong>
            {template.assignedUsers && template.assignedUsers.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {template.assignedUsers.map((email, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {email}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 ml-1">No users assigned</span>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
          <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
          <span>Updated: {new Date(template.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={onAssignUsers}
          className="btn btn-sm btn-secondary flex items-center space-x-2"
        >
          <UserGroupIcon className="h-4 w-4" />
          <span>Assign Users</span>
        </button>

        <div className="flex items-center space-x-2">
          {!template.isDefault && (
            <button
              onClick={() => onSetDefault(template._id)}
              className="btn btn-sm btn-secondary"
              title="Set as default template"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="btn btn-sm btn-secondary"
            title="Edit form configuration"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          {!template.isDefault && (
            <button
              onClick={() => onDelete(template._id, template.name)}
              className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
              title="Delete template"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateTemplateModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    try {
      setCreating(true);

      // For now, create a new template by duplicating the default form configuration
      // In a full implementation, you would allow selecting/creating a form configuration
      const defaultTemplate = await templatesAPI.getAll();
      const defaultFormConfigId = defaultTemplate.data[0]?.formConfiguration?._id;

      if (!defaultFormConfigId) {
        toast.error('No default form configuration found. Please create one first.');
        return;
      }

      await templatesAPI.create({
        name: formData.name,
        description: formData.description,
        formConfiguration: defaultFormConfigId,
        createdBy: user.email
      });

      toast.success('Template created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error(error.response?.data?.message || 'Failed to create template');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Create New Template</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input w-full"
              placeholder="e.g., Life Science Template"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input w-full"
              rows={3}
              placeholder="Brief description of this template..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              The new template will use a copy of the default form configuration.
              You can customize it later in the form configuration editor.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AssignUsersModal = ({ template, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [emails, setEmails] = useState((template.assignedUsers || []).join(', '));
  const [assigning, setAssigning] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailArray = emails
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailArray.filter(email => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      toast.error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      return;
    }

    try {
      setAssigning(true);

      // First unassign all current users
      if (template.assignedUsers && template.assignedUsers.length > 0) {
        await templatesAPI.unassign(template._id, {
          userEmails: template.assignedUsers,
          updatedBy: user.email
        });
      }

      // Then assign new users
      if (emailArray.length > 0) {
        await templatesAPI.assign(template._id, {
          userEmails: emailArray,
          updatedBy: user.email
        });
      }

      toast.success('Users assigned successfully');
      onSuccess();
    } catch (error) {
      console.error('Error assigning users:', error);
      toast.error('Failed to assign users');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Assign Users to Template</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template: <strong>{template.name}</strong>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Email Addresses
            </label>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              className="form-input w-full"
              rows={4}
              placeholder="Enter email addresses separated by commas&#10;e.g., user1@milliporesigma.com, user2@milliporesigma.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple email addresses with commas
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Users can only be assigned to one template at a time.
              Assigning a user to this template will remove them from any other template.
              PM Ops users should not be assigned templates.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={assigning}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={assigning}
            >
              {assigning ? 'Assigning...' : 'Assign Users'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateManagement;
