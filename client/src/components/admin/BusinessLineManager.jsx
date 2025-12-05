import React from 'react';
import { businessLineAPI } from '../../services/api';
import GenericCRUDManager from './GenericCRUDManager';
import { ActiveStatusBadge } from '../common/Badge';

/**
 * BusinessLinesManager Component
 *
 * Manages business lines using the GenericCRUDManager.
 * Refactored from 483 lines to ~90 lines by eliminating duplication.
 */
const BusinessLinesManager = () => {
  // Define table columns
  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (code) => <span className="font-mono font-semibold">{code}</span>,
      renderEdit: (editForm, setEditForm) => (
        <input
          type="text"
          value={editForm.code || ''}
          onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="BIO"
        />
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (description) => <span className="text-sm text-gray-900">{description}</span>,
      renderEdit: (editForm, setEditForm) => (
        <input
          type="text"
          value={editForm.description || ''}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="Life Science"
        />
      )
    },
    {
      key: 'active',
      label: 'Status',
      render: (active) => <ActiveStatusBadge isActive={active} />,
      renderEdit: (editForm, setEditForm) => (
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={editForm.active || false}
            onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
            className="rounded border-gray-300 text-millipore-blue focus:ring-millipore-blue"
          />
          <span className="ml-2 text-sm">Active</span>
        </label>
      )
    },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      render: (updatedAt) => (
        <span className="text-sm text-gray-500">
          {new Date(updatedAt).toLocaleDateString()}
        </span>
      ),
      editable: false
    }
  ];

  // Default form values
  const defaultFormValues = {
    code: '',
    description: '',
    active: true
  };

  // Render form fields for add/edit
  const renderFormFields = (editForm, setEditForm) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={editForm.code || ''}
          onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="BIO"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={editForm.description || ''}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Life Science"
          required
        />
      </div>
      <div className="md:col-span-2">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={editForm.active || false}
            onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
            className="rounded border-gray-300 text-millipore-blue focus:ring-millipore-blue"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
        </label>
      </div>
    </div>
  );

  // Rebuild configuration
  const rebuildConfig = {
    enabled: true,
    description: 'This will query Palantir Foundry for live SAP MARA data and extract all unique business lines from the dataset.',
    steps: [
      'Connecting to Palantir Foundry...',
      'Querying SAP MARA dataset...',
      'Extracting unique business lines...',
      'Updating database...'
    ]
  };

  return (
    <GenericCRUDManager
      title="Business Lines"
      entityName="Business Line"
      apiClient={businessLineAPI}
      description="Manage business line codes extracted from live SAP MARA data via Palantir Foundry. These codes are used in dropdown menus throughout the application."
      columns={columns}
      defaultFormValues={defaultFormValues}
      renderFormFields={renderFormFields}
      rebuildConfig={rebuildConfig}
    />
  );
};

export default BusinessLinesManager;
