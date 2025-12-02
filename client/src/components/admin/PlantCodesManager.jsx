import React, { useState, useEffect } from 'react';
import { plantCodeAPI } from '../../services/api';
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

const PlantCodesManager = () => {
  const [plantCodes, setPlantCodes] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ code: '', description: '', active: true });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRebuildConfirm, setShowRebuildConfirm] = useState(false);

  useEffect(() => {
    fetchPlantCodes();
    fetchMetadata();
  }, []);

  const fetchPlantCodes = async () => {
    try {
      const response = await plantCodeAPI.getAll();
      setPlantCodes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching plant codes:', error);
      toast.error('Failed to load plant codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const response = await plantCodeAPI.getMetadata();
      setMetadata(response.data.data);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  const handleRebuild = async () => {
    setRebuilding(true);
    setShowRebuildConfirm(false);
    try {
      const response = await plantCodeAPI.rebuild();
      const { totalRows, rowsWithPlant, uniquePlantCodes, queryDuration, source } = response.data.data;

      // Show detailed success message
      toast.success(
        `Rebuild complete from ${source || 'Palantir Foundry'}!\n` +
        `• Query time: ${queryDuration ? Math.round(queryDuration / 1000) : 0}s\n` +
        `• Processed ${totalRows} unique plant codes\n` +
        `• Extracted ${uniquePlantCodes} plant codes to database`,
        { duration: 6000 }
      );

      await fetchPlantCodes();
      await fetchMetadata();
    } catch (error) {
      console.error('Error rebuilding plant codes:', error);
      toast.error(error.response?.data?.message || 'Failed to rebuild plant codes from Palantir');
    } finally {
      setRebuilding(false);
    }
  };

  const handleEdit = (plantCode) => {
    setEditingId(plantCode._id);
    setEditForm({
      code: plantCode.code,
      description: plantCode.description,
      active: plantCode.active
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ code: '', description: '', active: true });
  };

  const handleSaveEdit = async (id) => {
    try {
      await plantCodeAPI.update(id, editForm);
      toast.success('Plant code updated successfully');
      await fetchPlantCodes();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating plant code:', error);
      toast.error('Failed to update plant code');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plant code?')) {
      return;
    }

    try {
      await plantCodeAPI.delete(id);
      toast.success('Plant code deleted successfully');
      await fetchPlantCodes();
    } catch (error) {
      console.error('Error deleting plant code:', error);
      toast.error('Failed to delete plant code');
    }
  };

  const handleAdd = async () => {
    try {
      await plantCodeAPI.create(editForm);
      toast.success('Plant code added successfully');
      await fetchPlantCodes();
      setShowAddForm(false);
      setEditForm({ code: '', description: '', active: true });
    } catch (error) {
      console.error('Error adding plant code:', error);
      toast.error(error.response?.data?.message || 'Failed to add plant code');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-millipore-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Plant Codes Management</h2>
            <p className="text-gray-700 mb-4">
              Manage manufacturing plant codes extracted from live SAP MARA data via Palantir Foundry. These codes are used in dropdown menus throughout the application.
            </p>

            {metadata && (
              <div className="bg-white rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 mb-2">Current Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Plant Codes:</span>
                    <span className="ml-2 font-semibold">{metadata.totalCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Active Codes:</span>
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
                  <div>
                    <span className="text-gray-600">Source:</span>
                    <span className="ml-2 font-semibold">{metadata.extractedFrom || 'MARA_Export.csv'}</span>
                  </div>
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
          Add Plant Code
        </button>

        <button
          onClick={() => setShowRebuildConfirm(true)}
          className="btn btn-primary flex items-center gap-2"
          disabled={rebuilding}
        >
          <ArrowPathIcon className={`h-5 w-5 ${rebuilding ? 'animate-spin' : ''}`} />
          {rebuilding ? 'Rebuilding...' : 'Rebuild from Palantir'}
        </button>
      </div>

      {/* Rebuilding Loading Overlay */}
      {rebuilding && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  <ArrowPathIcon className="h-10 w-10 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Rebuilding Plant Codes</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center justify-center">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></span>
                    Connecting to Palantir Foundry...
                  </p>
                  <p className="flex items-center justify-center">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                    Querying SAP MARA dataset...
                  </p>
                  <p className="flex items-center justify-center">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                    Extracting unique plant codes...
                  </p>
                  <p className="flex items-center justify-center">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" style={{ animationDelay: '0.6s' }}></span>
                    Updating database...
                  </p>
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowRebuildConfirm(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <InformationCircleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Rebuild Plant Codes List
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        This will:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-500 mt-2 space-y-1">
                        <li>Delete all existing plant codes</li>
                        <li>Query <strong>Palantir Foundry</strong> for live SAP MARA data</li>
                        <li>Extract <strong>all unique plant codes</strong> from the dataset</li>
                        <li>Create new plant code entries in the database</li>
                      </ul>
                      <p className="text-sm text-gray-500 mt-3">
                        <strong>Warning:</strong> Any manual edits will be lost. This will query the live SAP data to ensure you have the most up-to-date plant codes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleRebuild}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Yes, Rebuild
                </button>
                <button
                  onClick={() => setShowRebuildConfirm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Add New Plant Code</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                  className="input"
                  placeholder="US01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="input"
                  placeholder="Milwaukee Manufacturing"
                />
              </div>
              <div className="flex items-end gap-2">
                <button onClick={handleAdd} className="btn btn-primary">
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditForm({ code: '', description: '', active: true });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plant Codes Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Plant Codes ({plantCodes.length})</h3>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plantCodes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <p className="text-lg mb-2">No plant codes found</p>
                      <p className="text-sm">Click "Rebuild from Palantir" to extract plant codes from live SAP MARA data</p>
                    </td>
                  </tr>
                ) : (
                  plantCodes.map((plantCode) => (
                    <tr key={plantCode._id} className="hover:bg-gray-50">
                      {editingId === plantCode._id ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={editForm.code}
                              onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                              className="input input-sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="input input-sm w-full"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editForm.active}
                                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                                className="rounded border-gray-300 text-millipore-blue focus:ring-millipore-blue"
                              />
                              <span className="ml-2 text-sm">Active</span>
                            </label>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(plantCode.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleSaveEdit(plantCode._id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              <CheckCircleIcon className="h-5 w-5 inline" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <XCircleIcon className="h-5 w-5 inline" />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono font-semibold">{plantCode.code}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">{plantCode.description}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {plantCode.active ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(plantCode.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(plantCode)}
                              className="text-millipore-blue hover:text-millipore-blue-dark mr-3"
                            >
                              <PencilIcon className="h-5 w-5 inline" />
                            </button>
                            <button
                              onClick={() => handleDelete(plantCode._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-5 w-5 inline" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantCodesManager;
