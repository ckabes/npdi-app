import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * GenericCRUDManager Component
 *
 * Reusable CRUD management component for admin entities.
 * Eliminates duplication between PlantCodesManager and BusinessLineManager.
 *
 * @param {Object} props
 * @param {string} props.title - Entity title (e.g., "Plant Codes")
 * @param {string} props.entityName - Singular entity name (e.g., "Plant Code")
 * @param {Object} props.apiClient - API client with methods: getAll, getMetadata, create, update, delete, rebuild
 * @param {string} props.description - Description text for header
 * @param {Array} props.columns - Table column definitions [{key, label, render}]
 * @param {Object} props.defaultFormValues - Default values for add/edit form
 * @param {Function} props.renderFormFields - Function to render form fields
 * @param {Object} props.rebuildConfig - Rebuild configuration {enabled, description, steps}
 */
const GenericCRUDManager = ({
  title,
  entityName,
  apiClient,
  description,
  columns,
  defaultFormValues,
  renderFormFields,
  rebuildConfig = { enabled: false }
}) => {
  const [items, setItems] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(defaultFormValues);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRebuildConfirm, setShowRebuildConfirm] = useState(false);

  useEffect(() => {
    fetchItems();
    if (apiClient.getMetadata) {
      fetchMetadata();
    }
  }, []);

  const fetchItems = async () => {
    try {
      const response = await apiClient.getAll();
      setItems(response.data.data || []);
    } catch (error) {
      console.error(`Error fetching ${title.toLowerCase()}:`, error);
      toast.error(`Failed to load ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const response = await apiClient.getMetadata();
      setMetadata(response.data.data);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  const handleRebuild = async () => {
    if (!apiClient.rebuild) {
      toast.error('Rebuild not available for this entity');
      return;
    }

    setRebuilding(true);
    setShowRebuildConfirm(false);
    try {
      const response = await apiClient.rebuild();
      const { totalRows, uniquePlantCodes, uniqueBusinessLines, queryDuration, source } = response.data.data;
      const uniqueCount = uniquePlantCodes || uniqueBusinessLines || totalRows;

      toast.success(
        `Rebuild complete from ${source || 'Palantir Foundry'}!\n` +
        `• Query time: ${queryDuration ? Math.round(queryDuration / 1000) : 0}s\n` +
        `• Processed ${totalRows || 0} records\n` +
        `• Extracted ${uniqueCount || 0} unique ${title.toLowerCase()} to database`,
        { duration: 6000 }
      );

      await fetchItems();
      if (apiClient.getMetadata) {
        await fetchMetadata();
      }
    } catch (error) {
      console.error(`Error rebuilding ${title.toLowerCase()}:`, error);
      toast.error(error.response?.data?.message || `Failed to rebuild ${title.toLowerCase()} from Palantir`);
    } finally {
      setRebuilding(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setEditForm({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(defaultFormValues);
  };

  const handleSaveEdit = async (id) => {
    try {
      await apiClient.update(id, editForm);
      toast.success(`${entityName} updated successfully`);
      await fetchItems();
      setEditingId(null);
    } catch (error) {
      console.error(`Error updating ${entityName.toLowerCase()}:`, error);
      toast.error(`Failed to update ${entityName.toLowerCase()}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${entityName.toLowerCase()}?`)) {
      return;
    }

    try {
      await apiClient.delete(id);
      toast.success(`${entityName} deleted successfully`);
      await fetchItems();
    } catch (error) {
      console.error(`Error deleting ${entityName.toLowerCase()}:`, error);
      toast.error(`Failed to delete ${entityName.toLowerCase()}`);
    }
  };

  const handleAdd = async () => {
    try {
      await apiClient.create(editForm);
      toast.success(`${entityName} added successfully`);
      await fetchItems();
      setShowAddForm(false);
      setEditForm(defaultFormValues);
    } catch (error) {
      console.error(`Error adding ${entityName.toLowerCase()}:`, error);
      toast.error(error.response?.data?.message || `Failed to add ${entityName.toLowerCase()}`);
    }
  };

  if (loading) {
    return <LoadingSpinner message={`Loading ${title.toLowerCase()}...`} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title} Management</h2>
            <p className="text-gray-700 mb-4">{description}</p>

            {metadata && (
              <div className="bg-white rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 mb-2">Current Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total {title}:</span>
                    <span className="ml-2 font-semibold">{metadata.totalCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Active:</span>
                    <span className="ml-2 font-semibold">{metadata.activeCount}</span>
                  </div>
                  {metadata.lastExtracted && (
                    <>
                      <div>
                        <span className="text-gray-600">Last Extracted:</span>
                        <span className="ml-2 font-semibold">
                          {new Date(metadata.lastExtracted).toLocaleDateString()} {new Date(metadata.lastExtracted).toLocaleTimeString()}
                        </span>
                      </div>
                      {metadata.extractedBy && (
                        <div>
                          <span className="text-gray-600">Extracted By:</span>
                          <span className="ml-2 font-semibold">{metadata.extractedBy.name || metadata.extractedBy.email}</span>
                        </div>
                      )}
                    </>
                  )}
                  {metadata.extractedFrom && (
                    <div>
                      <span className="text-gray-600">Source:</span>
                      <span className="ml-2 font-semibold">{metadata.extractedFrom}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-secondary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add {entityName}
        </button>

        {rebuildConfig.enabled && apiClient.rebuild && (
          <button
            onClick={() => setShowRebuildConfirm(true)}
            className="btn btn-primary flex items-center gap-2"
            disabled={rebuilding}
          >
            <ArrowPathIcon className={`h-5 w-5 ${rebuilding ? 'animate-spin' : ''}`} />
            {rebuilding ? 'Rebuilding...' : 'Rebuild from Palantir'}
          </button>
        )}
      </div>

      {/* Rebuilding Loading Overlay */}
      {rebuilding && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  <ArrowPathIcon className="h-10 w-10 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Rebuilding {title}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  {rebuildConfig.steps && rebuildConfig.steps.map((step, index) => (
                    <p key={index} className="flex items-center justify-center">
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" style={{ animationDelay: `${index * 0.2}s` }}></span>
                      {step}
                    </p>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500">Please wait, this may take a moment...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rebuild Confirmation Modal */}
      {showRebuildConfirm && !rebuilding && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
              <div className="flex items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <InformationCircleIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mt-0 ml-4 text-left">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Rebuild {title}?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {rebuildConfig.description || `This will fetch the latest data from Palantir Foundry and update the ${title.toLowerCase()} in the database.`}
                  </p>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                    <p className="text-sm text-yellow-700">
                      <strong>Note:</strong> Any manual changes to descriptions or active status will be preserved.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowRebuildConfirm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRebuild}
                  className="btn btn-primary"
                >
                  Rebuild
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New {entityName}</h3>
          {renderFormFields(editForm, setEditForm)}
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditForm(defaultFormValues);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="btn btn-primary"
            >
              Add {entityName}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {editingId === item._id && column.editable !== false ? (
                      column.renderEdit ? (
                        column.renderEdit(editForm, setEditForm)
                      ) : (
                        <input
                          type="text"
                          value={editForm[column.key] || ''}
                          onChange={(e) => setEditForm({ ...editForm, [column.key]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      )
                    ) : (
                      column.render ? column.render(item[column.key], item) : item[column.key]
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingId === item._id ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSaveEdit(item._id)}
                        className="text-green-600 hover:text-green-900"
                        title="Save"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-red-600 hover:text-red-900"
                        title="Cancel"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GenericCRUDManager;
