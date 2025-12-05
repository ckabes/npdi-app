import React from 'react';

/**
 * EmptyState Component
 *
 * Reusable empty state display with optional icon, title, message, and action button.
 * Provides consistent UI for "no data" states across the application.
 *
 * @param {Object} props
 * @param {React.Component} props.icon - Heroicon component to display
 * @param {string} props.title - Main title text
 * @param {string} props.message - Optional descriptive message
 * @param {React.Node} props.action - Optional action button or element
 * @param {string} props.className - Additional CSS classes for container
 *
 * @example
 * <EmptyState
 *   icon={DocumentIcon}
 *   title="No tickets found"
 *   message="Try adjusting your search or filters"
 *   action={<button onClick={handleCreate}>Create Ticket</button>}
 * />
 */
const EmptyState = ({ icon: Icon, title, message, action, className = '' }) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <Icon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
      )}
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      {message && (
        <p className="mt-1 text-sm text-gray-500">{message}</p>
      )}
      {action && (
        <div className="mt-6">{action}</div>
      )}
    </div>
  );
};

export default EmptyState;
