import React from 'react';

/**
 * Badge Component Library
 *
 * Reusable badge components for roles, statuses, and other categorical data.
 * Eliminates duplicate badge rendering logic across the application.
 */

// Role styling configuration
const roleStyles = {
  'PRODUCT_MANAGER': 'bg-blue-100 text-blue-800 border-blue-200',
  'PM_OPS': 'bg-purple-100 text-purple-800 border-purple-200',
  'ADMIN': 'bg-red-100 text-red-800 border-red-200'
};

// Role label mapping
const roleLabels = {
  'PRODUCT_MANAGER': 'Product Manager',
  'PM_OPS': 'PM Ops',
  'ADMIN': 'Administrator'
};

/**
 * RoleBadge Component
 *
 * Displays a user's role with appropriate styling
 *
 * @param {Object} props
 * @param {string} props.role - User role (PRODUCT_MANAGER, PM_OPS, ADMIN)
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * <RoleBadge role="PRODUCT_MANAGER" />
 */
export const RoleBadge = ({ role, className = '' }) => {
  const styles = roleStyles[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  const label = roleLabels[role] || role;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}
    >
      {label}
    </span>
  );
};

/**
 * ActiveStatusBadge Component
 *
 * Displays active/inactive status with appropriate styling
 *
 * @param {Object} props
 * @param {boolean} props.isActive - Whether the item is active
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * <ActiveStatusBadge isActive={true} />
 */
export const ActiveStatusBadge = ({ isActive, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        isActive
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-gray-100 text-gray-800 border-gray-200'
      } ${className}`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
};

/**
 * GenericBadge Component
 *
 * Generic badge with customizable color and text
 *
 * @param {Object} props
 * @param {string} props.text - Badge text
 * @param {string} props.color - Color scheme (blue, green, red, yellow, purple, gray)
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * <GenericBadge text="New" color="blue" />
 */
export const GenericBadge = ({ text, color = 'gray', className = '' }) => {
  const colorStyles = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  const styles = colorStyles[color] || colorStyles.gray;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}
    >
      {text}
    </span>
  );
};

// Export default object with all badge components
export default {
  RoleBadge,
  ActiveStatusBadge,
  GenericBadge
};
