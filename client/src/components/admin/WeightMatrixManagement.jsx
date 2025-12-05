import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, ScaleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { weightMatrixAPI } from '../../services/api';

const WeightMatrixManagement = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testSize, setTestSize] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchEntries();
  }, [currentPage]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await weightMatrixAPI.getAll(currentPage, 50);
      setEntries(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch weight matrix:', error);
      toast.error('Failed to load weight matrix data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchEntries();
      return;
    }

    try {
      setLoading(true);
      const response = await weightMatrixAPI.search(searchQuery);
      setEntries(response.data.data);
      setTotalPages(1);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLookup = async () => {
    if (!testSize.trim()) {
      toast.error('Please enter a package size to test');
      return;
    }

    try {
      const response = await weightMatrixAPI.lookup(testSize);
      setTestResult(response.data);

      if (response.data.match === 'exact') {
        toast.success('Exact match found!');
      } else if (response.data.match === 'approximate') {
        toast.success(`Approximate match found (diff: ${response.data.difference.toFixed(2)})`);
      } else {
        toast.error('No match found');
      }
    } catch (error) {
      console.error('Lookup failed:', error);
      toast.error('Lookup failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      await weightMatrixAPI.delete(id);
      toast.success('Entry deleted successfully');
      fetchEntries();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete entry');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ScaleIcon className="h-8 w-8 mr-3 text-purple-600" />
            Weight Matrix Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage gross weight mappings for package sizes (SAP MARA: BRGEW, GEWEI)
          </p>
        </div>
      </div>

      {/* Package Size Lookup & Search */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Package Size Lookup & Search</h3>
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package Size
            </label>
            <input
              type="text"
              value={testSize}
              onChange={(e) => {
                setTestSize(e.target.value);
                setSearchQuery(e.target.value);
              }}
              placeholder="e.g., 100G, 1L, 500MG"
              className="form-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTestLookup();
                  if (testSize.trim()) handleSearch();
                }
              }}
            />
          </div>
          <button
            onClick={() => {
              handleTestLookup();
              if (testSize.trim()) handleSearch();
            }}
            className="btn btn-primary"
          >
            <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
            Lookup
          </button>
          <button
            onClick={() => {
              setTestSize('');
              setSearchQuery('');
              setTestResult(null);
              setCurrentPage(1);
              fetchEntries();
            }}
            className="btn btn-secondary"
          >
            Clear
          </button>
        </div>

        {testResult && testResult.match !== 'none' && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                testResult.match === 'exact' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {testResult.match === 'exact' ? '✓ Exact Match' : '≈ Approximate Match'}
              </span>
              {testResult.difference !== undefined && (
                <span className="text-sm text-gray-600">
                  Difference: {testResult.difference.toFixed(2)}g
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Size:</span>
                <p className="font-medium text-gray-900">{testResult.data.size}</p>
              </div>
              <div>
                <span className="text-gray-600">Gross Weight:</span>
                <p className="font-medium text-gray-900">{testResult.data.grossWeight} {testResult.data.weightUnit}</p>
              </div>
              <div>
                <span className="text-gray-600">Normalized:</span>
                <p className="font-medium text-gray-900">
                  {testResult.data.normalizedGrossWeight?.value.toFixed(2)}g
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Entries Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading weight matrix data...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <ScaleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No entries found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Package Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gross Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Normalized (g)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map((entry) => (
                      <tr key={entry._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{entry.size}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{entry.grossWeight}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">{entry.weightUnit}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {entry.normalizedGrossWeight?.value?.toFixed(2) || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDelete(entry._id)}
                            className="text-red-600 hover:text-red-900 ml-4"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="btn btn-secondary btn-sm"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="btn btn-secondary btn-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-700 font-medium">Total Entries</div>
          <div className="text-2xl font-bold text-purple-900 mt-1">{entries.length}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-700 font-medium">Current Page</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">{currentPage} / {totalPages}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-700 font-medium">Data Source</div>
          <div className="text-sm font-medium text-green-900 mt-1">SAP MARA Table</div>
        </div>
      </div>
    </div>
  );
};

export default WeightMatrixManagement;
