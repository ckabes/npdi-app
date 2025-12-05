import React, { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Silly chemistry/science loading messages
const LOADING_MESSAGES = [
  'Distilling SAP data...',
  'Precipitating product information...',
  'Centrifuging chemical properties...',
  'Titrating material numbers...',
  'Filtering through molecular formulas...',
  'Crystallizing CAS numbers...',
  'Evaporating excess metadata...',
  'Balancing the chemical equation...',
  'Measuring pH of data quality...',
  'Extracting active ingredients...',
  'Catalyzing the search reaction...',
  'Conducting chromatography on results...',
  'Pipetting precise measurements...',
  'Incubating material records...',
  'Sterilizing dirty data...',
  'Mixing reagents and SKUs...',
  'Analyzing spectral signatures...',
  'Neutralizing bad records...',
  'Sublimating solid state data...',
  'Polymerizing product chains...',
  // Round 2: More chemistry fun!
  'Oxidizing outdated information...',
  'Reducing data complexity...',
  'Hydrolyzing legacy systems...',
  'Dehydrating redundant fields...',
  'Calculating molecular weights...',
  'Buffering against errors...',
  'Performing gravimetric analysis...',
  'Synthesizing perfect results...',
  'Recrystallizing data purity...',
  'Running gel electrophoresis...',
  'Adjusting molarity levels...',
  'Checking orbital configurations...',
  'Quantifying significant figures...',
  'Dissolving data silos...',
  'Calibrating the mass spectrometer...',
  'Reaching critical mass...',
  'Achieving equilibrium state...',
  'Detecting Van der Waals forces...',
  'Ionizing information streams...',
  'Bonding covalently with databases...'
];

/**
 * SAP Data Search Popup Component
 * Allows searching for SAP material data from Palantir Foundry and importing it into the product ticket
 */
const MARASearchPopup = ({ onClose, onApprove }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [sapData, setSapData] = useState(null);
  const [mappedFields, setMappedFields] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [multipleResults, setMultipleResults] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [detectedType, setDetectedType] = useState(null);
  const [currentSearchType, setCurrentSearchType] = useState(null);
  const [currentSearchValue, setCurrentSearchValue] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  /**
   * Auto-detect search type based on input pattern
   * - CAS Number: XXX-XX-X format (e.g., 865-50-9, 7732-18-5)
   * - Part Number: Alphanumeric (e.g., 176036, Q64577, PMC9000, X87655)
   * - Product Name: Words with only letters (e.g., Iodomethane, Vitamin B)
   */
  const detectSearchType = (value) => {
    if (!value || value.trim() === '') {
      return null;
    }

    const trimmed = value.trim();

    // CAS Number pattern: digits-digits-digit (e.g., 865-50-9)
    const casPattern = /^\d{1,7}-\d{2}-\d$/;
    if (casPattern.test(trimmed)) {
      return 'casNumber';
    }

    // Part Number pattern: letters followed by numbers, or purely numeric
    // Examples: 176036, Q64577, PMC9000, X87655
    // No spaces allowed, optional -BULK suffix
    const partNumberPattern = /^[A-Z]*\d+(-BULK)?$/i;
    if (partNumberPattern.test(trimmed)) {
      return 'partNumber';
    }

    // Product Name: contains only letters (and spaces/hyphens)
    // If it contains numbers but didn't match part number pattern, still treat as product name
    const hasNumbers = /\d/.test(trimmed);
    if (!hasNumbers) {
      return 'productName';
    }

    // Default to product name for edge cases
    return 'productName';
  };

  // Update detected type whenever search term changes
  useEffect(() => {
    const type = detectSearchType(searchTerm);
    setDetectedType(type);
  }, [searchTerm]);

  // Randomly display funny loading messages while searching
  useEffect(() => {
    if (!searching) return;

    // Set initial random message
    setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);

    const interval = setInterval(() => {
      // Pick a random message each time
      const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
      setLoadingMessage(LOADING_MESSAGES[randomIndex]);
    }, 1500); // Change message every 1.5 seconds

    return () => clearInterval(interval);
  }, [searching]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    const searchType = detectSearchType(searchTerm);
    if (!searchType) {
      toast.error('Unable to determine search type');
      return;
    }

    setSearching(true);
    setSapData(null);
    setMappedFields(null);
    setMetadata(null);
    setMultipleResults(null);
    setSelectedResult(null);
    setOffset(0); // Reset pagination for new search
    setHasMore(false);

    try {
      const typeLabel = searchType === 'partNumber' ? 'Part Number' :
                        searchType === 'productName' ? 'Product Name' : 'CAS Number';
      console.log(`[SAP Search] Auto-detected type: ${typeLabel}, Value: ${searchTerm.trim()}`);

      // Save search parameters for "Load More"
      setCurrentSearchType(searchType);
      setCurrentSearchValue(searchTerm.trim());

      // Search Palantir Foundry for SAP material data
      const response = await productAPI.searchMARA(searchType, searchTerm.trim(), { limit: 10, offset: 0 });

      if (response.data.success) {
        if (response.data.multipleResults) {
          // Multiple results - show selection UI
          setMultipleResults(response.data.results);
          setHasMore(response.data.hasMore || false);
          setOffset(response.data.results.length); // Set offset to number of results loaded
          toast.success(response.data.message);
        } else {
          // Single result - show mapped fields
          setSapData(response.data.data);
          setMappedFields(response.data.mappedFields);
          setMetadata(response.data.metadata || {});
          toast.success(response.data.message);
        }
      } else {
        toast.error(response.data.message || 'No data found');
      }
    } catch (error) {
      console.error('[SAP Search] Error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to search SAP data';
      toast.error(errorMsg);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = async (partNumber) => {
    // Clear the list immediately and show loading state for better UX
    setMultipleResults(null);
    setSearching(true);

    try {
      console.log(`[SAP Search] Loading full data for selected part number: ${partNumber}`);
      const response = await productAPI.searchMARA('partNumber', partNumber);

      if (response.data.success && !response.data.multipleResults) {
        setSapData(response.data.data);
        setMappedFields(response.data.mappedFields);
        setMetadata(response.data.metadata || {});
        toast.success(`Loaded data for ${partNumber}`);
      }
    } catch (error) {
      console.error('[SAP Search] Error loading result:', error);
      toast.error('Failed to load selected result');
    } finally {
      setSearching(false);
    }
  };

  const handleLoadMore = async () => {
    if (!currentSearchType || !currentSearchValue) {
      console.error('[SAP Search] No search params saved for Load More');
      return;
    }

    setSearching(true);
    try {
      console.log(`[SAP Search] Loading more results - Offset: ${offset}, Type: ${currentSearchType}`);
      const response = await productAPI.searchMARA(
        currentSearchType,
        currentSearchValue,
        { limit: 10, offset: offset }
      );

      if (response.data.success && response.data.multipleResults) {
        // Append new results to existing
        setMultipleResults([...multipleResults, ...response.data.results]);
        setHasMore(response.data.hasMore || false);
        setOffset(offset + response.data.results.length);
        toast.success(`Loaded ${response.data.results.length} more results`);
      }
    } catch (error) {
      console.error('[SAP Search] Load More error:', error);
      toast.error('Failed to load more results');
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
      onApprove(mappedFields, metadata);
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
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter part number, product name, or CAS number..."
                  className="form-input w-full pr-32"
                  disabled={searching}
                />
                {detectedType && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      detectedType === 'partNumber' ? 'bg-blue-100 text-blue-800' :
                      detectedType === 'productName' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {detectedType === 'partNumber' ? '🔢 Part #' :
                       detectedType === 'productName' ? '📦 Product' :
                       '🧪 CAS'}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {!detectedType && (
                  <span>Search by product name, CAS number, or part number</span>
                )}
                {detectedType === 'partNumber' && (
                  <span className="text-blue-600">Detected: Part Number — "-BULK" will be auto-appended</span>
                )}
                {detectedType === 'productName' && (
                  <span className="text-purple-600">Detected: Product Name — partial match search</span>
                )}
                {detectedType === 'casNumber' && (
                  <span className="text-green-600">Detected: CAS Number — exact match search</span>
                )}
              </div>
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
          {!sapData && !searching && !multipleResults && (
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
              <p className="mt-4 text-lg">Enter search criteria above to search for SAP data</p>
            </div>
          )}

          {searching && (
            <div className="text-center py-12">
              <svg className="animate-spin h-12 w-12 text-millipore-blue mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-gray-600 font-medium">Searching Palantir Foundry...</p>
              <p className="mt-2 text-millipore-blue text-sm italic animate-pulse">
                {loadingMessage}
              </p>
            </div>
          )}

          {/* Multiple Results Selection */}
          {multipleResults && !mappedFields && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  Found {multipleResults.length} Results
                </h3>
                <p className="text-sm text-yellow-700">
                  Select a product to view its full details and import data:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {multipleResults.map((result, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-300 rounded-lg p-4 hover:border-millipore-blue hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleSelectResult(result.partNumber)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{result.productName}</h4>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Part #:</span> {result.partNumber}
                          </div>
                          <div>
                            <span className="font-medium">CAS:</span>{' '}
                            {result.casNumber ? (
                              result.casNumber
                            ) : (
                              <span className="text-red-400 italic text-xs">CAS Missing</span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Brand:</span> {result.brand}
                          </div>
                          <div>
                            <span className="font-medium">SBU:</span> {result.sbu}
                          </div>
                        </div>
                      </div>
                      <svg className="w-6 h-6 text-millipore-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={searching}
                    className="btn btn-secondary px-6 py-2"
                  >
                    {searching ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      'Load More (10)'
                    )}
                  </button>
                </div>
              )}
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
