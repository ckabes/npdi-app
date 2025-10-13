import React from 'react';

/**
 * StatusBadge Component
 * Displays ticket status with appropriate color coding
 * Used across TicketList and TicketDetails views
 */
const StatusBadge = ({ status }) => {
  const badgeClasses = {
    'DRAFT': 'badge-draft',
    'SUBMITTED': 'badge badge-submitted',
    'IN_PROCESS': 'badge-in-process',
    'NPDI_INITIATED': 'badge-npdi-initiated',
    'COMPLETED': 'badge-completed',
    'CANCELED': 'badge-canceled'
  };

  const displayText = status ? status.replace('_', ' ') : 'Unknown';
  const badgeClass = badgeClasses[status] || 'badge bg-gray-100 text-gray-800';

  return (
    <span className={`badge ${badgeClass}`}>
      {displayText}
    </span>
  );
};

export default StatusBadge;
