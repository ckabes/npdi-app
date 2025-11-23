import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  CheckIcon,
  InformationCircleIcon,
  XMarkIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { StatusBadge, PriorityBadge } from '../components/badges';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, isPMOPS } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myTickets, setMyTickets] = useState([]);
  const [allRecentTickets, setAllRecentTickets] = useState([]);
  const [draftTickets, setDraftTickets] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentlySubmitted, setRecentlySubmitted] = useState([]);
  const [showMonthlyRateModal, setShowMonthlyRateModal] = useState(false);
  const [showThisWeekModal, setShowThisWeekModal] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchMyTickets();
    if (isPMOPS) {
      fetchAllRecentTickets();
      fetchRecentlySubmittedTickets();
    }
    fetchDraftTickets();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await productAPI.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTickets = async () => {
    try {
      // Fetch 5 most recent tickets (excluding drafts)
      const params = {
        page: 1,
        limit: 5, // Show only 5 most recent tickets
        status: 'SUBMITTED,IN_PROCESS,NPDI_INITIATED,COMPLETED',
        // No createdBy filter - show all tickets
        sortBy: 'updatedAt', // Sort by last updated
        sortOrder: 'desc' // Most recent first
      };

      const response = await productAPI.getTickets(params);
      setMyTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch my tickets:', error);
    }
  };

  const fetchAllRecentTickets = async () => {
    try {
      // For PMOps: fetch all tickets in the system (excluding drafts)
      const params = {
        page: 1,
        limit: 10,
        status: 'SUBMITTED,IN_PROCESS,NPDI_INITIATED,COMPLETED',
        // No createdBy filter - show all tickets
        sortBy: 'updatedAt', // Sort by last updated
        sortOrder: 'desc' // Most recent first
      };

      const response = await productAPI.getTickets(params);
      setAllRecentTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch all recent tickets:', error);
    }
  };

  const fetchRecentlySubmittedTickets = async () => {
    try {
      // For PMOps: fetch the 5 most recently submitted tickets
      const params = {
        page: 1,
        limit: 5,
        status: 'SUBMITTED',
        sortBy: 'createdAt', // Sort by creation date
        sortOrder: 'desc' // Most recent first
      };

      const response = await productAPI.getTickets(params);
      setRecentlySubmitted(response.data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch recently submitted tickets:', error);
    }
  };

  const fetchDraftTickets = async () => {
    try {
      // Fetch draft tickets for the current user
      const response = await productAPI.getTickets({
        page: 1,
        limit: 5,
        status: 'DRAFT',
        sortBy: 'updatedAt', // Sort by last updated
        sortOrder: 'desc' // Most recent first
      });
      setDraftTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch draft tickets:', error);
    }
  };

  const formatRoleName = (role) => {
    if (!role) return '';
    // Convert PRODUCT_MANAGER to Product Manager
    return role.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'STATUS_CHANGE':
        return <ArrowPathIcon className="h-5 w-5 text-blue-600" />;
      case 'COMMENT_ADDED':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-green-600" />;
      case 'TICKET_EDIT':
        return <PencilIcon className="h-5 w-5 text-orange-600" />;
      case 'SKU_ASSIGNMENT':
        return <CheckIcon className="h-5 w-5 text-purple-600" />;
      case 'TICKET_CREATED':
        return <PlusIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityBgColor = (activityType) => {
    switch (activityType) {
      case 'STATUS_CHANGE':
        return 'bg-blue-50 border-blue-200';
      case 'COMMENT_ADDED':
        return 'bg-green-50 border-green-200';
      case 'TICKET_EDIT':
        return 'bg-orange-50 border-orange-200';
      case 'SKU_ASSIGNMENT':
        return 'bg-purple-50 border-purple-200';
      case 'TICKET_CREATED':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown time';

    const now = new Date();
    const time = new Date(timestamp);

    // Check if timestamp is valid
    if (isNaN(time.getTime())) {
      console.error('Invalid timestamp:', timestamp);
      return 'Invalid date';
    }

    const diffInSeconds = Math.floor((now - time) / 1000);

    // Less than 1 minute
    if (diffInSeconds < 60) {
      return diffInSeconds <= 10 ? 'just now' : `${diffInSeconds}s ago`;
    }

    // Less than 1 hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    }

    // Less than 24 hours
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }

    // Less than 7 days
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }

    // More than 7 days - show actual date
    return time.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-millipore-blue"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No statistics available</p>
      </div>
    );
  }

  const { statusCounts, priorityCounts, averageTimes, agingAnalysis, throughput, performance } = stats;

  // Show PMOps performance dashboard if user is PMOps
  if (isPMOPS) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PMOps Performance Dashboard</h1>
          <p className="text-gray-600">Monitor ticket performance and team efficiency</p>
        </div>

        {/* Key Metrics Row 1 - Status Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/tickets?status=SUBMITTED"
            className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-600 uppercase">Awaiting Action</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">{statusCounts.submitted}</p>
                  <p className="text-xs text-yellow-600 mt-1">SUBMITTED tickets</p>
                </div>
                <div className="p-3 bg-yellow-200 rounded-full">
                  <ClockIcon className="h-8 w-8 text-yellow-700" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/tickets?status=IN_PROCESS"
            className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase">In Progress</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{statusCounts.inProcess}</p>
                  <p className="text-xs text-blue-600 mt-1">Active work</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <ChartBarIcon className="h-8 w-8 text-blue-700" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/tickets?status=NPDI_INITIATED"
            className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-600 uppercase">NPDI Initiated</p>
                  <p className="text-3xl font-bold text-orange-900 mt-1">{statusCounts.npdiInitiated}</p>
                  <p className="text-xs text-orange-600 mt-1">Awaiting completion</p>
                </div>
                <div className="p-3 bg-orange-200 rounded-full">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-orange-700" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/tickets?status=COMPLETED"
            className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase">Completed</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{statusCounts.completed}</p>
                  <p className="text-xs text-green-600 mt-1">{performance.completionRate}% success rate</p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <CheckCircleIcon className="h-8 w-8 text-green-700" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Key Metrics Row 2 - Performance Indicators */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/tickets?priority=URGENT"
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="card-body">
              <p className="text-xs font-medium text-gray-500 uppercase">Urgent Priority</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{statusCounts.urgent}</p>
              <p className="text-xs text-gray-500 mt-1">Requires immediate attention</p>
            </div>
          </Link>

          <Link
            to="/tickets?status=SUBMITTED,IN_PROCESS"
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="card-body">
              <p className="text-xs font-medium text-gray-500 uppercase">Total Backlog</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{performance.backlogSize}</p>
              <p className="text-xs text-gray-500 mt-1">Submitted + In Process</p>
            </div>
          </Link>

          <div className="card hover:shadow-lg transition-shadow relative">
            <Link
              to="/tickets?status=COMPLETED"
              className="card-body block"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">This Week</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{throughput.completedThisWeek}</p>
                  <p className="text-xs text-gray-500 mt-1">Completed tickets (last 7 days)</p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowThisWeekModal(true);
                  }}
                  className="text-millipore-blue hover:text-millipore-blue-dark relative z-10"
                  title="Click for details about this metric"
                >
                  <InformationCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </Link>
          </div>

          <div
            onClick={() => setShowMonthlyRateModal(true)}
            className="card hover:shadow-lg transition-shadow cursor-pointer relative"
            title="Estimated monthly throughput based on last 7 days (click for details)"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Monthly Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{throughput.estimatedMonthlyRate}</p>
                  <p className="text-xs text-gray-500 mt-1">Estimated throughput</p>
                </div>
                <InformationCircleIcon className="h-5 w-5 text-millipore-blue" />
              </div>
            </div>
          </div>
        </div>

        {/* Average Processing Times */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Average Processing Times</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">Submission → In Process</p>
                <div className="mt-2">
                  <p className="text-3xl font-bold text-blue-600">{averageTimes.submittedToInProcess.days}</p>
                  <p className="text-sm text-blue-600">days average</p>
                  <p className="text-xs text-blue-500 mt-1">({averageTimes.submittedToInProcess.hours} hours)</p>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm font-medium text-orange-900">Submission → NPDI Initiated</p>
                <div className="mt-2">
                  <p className="text-3xl font-bold text-orange-600">{averageTimes.submittedToNPDI.days}</p>
                  <p className="text-sm text-orange-600">days average</p>
                  <p className="text-xs text-orange-500 mt-1">({averageTimes.submittedToNPDI.hours} hours)</p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-900">Submission → Completed</p>
                <div className="mt-2">
                  <p className="text-3xl font-bold text-green-600">{averageTimes.submittedToCompleted.days}</p>
                  <p className="text-sm text-green-600">days average</p>
                  <p className="text-xs text-green-500 mt-1">({averageTimes.submittedToCompleted.hours} hours)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Tickets Needing Attention */}
        {agingAnalysis.urgentWaiting && agingAnalysis.urgentWaiting.length > 0 && (
          <div className="card bg-red-50 border-red-300">
            <div className="card-header bg-red-100 border-red-300">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-medium text-red-900">Urgent Tickets Waiting</h3>
              </div>
            </div>
            <div className="card-body p-0">
              <table className="min-w-full divide-y divide-red-200">
                <thead className="bg-red-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Ticket</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">SBU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Waiting Time</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-red-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-red-200">
                  {agingAnalysis.urgentWaiting.map((ticket) => (
                    <tr key={ticket.ticketId} className="hover:bg-red-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ticket.ticketNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ticket.sbu}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-red-600">
                          {ticket.waitingDays} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          to={`/tickets/${ticket.ticketId}`}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recently Submitted Tickets */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ClockIcon className="h-6 w-6 text-millipore-blue mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Recently Submitted Tickets</h3>
              </div>
              <Link
                to="/tickets?status=SUBMITTED"
                className="text-sm text-millipore-blue hover:text-millipore-blue-dark font-medium"
              >
                View All Submitted Tickets →
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-1">5 most recently submitted tickets</p>
          </div>
          <div className="card-body p-0">
            {recentlySubmitted && recentlySubmitted.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SBU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentlySubmitted.map((ticket) => {
                    const submitterName = ticket.createdByUser
                      ? `${ticket.createdByUser.firstName} ${ticket.createdByUser.lastName}`
                      : ticket.createdBy || 'Unknown';

                    return (
                      <tr key={ticket._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ticket.ticketNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={ticket.productName || ticket.chemicalProperties?.casNumber || 'Untitled'}>
                            {ticket.productName || ticket.chemicalProperties?.casNumber || 'Untitled'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.sbu}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submitterName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <span className="text-sm text-gray-900">
                              {formatTimeAgo(ticket.createdAt)}
                            </span>
                            <p className="text-xs text-gray-500">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link
                            to={`/tickets/${ticket._id}`}
                            className="text-millipore-blue hover:text-millipore-blue-dark font-medium"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No recently submitted tickets</p>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout for Charts and Tables */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Priority Breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Priority Breakdown</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {Object.entries(priorityCounts).map(([priority, count]) => {
                  const total = Object.values(priorityCounts).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  const colors = {
                    URGENT: 'bg-red-500',
                    HIGH: 'bg-orange-500',
                    MEDIUM: 'bg-yellow-500',
                    LOW: 'bg-green-500'
                  };

                  return (
                    <div key={priority}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <PriorityBadge priority={priority} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${colors[priority]} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{percentage}% of total</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SBU Breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Tickets by SBU</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {stats.sbuBreakdown.map((sbu, index) => {
                  const total = stats.sbuBreakdown.reduce((acc, item) => acc + item.count, 0);
                  const percentage = total > 0 ? Math.round((sbu.count / total) * 100) : 0;
                  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-teal-500'];

                  return (
                    <div key={sbu._id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">SBU {sbu._id}</span>
                        <span className="text-sm font-semibold text-gray-900">{sbu.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{percentage}% of total</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Longest Waiting Tickets */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Aging Tickets (Longest Waiting)</h3>
            <p className="text-sm text-gray-500 mt-1">Tickets waiting for action, sorted by age</p>
          </div>
          <div className="card-body p-0">
            {agingAnalysis.longestWaiting && agingAnalysis.longestWaiting.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SBU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waiting Time</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {agingAnalysis.longestWaiting.map((ticket) => (
                      <tr key={ticket.ticketId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ticket.ticketNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.sbu}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <span className={`text-sm font-bold ${
                              ticket.waitingDays > 7 ? 'text-red-600' :
                              ticket.waitingDays > 3 ? 'text-orange-600' :
                              'text-gray-900'
                            }`}>
                              {ticket.waitingDays} days
                            </span>
                            <p className="text-xs text-gray-500">{ticket.waitingHours} hours</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link
                            to={`/tickets/${ticket.ticketId}`}
                            className="text-millipore-blue hover:text-millipore-blue-dark font-medium"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No aging tickets</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Rate Explanation Modal */}
        {showMonthlyRateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <InformationCircleIcon className="h-6 w-6 text-millipore-blue mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900">Monthly Rate Calculation</h3>
                </div>
                <button
                  onClick={() => setShowMonthlyRateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">How This Metric is Calculated</h4>
                  <p className="text-gray-700">
                    The Monthly Rate represents the estimated number of tickets that can be completed per month
                    based on recent performance trends.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-900 mb-2">Formula:</h5>
                  <code className="text-sm text-blue-800 block bg-white p-3 rounded border border-blue-100">
                    Monthly Rate = (Completed This Week × 52) ÷ 12
                  </code>
                  <p className="text-sm text-blue-700 mt-2">
                    Or approximately: <strong>Completed This Week × 4.33</strong>
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Current Calculation:</h5>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tickets completed this week:</span>
                      <span className="font-semibold text-gray-900">{throughput.completedThisWeek}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Weeks per year:</span>
                      <span className="font-semibold text-gray-900">52</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Months per year:</span>
                      <span className="font-semibold text-gray-900">12</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Estimated Monthly Rate:</span>
                      <span className="text-lg font-bold text-millipore-blue">
                        {throughput.estimatedMonthlyRate} tickets/month
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-semibold text-yellow-900 mb-2">Tickets Used in Calculation:</h5>
                  <p className="text-sm text-yellow-800">
                    This metric is based on tickets with status <strong>COMPLETED</strong> that were
                    completed within the <strong>last 7 days (rolling window)</strong>. The calculation
                    provides an estimate of team throughput and helps forecast capacity planning. The
                    window automatically updates daily to always reflect the most recent 7-day period.
                  </p>
                </div>

                <div className="text-sm text-gray-500">
                  <p>
                    <strong>Note:</strong> This is an estimated projection based on current week's performance.
                    Actual monthly completion rates may vary based on ticket complexity, team availability,
                    and other factors.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowMonthlyRateModal(false)}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* This Week Explanation Modal */}
        {showThisWeekModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <InformationCircleIcon className="h-6 w-6 text-millipore-blue mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900">This Week - Completed Tickets</h3>
                </div>
                <button
                  onClick={() => setShowThisWeekModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">What This Metric Shows</h4>
                  <p className="text-gray-700">
                    This metric displays the number of tickets that were completed within the last 7 days using a <strong>rolling window</strong> calculation.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-900 mb-2">How It Works:</h5>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start">
                      <span className="font-bold mr-2">•</span>
                      <span>Counts tickets with status <strong>COMPLETED</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold mr-2">•</span>
                      <span>Uses the actual completion date from ticket status history</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold mr-2">•</span>
                      <span>Includes only tickets completed in the last 7 days from today</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold mr-2">•</span>
                      <span>The window automatically updates daily (not a calendar week)</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Current Status:</h5>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Tickets completed in last 7 days:</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} - {new Date().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-4xl font-bold text-millipore-blue">
                        {throughput.completedThisWeek}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-semibold text-green-900 mb-2">Rolling Window Explained:</h5>
                  <p className="text-sm text-green-800">
                    Unlike a calendar week (Monday-Sunday), this uses a <strong>rolling 7-day window</strong>.
                    For example, if today is Thursday, it counts tickets completed from last Thursday through today.
                    Tomorrow, it will count from last Friday through tomorrow. This provides a more accurate and
                    consistent measure of recent team performance.
                  </p>
                </div>

                <div className="text-sm text-gray-500">
                  <p>
                    <strong>Note:</strong> This metric updates automatically every time you refresh the dashboard.
                    It reflects real-time completion data based on when tickets transitioned to COMPLETED status.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowThisWeekModal(false)}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default dashboard for Product Managers and others
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-millipore-blue to-blue-600 shadow-lg rounded-lg">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-blue-100 mt-1">{formatRoleName(user?.role)}</p>
            </div>
            <Link
              to="/tickets/new"
              className="bg-white text-millipore-blue hover:bg-gray-100 font-medium py-2 px-4 rounded-lg shadow transition-colors flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Ticket
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats for Product Managers */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/tickets?status=DRAFT" className="card bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Draft Tickets</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.draft}</p>
                <p className="text-xs text-gray-500 mt-1">Work in progress</p>
              </div>
              <div className="p-3 bg-gray-200 rounded-full">
                <PencilIcon className="h-8 w-8 text-gray-700" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/tickets?status=SUBMITTED" className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-600 uppercase">Submitted</p>
                <p className="text-3xl font-bold text-yellow-900 mt-1">{statusCounts.submitted}</p>
                <p className="text-xs text-yellow-600 mt-1">Awaiting review</p>
              </div>
              <div className="p-3 bg-yellow-200 rounded-full">
                <ClockIcon className="h-8 w-8 text-yellow-700" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/tickets?status=IN_PROCESS,NPDI_INITIATED" className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase">In Process</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{statusCounts.inProcess + statusCounts.npdiInitiated}</p>
                <p className="text-xs text-blue-600 mt-1">In Process + NPDI Initiated</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <ChartBarIcon className="h-8 w-8 text-blue-700" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/tickets?status=COMPLETED" className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 uppercase">Completed</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{statusCounts.completed}</p>
                <p className="text-xs text-green-600 mt-1">Successfully done</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <CheckCircleIcon className="h-8 w-8 text-green-700" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My Tickets - TOP SECTION */}
        <div className="card border-t-4 border-t-blue-500">
          <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DocumentIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">My Tickets</h3>
              </div>
              <Link to="/tickets" className="text-sm text-millipore-blue hover:text-millipore-blue-dark">
                View All →
              </Link>
            </div>
          </div>
          <div className="card-body p-0">
            {myTickets.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {myTickets.map((ticket) => (
                  <Link
                    key={ticket._id}
                    to={`/tickets/${ticket._id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors border-l-4 border-blue-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <ClockIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            {ticket.ticketNumber}
                          </p>
                          <StatusBadge status={ticket.status} />
                          {ticket.priority && <PriorityBadge priority={ticket.priority} />}
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          {ticket.productName || ticket.chemicalProperties?.casNumber || 'Untitled'}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>SBU {ticket.sbu}</span>
                          <span>•</span>
                          <span
                            title={ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            }) : 'Unknown time'}
                            className="cursor-help"
                          >
                            Updated {formatTimeAgo(ticket.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No tickets found</p>
                <button
                  onClick={() => navigate('/tickets/new')}
                  className="mt-3 text-sm text-millipore-blue hover:text-millipore-blue-dark font-medium"
                >
                  Create New Ticket →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* My Drafts Section */}
        <div className="card border-t-4 border-t-gray-400">
          <div className="card-header bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <PencilIcon className="h-6 w-6 text-gray-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">My Drafts</h3>
              </div>
              <Link to="/tickets?status=DRAFT" className="text-sm text-millipore-blue hover:text-millipore-blue-dark">
                View All →
              </Link>
            </div>
          </div>
          <div className="card-body p-0">
            {draftTickets.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {draftTickets.map((ticket) => (
                  <Link
                    key={ticket._id}
                    to={`/tickets/${ticket._id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors border-l-4 border-gray-300"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <PencilIcon className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            {ticket.ticketNumber}
                          </p>
                          <StatusBadge status={ticket.status} />
                          {ticket.priority && <PriorityBadge priority={ticket.priority} />}
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          {ticket.productName || ticket.chemicalProperties?.casNumber || 'Untitled Draft'}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Last updated {formatTimeAgo(ticket.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <PencilIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No draft tickets</p>
                <button
                  onClick={() => navigate('/tickets/new')}
                  className="mt-3 text-sm text-millipore-blue hover:text-millipore-blue-dark font-medium"
                >
                  Create New Ticket →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Tickets - PMOps Only */}
        {isPMOPS && (
          <div className="card border-t-4 border-t-green-500">
            <div className="card-header bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ChartBarIcon className="h-6 w-6 text-green-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Recent Tickets (All Users)</h3>
                </div>
                <Link to="/tickets" className="text-sm text-millipore-blue hover:text-millipore-blue-dark">
                  View All →
                </Link>
              </div>
            </div>
            <div className="card-body p-0">
              {allRecentTickets.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {allRecentTickets.map((ticket) => (
                    <Link
                      key={ticket._id}
                      to={`/tickets/${ticket._id}`}
                      className="block px-6 py-4 hover:bg-gray-50 transition-colors border-l-4 border-green-200"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <DocumentIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              {ticket.ticketNumber}
                            </p>
                            <StatusBadge status={ticket.status} />
                            {ticket.priority && <PriorityBadge priority={ticket.priority} />}
                          </div>
                          <p className="text-sm text-gray-700 mb-1">
                            {ticket.productName || ticket.chemicalProperties?.casNumber || 'Untitled'}
                          </p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            {ticket.createdBy && (
                              <>
                                <span className="font-medium">{ticket.createdBy}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>SBU {ticket.sbu}</span>
                            <span>•</span>
                            <span
                              title={ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              }) : 'Unknown time'}
                              className="cursor-help"
                            >
                              Updated {formatTimeAgo(ticket.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <DocumentIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No recent tickets</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
