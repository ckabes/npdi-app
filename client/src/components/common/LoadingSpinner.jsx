import React from 'react';

/**
 * LoadingSpinner Component
 *
 * Reusable loading spinner with customizable size and optional message.
 * Eliminates duplicate loading state UI across the application.
 *
 * @param {Object} props
 * @param {string} props.size - Size of spinner: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} props.message - Optional message to display below spinner
 * @param {string} props.className - Additional CSS classes for container
 *
 * @example
 * // Basic usage
 * if (loading) return <LoadingSpinner />;
 *
 * @example
 * // With message and custom size
 * if (loading) return <LoadingSpinner size="lg" message="Loading tickets..." />;
 */
const LoadingSpinner = ({ size = 'md', message, className = '' }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`flex items-center justify-center h-64 ${className}`}>
      <div className="text-center">
        <div
          className={`animate-spin rounded-full border-b-2 border-millipore-blue ${sizes[size]} mx-auto`}
          role="status"
          aria-label="Loading"
        />
        {message && (
          <p className="mt-4 text-gray-500 text-sm">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
