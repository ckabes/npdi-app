import React, { useState } from 'react';
import { productAPI } from '../../services/api';
import toast from 'react-hot-toast';

/**
 * SAP Data Search Popup Component
 * Allows searching for SAP material data from Palantir Foundry and importing it into the product ticket
 */
const MARASearchPopup = ({ onClose, onApprove }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [sapData, setSapData] = useState(null);
  const [mappedFields, setMappedFields] = useState(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a part number');
      return;
    }

    setSearching(true);
    setSapData(null);
    setMappedFields(null);

    try {
      // Normalize search term: append -BULK if not already present
      let normalizedPartNumber = searchTerm.trim();
      if (!normalizedPartNumber.endsWith('-BULK')) {
        normalizedPartNumber = `${normalizedPartNumber}-BULK`;
      }

      console.log(`[SAP Search] Searching for: ${normalizedPartNumber}`);

      // Search Palantir Foundry for SAP material data
      const response = await productAPI.searchMARA(normalizedPartNumber);

      if (response.data.success && response.data.data) {
        setSapData(response.data.data);
        setMappedFields(response.data.mappedFields);
        toast.success(`Found SAP data for ${normalizedPartNumber}`);
      } else {
        toast.error(response.data.message || 'No data found for this part number');
      }
    } catch (error) {
      console.error('[SAP Search] Error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to search SAP data';
      toast.error(errorMsg);
    } finally {
      setSearching(false);
    }
  };

  const handleApprove = () => {
    if (!mappedFields) {
      toast.error('No data to import');
      return;
    }

    // Close popup immediately so user can see the automation flow
    onClose();

    // Small delay to ensure popup close animation completes
    setTimeout(() => {
      onApprove(mappedFields);
    }, 200);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-millipore-blue to-millipore-blue-dark p-6">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-2xl font-bold">Import Data from SAP</h2>
              <p className="text-blue-100 text-sm mt-1">
                Search for an existing SAP material to auto-populate product data
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter part number (e.g., 176036)"
                className="form-input w-full"
                disabled={searching}
              />
              <p className="text-xs text-gray-500 mt-1">
                Note: "-BULK" will be automatically appended if not present
              </p>
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="btn btn-primary px-6"
            >
              {searching ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex-1 overflow-y-auto p-6">
          {!sapData && !searching && (
            <div className="text-center py-12 text-gray-400">
              <svg
                className="mx-auto h-12 w-12 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="mt-4 text-lg">Enter a part number above to search for SAP data</p>
            </div>
          )}

          {searching && (
            <div className="text-center py-12">
              <svg className="animate-spin h-12 w-12 text-millipore-blue mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-gray-600">Searching Palantir Foundry...</p>
            </div>
          )}

          {mappedFields && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  ✓ Found {Object.keys(mappedFields).length} Mappable Fields
                </h3>
                <p className="text-sm text-blue-700">
                  The following fields from SAP will be imported into your product ticket:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {Object.entries(mappedFields).map(([fieldPath, value]) => {
                  // Parse the field path to show a nice label
                  const fieldLabel = fieldPath
                    .split('.')
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1).replace(/([A-Z])/g, ' $1'))
                    .join(' → ');

                  return (
                    <div key={fieldPath} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{fieldLabel}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </p>
                        </div>
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Will Import
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {sapData && (
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 mb-2">Raw SAP Data (Preview):</p>
                  <pre className="text-xs text-gray-700 overflow-x-auto max-h-40">
                    {JSON.stringify(sapData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {mappedFields && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Imported fields will be highlighted in green and remain editable
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="btn btn-secondary"
                >
                  Discard
                </button>
                <button
                  onClick={handleApprove}
                  className="btn btn-primary"
                >
                  Approve & Import
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MARASearchPopup;
