import React, { useState, useEffect } from 'react';
import unspscDataFiltered from '../../data/unspsc-codes.json';

/**
 * UNSPSC Code Selector Component
 * Provides a hierarchical selector for UNSPSC codes
 * Segments → Families → Classes → Commodities
 */
const UNSPSCSelector = ({ isOpen, onClose, onSelect, currentValue }) => {
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [allCategoriesData, setAllCategoriesData] = useState(null);
  const [loadingAll, setLoadingAll] = useState(false);

  // Get current data source based on toggle
  const currentData = showAllCategories && allCategoriesData ? allCategoriesData : unspscDataFiltered;
  const segments = Object.values(currentData.segments || {});

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      // If there's a current value, try to parse and select it
      if (currentValue) {
        const code = currentValue.split(' - ')[0];
        parseAndSelectCode(code);
      }
    }
  }, [isOpen, currentValue]);

  // Load all categories data when toggled
  const handleToggleAllCategories = async () => {
    if (!showAllCategories && !allCategoriesData) {
      setLoadingAll(true);
      try {
        const allData = await import('../../data/unspsc-codes-all.json');
        setAllCategoriesData(allData.default);
        setShowAllCategories(true);
      } catch (error) {
        console.error('Failed to load all categories:', error);
      } finally {
        setLoadingAll(false);
      }
    } else {
      setShowAllCategories(!showAllCategories);
    }
    // Reset selections when toggling
    setSelectedSegment(null);
    setSelectedFamily(null);
    setSelectedClass(null);
    setSelectedCommodity(null);
  };

  // Parse a code and select the appropriate items
  const parseAndSelectCode = (code) => {
    const segmentCode = code.substring(0, 8);
    const familyCode = code.substring(0, 8);
    const classCode = code.substring(0, 8);

    const segment = segments.find(s => s.code === segmentCode);
    if (segment) {
      setSelectedSegment(segment);
      // Continue parsing if longer code
    }
  };

  // Handle segment selection
  const handleSegmentSelect = (segment) => {
    setSelectedSegment(segment);
    setSelectedFamily(null);
    setSelectedClass(null);
    setSelectedCommodity(null);
  };

  // Handle family selection
  const handleFamilySelect = (family) => {
    setSelectedFamily(family);
    setSelectedClass(null);
    setSelectedCommodity(null);
  };

  // Handle class selection
  const handleClassSelect = (classItem) => {
    setSelectedClass(classItem);
    setSelectedCommodity(null);
  };

  // Handle commodity selection and confirm
  const handleCommoditySelect = (commodity) => {
    setSelectedCommodity(commodity);
    const fullCode = `${commodity.code} - ${commodity.title}`;
    onSelect(fullCode);
    onClose();
  };

  // Filter function for search
  const filterItems = (items, searchTerm) => {
    if (!searchTerm) return items;
    return items.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.includes(searchTerm)
    );
  };

  if (!isOpen) return null;

  const families = selectedSegment ? Object.values(selectedSegment.families || {}) : [];
  const classes = selectedFamily ? Object.values(selectedFamily.classes || {}) : [];
  const commodities = selectedClass ? Object.values(selectedClass.commodities || {}) : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  UNSPSC Code Selector
                  <span className="ml-2 text-sm font-normal text-blue-200">v260801</span>
                </h3>
                <div className="mt-2 flex items-center gap-4">
                  <p className="text-sm text-blue-100">
                    {showAllCategories ? 'Showing all categories' : 'Showing life science categories'}
                  </p>
                  <button
                    onClick={handleToggleAllCategories}
                    disabled={loadingAll}
                    className="text-xs text-white hover:text-blue-100 underline transition-colors flex items-center gap-1"
                  >
                    {loadingAll ? (
                      <>
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : showAllCategories ? (
                      'Show life science categories only'
                    ) : (
                      'Show all UNSPSC categories'
                    )}
                  </button>
                </div>
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
            <input
              type="text"
              placeholder="Search by code or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Breadcrumb navigation */}
          <div className="px-6 py-3 bg-gray-100 border-b border-gray-200">
            <div className="flex items-center text-sm">
              <button
                onClick={() => {
                  setSelectedSegment(null);
                  setSelectedFamily(null);
                  setSelectedClass(null);
                  setSelectedCommodity(null);
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Segments
              </button>
              {selectedSegment && (
                <>
                  <span className="mx-2 text-gray-400">/</span>
                  <button
                    onClick={() => {
                      setSelectedFamily(null);
                      setSelectedClass(null);
                      setSelectedCommodity(null);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {selectedSegment.title}
                  </button>
                </>
              )}
              {selectedFamily && (
                <>
                  <span className="mx-2 text-gray-400">/</span>
                  <button
                    onClick={() => {
                      setSelectedClass(null);
                      setSelectedCommodity(null);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {selectedFamily.title}
                  </button>
                </>
              )}
              {selectedClass && (
                <>
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-700 font-medium">{selectedClass.title}</span>
                </>
              )}
            </div>
          </div>

          {/* Content area */}
          <div className="px-6 py-4" style={{ minHeight: '400px', maxHeight: '500px', overflowY: 'auto' }}>
            {/* Segments view */}
            {!selectedSegment && (
              <div className="grid grid-cols-1 gap-3">
                {filterItems(segments, searchTerm).map((segment) => (
                  <button
                    key={segment.code}
                    onClick={() => handleSegmentSelect(segment)}
                    className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-blue-700">
                        {segment.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{segment.code}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Families view */}
            {selectedSegment && !selectedFamily && (
              <div className="grid grid-cols-1 gap-3">
                {filterItems(families, searchTerm).map((family) => (
                  <button
                    key={family.code}
                    onClick={() => handleFamilySelect(family)}
                    className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-blue-700">
                        {family.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{family.code}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Classes view */}
            {selectedFamily && !selectedClass && (
              <div className="grid grid-cols-1 gap-3">
                {filterItems(classes, searchTerm).map((classItem) => (
                  <button
                    key={classItem.code}
                    onClick={() => handleClassSelect(classItem)}
                    className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-blue-700">
                        {classItem.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{classItem.code}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Commodities view */}
            {selectedClass && (
              <div className="grid grid-cols-1 gap-2">
                {filterItems(commodities, searchTerm).map((commodity) => (
                  <button
                    key={commodity.code}
                    onClick={() => handleCommoditySelect(commodity)}
                    className="flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
                  >
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-green-700">
                        {commodity.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{commodity.code}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {!selectedSegment && `${segments.length} segments available`}
                {selectedSegment && !selectedFamily && `${families.length} families in ${selectedSegment.title}`}
                {selectedFamily && !selectedClass && `${classes.length} classes in ${selectedFamily.title}`}
                {selectedClass && `${commodities.length} commodities in ${selectedClass.title}`}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

export default UNSPSCSelector;
