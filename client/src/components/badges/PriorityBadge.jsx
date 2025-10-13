import React from 'react';

/**
 * PriorityBadge Component
 * Displays ticket priority with appropriate color coding
 * Used across TicketList and TicketDetails views
 */
const PriorityBadge = ({ priority }) => {
  const priorityClasses = {
    'LOW': 'priority-low',
    'MEDIUM': 'priority-medium',
    'HIGH': 'priority-high',
    'URGENT': 'priority-urgent'
  };

  const badgeClass = priorityClasses[priority] || 'badge bg-gray-100 text-gray-800';

  return (
    <span className={`badge ${badgeClass}`}>
      {priority || 'Unknown'}
    </span>
  );
};

export default PriorityBadge;
