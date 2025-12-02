import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { businessLineAPI } from '../../services/api';

/**
 * Autocomplete component for business lines
 * Supports searching by both business line code and description
 */
const BusinessLineAutocomplete = ({
  value = '',
  onChange,
  onBlur,
  placeholder = 'Search business line or description...',
  disabled = false,
  className = '',
  required = false
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [businessLines, setBusinessLines] = useState([]);
  const [filteredBusinessLines, setFilteredBusinessLines] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch business lines on mount
  useEffect(() => {
    fetchBusinessLines();
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBusinessLines = async () => {
    try {
      setIsLoading(true);
      const response = await businessLineAPI.getActive();

      if (response.data?.success && response.data?.data) {
        setBusinessLines(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching business lines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter business lines based on input
  const filterBusinessLines = (searchValue) => {
    if (!searchValue.trim()) {
      return businessLines.slice(0, 50); // Show first 50 when no search
    }

    const searchLower = searchValue.toLowerCase();

    // Search by both code and description
    const filtered = businessLines.filter(businessLine =>
      businessLine.code.toLowerCase().includes(searchLower) ||
      businessLine.description.toLowerCase().includes(searchLower)
    );

    return filtered.slice(0, 50); // Limit to 50 results
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);

    // Filter business lines
    const filtered = filterBusinessLines(newValue);
    setFilteredBusinessLines(filtered);

    // Call onChange with the raw input value
    if (onChange) {
      onChange({ target: { value: newValue } });
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    const filtered = filterBusinessLines(inputValue);
    setFilteredBusinessLines(filtered);
  };

  const handleSelectBusinessLine = (businessLine) => {
    const selectedValue = `${businessLine.code} - ${businessLine.description}`;
    setInputValue(selectedValue);
    setIsOpen(false);
    setSelectedIndex(-1);

    if (onChange) {
      onChange({ target: { value: selectedValue } });
    }

    // Trigger blur event
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        const filtered = filterBusinessLines(inputValue);
        setFilteredBusinessLines(filtered);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredBusinessLines.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredBusinessLines[selectedIndex]) {
          handleSelectBusinessLine(filteredBusinessLines[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleBlur = (e) => {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      if (onBlur) {
        onBlur(e);
      }
    }, 200);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`form-input ${className}`}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && filteredBusinessLines.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredBusinessLines.map((businessLine, index) => (
            <div
              key={businessLine._id}
              onClick={() => handleSelectBusinessLine(businessLine)}
              className={`px-4 py-2 cursor-pointer ${
                index === selectedIndex
                  ? 'bg-blue-100 text-blue-900'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="font-medium text-sm text-gray-900">
                {businessLine.code}
              </div>
              <div className="text-xs text-gray-600 truncate">
                {businessLine.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && !disabled && !isLoading && inputValue && filteredBusinessLines.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-4">
          <div className="text-center text-gray-500 text-sm">
            No business lines found
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessLineAutocomplete;
