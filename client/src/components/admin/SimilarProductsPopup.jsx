import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { productAPI } from '../../services/api';

/**
 * Similar Products Search Popup Component
 * Searches Palantir Foundry for products with the same CAS number
 * Maximum 20 second search, initially shows 3 results with option to load more
 */
const SimilarProductsPopup = ({ casNumber, onClose, onApprove }) => {
  const [searching, setSearching] = useState(false);
  const [foundProducts, setFoundProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [searchComplete, setSearchComplete] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [maxResults, setMaxResults] = useState(3);
  const [hasMoreResults, setHasMoreResults] = useState(false);

  useEffect(() => {
    // Auto-start search when popup opens
    handleSearch(3);
  }, []);

  const handleSearch = async (resultsToFetch = maxResults) => {
    setSearching(true);
    // Only clear products if this is the initial search
    if (resultsToFetch === 3) {
      setFoundProducts([]);
      setSelectedProducts(new Set());
    }
    setSearchComplete(false);
    setSearchTime(0);
    setTimedOut(false);

    const startTime = Date.now();
    const maxSearchTime = 20000; // 20 seconds

    try {
      console.log(`[Similar Products] Starting search for CAS: ${casNumber}, fetching ${resultsToFetch} results`);

      // Start the search with polling logic
      const response = await productAPI.searchSimilarProducts(casNumber, {
        maxResults: resultsToFetch,
        maxSearchTime: maxSearchTime
      });

      const elapsed = Date.now() - startTime;
      setSearchTime(Math.round(elapsed / 1000));

      if (response.data.success) {
        const products = response.data.products || [];
        setFoundProducts(products);

        // Check if we got exactly the number requested (might be more available)
        // If we got fewer than requested, we've reached the end
        setHasMoreResults(products.length === resultsToFetch);

        if (products.length === 0) {
          setTimedOut(true);
          toast.info(`No similar products found in ${Math.round(elapsed / 1000)} seconds`);
        } else if (products.length < 3) {
          toast.success(`Found ${products.length} similar product${products.length === 1 ? '' : 's'}`);
        } else {
          toast.success(`Found ${products.length} similar product${products.length === 1 ? '' : 's'}`);
        }
      } else {
        toast.error(response.data.message || 'Search failed');
      }
    } catch (error) {
      console.error('[Similar Products] Search error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Search failed';
      toast.error(errorMsg);
    } finally {
      setSearching(false);
      setSearchComplete(true);
    }
  };

  const toggleProductSelection = (matnr) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(matnr)) {
      newSelection.delete(matnr);
    } else {
      newSelection.add(matnr);
    }
    setSelectedProducts(newSelection);
  };

  const handleLoadMore = async () => {
    const newMaxResults = maxResults + 3;
    setMaxResults(newMaxResults);
    await handleSearch(newMaxResults);
  };

  const handleApprove = () => {
    if (selectedProducts.size === 0) {
      toast.error('Please select at least one product');
      return;
    }

    // Convert selected material numbers to comma-separated string
    const selectedMATNRs = Array.from(selectedProducts).join(', ');
    onApprove(selectedMATNRs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-3xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Similar Products Search</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Searching for products with CAS number: <span className="font-mono font-semibold text-millipore-blue">{casNumber}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Status */}
          {searching && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-5 w-5 text-millipore-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">Searching Palantir Foundry...</p>
                  <p className="text-xs text-gray-600">
                    {maxResults === 3
                      ? 'Maximum 20 seconds, fetching first 3 results'
                      : `Fetching up to ${maxResults} results...`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {searchComplete && (
            <>
              {foundProducts.length === 0 ? (
                <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 mb-1">No similar products found</p>
                  <p className="text-sm text-gray-600">
                    No other products with CAS {casNumber} were found in {searchTime} seconds
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-sm text-gray-700 mb-3">
                    Found <span className="font-semibold">{foundProducts.length}</span> product{foundProducts.length === 1 ? '' : 's'} in {searchTime} seconds. Select products to include:
                  </p>

                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            Select
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Material Number
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product Name
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {foundProducts.map((product) => (
                          <tr
                            key={product.MATNR}
                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                              selectedProducts.has(product.MATNR) ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => toggleProductSelection(product.MATNR)}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedProducts.has(product.MATNR)}
                                onChange={() => toggleProductSelection(product.MATNR)}
                                className="h-4 w-4 text-millipore-blue focus:ring-millipore-blue border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-mono text-sm font-medium text-gray-900">
                                {product.MATNR}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-900">
                                {product.TEXT_SHORT || 'No name available'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedProducts.size > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-1">Selected material numbers:</p>
                      <p className="text-sm font-mono text-gray-900">
                        {Array.from(selectedProducts).join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Load More Button */}
                  {hasMoreResults && !searching && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={handleLoadMore}
                        className="btn btn-secondary inline-flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Load 3 More Products</span>
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Currently showing {foundProducts.length} products
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            {foundProducts.length > 0 && (
              <button
                onClick={handleApprove}
                disabled={selectedProducts.size === 0}
                className={`btn ${
                  selectedProducts.size === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                Use Selected ({selectedProducts.size})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimilarProductsPopup;
