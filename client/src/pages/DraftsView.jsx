import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import {
  PencilIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { StatusBadge, PriorityBadge } from '../components/badges';
import toast from 'react-hot-toast';

const DraftsView = () => {
  const { user, isPMOPS, isAdmin } = useAuth();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSBU, setFilterSBU] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchDrafts();
  }, [currentPage, filterSBU]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        status: 'DRAFT'
      };

      if (filterSBU) {
        params.sbu = filterSBU;
      }

      const response = await productAPI.getTickets(params);
      setDrafts(response.data.tickets || []);
      setTotalPages(response.data.totalPages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
      toast.error('Failed to load draft tickets');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown time';

    const now = new Date();
    const time = new Date(timestamp);

    if (isNaN(time.getTime())) {
      return 'Invalid date';
    }

    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) {
      return diffInSeconds <= 10 ? 'just now' : `${diffInSeconds}s ago`;
    }

    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    }

    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }

    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }

    return time.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const filteredDrafts = drafts.filter(draft => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      draft.ticketNumber?.toLowerCase().includes(search) ||
      draft.productName?.toLowerCase().includes(search) ||
      draft.chemicalProperties?.casNumber?.toLowerCase().includes(search) ||
      draft.createdBy?.toLowerCase().includes(search)
    );
  });

  if (!isPMOPS && !isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Access denied. This page is only available to PM-OPS team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <PencilIcon className="h-8 w-8 text-gray-500 mr-3" />
              All Draft Tickets
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              View and manage draft tickets from all users
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Drafts</p>
            <p className="text-3xl font-bold text-gray-900">{total}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by ticket number, product name, CAS, or creator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10 w-full"
                />
              </div>
            </div>

            {/* SBU Filter */}
            <div className="sm:w-48">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={filterSBU}
                  onChange={(e) => {
                    setFilterSBU(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="form-select pl-10 w-full"
                >
                  <option value="">All SBUs</option>
                  <option value="775">SBU 775</option>
                  <option value="P90">SBU P90</option>
                  <option value="440">SBU 440</option>
                  <option value="P87">SBU P87</option>
                  <option value="P89">SBU P89</option>
                  <option value="P85">SBU P85</option>
                </select>
              </div>
            </div>
          </div>

          {searchTerm && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredDrafts.length} of {drafts.length} drafts
            </div>
          )}
        </div>
      </div>

      {/* Drafts List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-millipore-blue"></div>
        </div>
      ) : filteredDrafts.length > 0 ? (
        <div className="card">
          <div className="card-body p-0">
            <div className="divide-y divide-gray-200">
              {filteredDrafts.map((draft) => (
                <Link
                  key={draft._id}
                  to={`/tickets/${draft._id}`}
                  className="block px-6 py-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Ticket Number and Status */}
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {draft.ticketNumber}
                        </h3>
                        <StatusBadge status={draft.status} />
                        {draft.priority && <PriorityBadge priority={draft.priority} />}
                      </div>

                      {/* Product Name */}
                      <p className="text-sm text-gray-900 font-medium mb-1">
                        {draft.productName || draft.chemicalProperties?.casNumber || 'Untitled Draft'}
                      </p>

                      {/* Additional Info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <span className="font-medium text-gray-700">SBU:</span>
                          <span className="ml-1">{draft.sbu}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <span className="font-medium text-gray-700">Created by:</span>
                          <span className="ml-1">
                            {draft.createdByUser
                              ? `${draft.createdByUser.firstName} ${draft.createdByUser.lastName}`
                              : (draft.createdBy || 'Unknown')}
                          </span>
                        </span>
                        <span>•</span>
                        <span>Created {new Date(draft.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span
                          title={draft.updatedAt ? new Date(draft.updatedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          }) : 'Unknown time'}
                          className="cursor-help"
                        >
                          Updated {formatTimeAgo(draft.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="ml-4 flex-shrink-0">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-12">
            <PencilIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No draft tickets found</h3>
            <p className="text-gray-500">
              {searchTerm || filterSBU
                ? 'Try adjusting your filters'
                : 'All users have submitted their tickets'}
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftsView;
