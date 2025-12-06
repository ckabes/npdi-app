import React, { useState, useEffect } from 'react';

/**
 * Product Hierarchy Selector Component
 * Provides a hierarchical selector for Product Hierarchy PRODH codes
 * Division → Unit → Field → Line → Group → Main Group → PRODH Items (nested levels 1-4)
 */
const ProductHierarchySelector = ({ isOpen, onClose, onSelect, currentValue }) => {
  const [productHierarchyData, setProductHierarchyData] = useState({ divisions: {} });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedMainGroup, setSelectedMainGroup] = useState(null);
  const [prodhPath, setProdhPath] = useState([]); // Array of selected PRODH items
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const divisions = Object.values(productHierarchyData.divisions || {});

  // Fetch product hierarchy data from API
  useEffect(() => {
    const fetchHierarchyData = async () => {
      try {
        setIsLoadingData(true);
        setDataError(null);
        const response = await fetch('http://localhost:5000/api/product-hierarchy/active');
        const data = await response.json();

        if (data.success) {
          setProductHierarchyData(data.data);
        } else {
          setDataError('Failed to load product hierarchy data');
          console.error('Failed to fetch hierarchy:', data.message);
        }
      } catch (error) {
        setDataError('Failed to load product hierarchy data');
        console.error('Error fetching product hierarchy:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchHierarchyData();
  }, []);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      // If there's a current value, try to parse and select it
      if (currentValue) {
        const code = currentValue.split(' - ')[0];
        // Could implement code parsing here if needed
      }
    }
  }, [isOpen, currentValue]);

  // Perform deep search when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      performDeepSearch(searchTerm);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  // Deep search across all levels
  const performDeepSearch = (term) => {
    const results = [];
    const lowerTerm = term.toLowerCase();

    // Helper to search through PRODH tree recursively
    const searchProdhTree = (prodhTree, mainGroup, path, breadcrumb) => {
      if (!prodhTree) return;

      Object.values(prodhTree).forEach(prodhItem => {
        if (
          prodhItem.title?.toLowerCase().includes(lowerTerm) ||
          prodhItem.code?.toLowerCase().includes(lowerTerm)
        ) {
          results.push({
            type: 'prodhItem',
            item: prodhItem,
            mainGroup: mainGroup,
            path: path,
            breadcrumb: `${breadcrumb} / ${mainGroup.title}`
          });
        }

        // Search children recursively
        if (prodhItem.children) {
          searchProdhTree(prodhItem.children, mainGroup, path, breadcrumb);
        }
      });
    };

    // Search through all divisions
    Object.values(productHierarchyData.divisions || {}).forEach(division => {
      Object.values(division.units || {}).forEach(unit => {
        Object.values(unit.fields || {}).forEach(field => {
          Object.values(field.lines || {}).forEach(line => {
            Object.values(line.groups || {}).forEach(group => {
              Object.values(group.mainGroups || {}).forEach(mainGroup => {
                // Search PRODH items (final selectable items)
                const breadcrumb = `${division.title} / ${unit.title} / ${field.title} / ${line.title} / ${group.title}`;
                searchProdhTree(
                  mainGroup.prodhTree,
                  mainGroup,
                  [division, unit, field, line, group],
                  breadcrumb
                );
              });
            });
          });
        });
      });

      // Also search at higher levels for navigation
      Object.values(division.units || {}).forEach(unit => {
        if (unit.title.toLowerCase().includes(lowerTerm) || unit.code.toLowerCase().includes(lowerTerm)) {
          results.push({
            type: 'unit',
            item: unit,
            path: [division],
            breadcrumb: division.title
          });
        }
      });
    });

    // Limit results to prevent performance issues
    setSearchResults(results.slice(0, 100));
  };

  // Handle division selection
  const handleDivisionSelect = (division) => {
    setSelectedDivision(division);
    setSelectedUnit(null);
    setSelectedField(null);
    setSelectedLine(null);
    setSelectedGroup(null);
    setSelectedMainGroup(null);
    setProdhPath([]);
    setSearchTerm('');
  };

  // Handle unit selection
  const handleUnitSelect = (unit) => {
    setSelectedUnit(unit);
    setSelectedField(null);
    setSelectedLine(null);
    setSelectedGroup(null);
    setSelectedMainGroup(null);
    setProdhPath([]);
    setSearchTerm('');
  };

  // Handle field selection
  const handleFieldSelect = (field) => {
    setSelectedField(field);
    setSelectedLine(null);
    setSelectedGroup(null);
    setSelectedMainGroup(null);
    setProdhPath([]);
    setSearchTerm('');
  };

  // Handle line selection
  const handleLineSelect = (line) => {
    setSelectedLine(line);
    setSelectedGroup(null);
    setSelectedMainGroup(null);
    setProdhPath([]);
    setSearchTerm('');
  };

  // Handle group selection
  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedMainGroup(null);
    setProdhPath([]);
    setSearchTerm('');
  };

  // Handle main group selection (shows PRODH items)
  const handleMainGroupSelect = (mainGroup) => {
    setSelectedMainGroup(mainGroup);
    setProdhPath([]);
    setSearchTerm('');
  };

  // Handle PRODH item navigation
  const handleProdhItemSelect = (prodhItem) => {
    // Add this item to the path
    setProdhPath([...prodhPath, prodhItem]);
    setSearchTerm('');
  };

  // Handle final PRODH item selection (confirm)
  const handleProdhItemConfirm = (prodhItem) => {
    // Return full GPH data including SBU for SIAL hierarchy auto-population
    const gphData = {
      prodh12: prodhItem.prodh12 || prodhItem.code,
      prodhSBU: prodhItem.prodhSBU,
      title: prodhItem.title,
      validCombination: prodhItem.validCombination
    };
    onSelect(gphData);
    onClose();
  };

  // Handle search result selection
  const handleSearchResultSelect = (result) => {
    if (result.type === 'prodhItem') {
      const hasChildren = result.item.children && Object.keys(result.item.children).length > 0;

      if (hasChildren) {
        // Navigate to this item in the hierarchy
        setSelectedDivision(result.path[0]);
        setSelectedUnit(result.path[1]);
        setSelectedField(result.path[2]);
        setSelectedLine(result.path[3]);
        setSelectedGroup(result.path[4]);
        setSelectedMainGroup(result.mainGroup);

        // Build the path to this item
        const pathToItem = [];
        let currentItem = result.item;
        // Since we can't easily rebuild the path, just navigate to the parent level
        setSearchTerm('');
      } else {
        // Leaf node - select it
        handleProdhItemConfirm(result.item);
      }
    } else if (result.type === 'unit') {
      setSelectedDivision(result.path[0]);
      setSelectedUnit(result.item);
      setSearchTerm('');
    }
  };

  if (!isOpen) return null;

  // Show loading state while fetching data
  if (isLoadingData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product hierarchy...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if data failed to load
  if (dataError) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative z-10">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Data</h3>
            <p className="text-gray-600 mb-4">{dataError}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const units = selectedDivision ? Object.values(selectedDivision.units || {}) : [];
  const fields = selectedUnit ? Object.values(selectedUnit.fields || {}) : [];
  const lines = selectedField ? Object.values(selectedField.lines || {}) : [];
  const groups = selectedLine ? Object.values(selectedLine.groups || {}) : [];
  const mainGroups = selectedGroup ? Object.values(selectedGroup.mainGroups || {}) : [];

  // Get current PRODH items to display based on path
  let currentProdhItems = [];
  if (selectedMainGroup) {
    if (prodhPath.length === 0) {
      // Show root level PRODH items
      currentProdhItems = Object.values(selectedMainGroup.prodhTree || {});
    } else {
      // Show children of the last item in path
      const lastItem = prodhPath[prodhPath.length - 1];
      currentProdhItems = Object.values(lastItem.children || {});
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500/75 z-0"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl relative z-10">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Product Hierarchy Selector
                </h3>
                <p className="text-sm text-purple-100 mt-1">
                  Navigate to PRODH code from Life Science Product Hierarchy
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by PRODH code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <p className="mt-2 text-xs text-gray-600">
                Searching product hierarchy database
              </p>
            )}
          </div>

          {/* Breadcrumb navigation */}
          {!searchTerm && (
            <div className="px-6 py-3 bg-gray-100 border-b border-gray-200">
              <div className="flex items-center text-sm flex-wrap">
                <button
                  onClick={() => {
                    setSelectedDivision(null);
                    setSelectedUnit(null);
                    setSelectedField(null);
                    setSelectedLine(null);
                    setSelectedGroup(null);
                    setSelectedMainGroup(null);
                    setProdhPath([]);
                  }}
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  Business Division
                </button>
                {selectedDivision && (
                  <>
                    <span className="mx-2 text-gray-400">/</span>
                    <button
                      onClick={() => {
                        setSelectedUnit(null);
                        setSelectedField(null);
                        setSelectedLine(null);
                        setSelectedGroup(null);
                        setSelectedMainGroup(null);
                        setProdhPath([]);
                      }}
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {selectedDivision.title}
                    </button>
                  </>
                )}
                {selectedUnit && (
                  <>
                    <span className="mx-2 text-gray-400">/</span>
                    <button
                      onClick={() => {
                        setSelectedField(null);
                        setSelectedLine(null);
                        setSelectedGroup(null);
                        setSelectedMainGroup(null);
                        setProdhPath([]);
                      }}
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {selectedUnit.title}
                    </button>
                  </>
                )}
                {selectedField && (
                  <>
                    <span className="mx-2 text-gray-400">/</span>
                    <button
                      onClick={() => {
                        setSelectedLine(null);
                        setSelectedGroup(null);
                        setSelectedMainGroup(null);
                        setProdhPath([]);
                      }}
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {selectedField.title}
                    </button>
                  </>
                )}
                {selectedLine && (
                  <>
                    <span className="mx-2 text-gray-400">/</span>
                    <button
                      onClick={() => {
                        setSelectedGroup(null);
                        setSelectedMainGroup(null);
                        setProdhPath([]);
                      }}
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {selectedLine.title}
                    </button>
                  </>
                )}
                {selectedGroup && (
                  <>
                    <span className="mx-2 text-gray-400">/</span>
                    <button
                      onClick={() => {
                        setSelectedMainGroup(null);
                        setProdhPath([]);
                      }}
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {selectedGroup.title}
                    </button>
                  </>
                )}
                {selectedMainGroup && (
                  <>
                    <span className="mx-2 text-gray-400">/</span>
                    <button
                      onClick={() => setProdhPath([])}
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {selectedMainGroup.title}
                    </button>
                  </>
                )}
                {prodhPath.map((prodhItem, index) => (
                  <React.Fragment key={prodhItem.code}>
                    <span className="mx-2 text-gray-400">/</span>
                    <button
                      onClick={() => setProdhPath(prodhPath.slice(0, index + 1))}
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {prodhItem.title}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Content area */}
          <div className="px-6 py-4" style={{ minHeight: '400px', maxHeight: '500px', overflowY: 'auto' }}>
            {/* Search results */}
            {searchTerm && searchResults.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 mb-3">
                  Found {searchResults.length} results {searchResults.length >= 100 && '(showing first 100)'}
                </div>
                {searchResults.map((result, index) => {
                  const isProdhItem = result.type === 'prodhItem';
                  const hasChildren = isProdhItem && result.item.children && Object.keys(result.item.children).length > 0;
                  const isSelectable = isProdhItem && !hasChildren;

                  return (
                    <button
                      key={`${result.item.code}-${index}`}
                      onClick={() => handleSearchResultSelect(result)}
                      className={`w-full flex items-start justify-between p-3 text-left border rounded-lg transition-all group ${
                        isSelectable
                          ? 'border-gray-200 hover:border-green-500 hover:bg-green-50'
                          : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                      }`}
                    >
                      <div className="flex-1">
                        {isSelectable && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                              Selectable
                            </span>
                            {result.item.prodhSBU && (
                              <span className="text-xs text-gray-500">SBU: {result.item.prodhSBU}</span>
                            )}
                          </div>
                        )}
                        <div className={`font-medium group-hover:text-${isSelectable ? 'green' : 'purple'}-700`}>
                          {result.item.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          {isProdhItem ? `PRODH12: ${result.item.prodh12 || result.item.code}` : result.item.code}
                        </div>
                        {!isSelectable && isProdhItem && result.item.prodhSBU && (
                          <div className="text-xs text-gray-400 mt-1">
                            SBU: {result.item.prodhSBU}
                          </div>
                        )}
                        {result.breadcrumb && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            {result.breadcrumb}
                          </div>
                        )}
                      </div>
                      <svg className={`w-5 h-5 text-gray-400 group-hover:text-${isSelectable ? 'green' : 'purple'}-600 flex-shrink-0 mt-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isSelectable ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        )}
                      </svg>
                    </button>
                  );
                })}
              </div>
            )}

            {/* No search results */}
            {searchTerm && searchResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg font-medium mb-1">No results found</p>
                <p className="text-sm">Try a different search term or browse categories manually</p>
              </div>
            )}

            {/* Divisions view */}
            {!searchTerm && !selectedDivision && (
              <div className="grid grid-cols-1 gap-3">
                {divisions.map((division) => (
                  <button
                    key={division.code}
                    onClick={() => handleDivisionSelect(division)}
                    className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                  >
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-purple-700">
                        {division.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{division.code}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Units view */}
            {!searchTerm && selectedDivision && !selectedUnit && (
              <div className="grid grid-cols-1 gap-3">
                {units.map((unit) => (
                  <button
                    key={unit.code}
                    onClick={() => handleUnitSelect(unit)}
                    className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                  >
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-purple-700">
                        {unit.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{unit.code}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Fields view */}
            {!searchTerm && selectedUnit && !selectedField && (
              <div className="grid grid-cols-1 gap-3">
                {fields.map((field) => (
                  <button
                    key={field.code}
                    onClick={() => handleFieldSelect(field)}
                    className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                  >
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-purple-700">
                        {field.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{field.code}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Lines view */}
            {!searchTerm && selectedField && !selectedLine && (
              <div className="grid grid-cols-1 gap-3">
                {lines.map((line) => (
                  <button
                    key={line.code}
                    onClick={() => handleLineSelect(line)}
                    className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                  >
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-purple-700">
                        {line.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{line.code}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Groups view */}
            {!searchTerm && selectedLine && !selectedGroup && (
              <div className="grid grid-cols-1 gap-3">
                {groups.map((group) => (
                  <button
                    key={group.code}
                    onClick={() => handleGroupSelect(group)}
                    className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                  >
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-purple-700">
                        {group.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{group.code}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Main Groups view (navigate to PRODH items) */}
            {!searchTerm && selectedGroup && !selectedMainGroup && (
              <div className="grid grid-cols-1 gap-2">
                {mainGroups.map((mainGroup) => (
                  <button
                    key={mainGroup.code}
                    onClick={() => handleMainGroupSelect(mainGroup)}
                    className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                  >
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-purple-700">
                        {mainGroup.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 font-mono">{mainGroup.code}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* PRODH Items view (final selection) */}
            {!searchTerm && selectedMainGroup && (
              <div className="grid grid-cols-1 gap-2">
                {currentProdhItems.length > 0 ? (
                  currentProdhItems.map((prodhItem) => {
                    const hasChildren = prodhItem.children && Object.keys(prodhItem.children).length > 0;

                    // If has children, show as navigation item only
                    if (hasChildren) {
                      return (
                        <button
                          key={prodhItem.code}
                          onClick={() => handleProdhItemSelect(prodhItem)}
                          className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                        >
                          <div>
                            <div className="font-medium text-gray-900 group-hover:text-purple-700">
                              {prodhItem.title}
                            </div>
                            <div className="text-sm text-gray-500 mt-1 font-mono">
                              PRODH12: {prodhItem.prodh12 || prodhItem.code}
                            </div>
                            {prodhItem.prodhSBU && (
                              <div className="text-xs text-gray-400 mt-1">
                                SBU: {prodhItem.prodhSBU}
                              </div>
                            )}
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      );
                    }

                    // If no children, show as selectable (leaf node)
                    return (
                      <button
                        key={prodhItem.code}
                        onClick={() => handleProdhItemConfirm(prodhItem)}
                        className="flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                              Selectable
                            </span>
                            {prodhItem.prodhSBU && (
                              <span className="text-xs text-gray-500">
                                SBU: {prodhItem.prodhSBU}
                              </span>
                            )}
                          </div>
                          <div className="font-medium text-gray-900 group-hover:text-green-700">
                            {prodhItem.title}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 font-mono">
                            PRODH12: {prodhItem.prodh12 || prodhItem.code}
                          </div>
                          {prodhItem.validCombination && (
                            <div className="text-xs text-gray-400 mt-1">
                              Valid: {prodhItem.validCombination}
                            </div>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No PRODH items available for this Main Group</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {searchTerm ? (
                  `Searching product hierarchy`
                ) : (
                  <>
                    {!selectedDivision && `${divisions.length} business divisions available`}
                    {selectedDivision && !selectedUnit && `${units.length} business units in ${selectedDivision.title}`}
                    {selectedUnit && !selectedField && `${fields.length} business fields in ${selectedUnit.title}`}
                    {selectedField && !selectedLine && `${lines.length} business lines in ${selectedField.title}`}
                    {selectedLine && !selectedGroup && `${groups.length} product groups in ${selectedLine.title}`}
                    {selectedGroup && !selectedMainGroup && `${mainGroups.length} main groups in ${selectedGroup.title}`}
                    {selectedMainGroup && `${currentProdhItems.length} PRODH items available`}
                  </>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductHierarchySelector;
