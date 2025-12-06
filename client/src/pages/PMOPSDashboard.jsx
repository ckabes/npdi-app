import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import {
  DocumentIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StatusBadge, PriorityBadge } from '../components/badges';
import toast from 'react-hot-toast';

const PMOPSDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMonthlyRateModal, setShowMonthlyRateModal] = useState(false);
  const [showThisWeekModal, setShowThisWeekModal] = useState(false);
  const [recentlySubmitted, setRecentlySubmitted] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentlySubmittedTickets();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await productAPI.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentlySubmittedTickets = async () => {
    try {
      const response = await productAPI.getTickets({ status: 'SUBMITTED', limit: 5, sort: '-createdAt' });
      setRecentlySubmitted(response.data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch recently submitted tickets:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return `${mins}m ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
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

  const { statusCounts, throughput, performance, priorityCounts, averageTimes, agingAnalysis } = stats;

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
                <p className="text-xs text-green-600 mt-1">Completed tickets</p>
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
                  <tr key={ticket.ticketId || ticket._id} className="hover:bg-red-50">
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SBU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created by</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentlySubmitted.map((ticket) => {
                    const submitterName = ticket.createdByUser
                      ? `${ticket.createdByUser.firstName} ${ticket.createdByUser.lastName}`
                      : (ticket.createdBy || 'Unknown');

                    return (
                      <tr key={ticket._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ticket.ticketNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-[200px] truncate" title={ticket.productName || ticket.chemicalProperties?.casNumber || 'Untitled'}>
                            {ticket.productName || ticket.chemicalProperties?.casNumber || 'Untitled'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.sbu}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="max-w-[150px] truncate" title={submitterName}>
                            {submitterName}
                          </div>
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
            </div>
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
                    <tr key={ticket.ticketId || ticket._id} className="hover:bg-gray-50">
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
              <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No aging tickets - all tickets are being processed efficiently!</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Rate Modal */}
      {showMonthlyRateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-millipore-blue to-blue-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h3 className="text-lg font-bold text-white">Monthly Rate Calculation</h3>
              <button
                onClick={() => setShowMonthlyRateModal(false)}
                className="text-white hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How it's calculated:</h4>
                <p className="text-sm text-gray-700">
                  The monthly rate is an <strong>estimate</strong> of how many tickets could be completed in a month
                  based on the current week's performance.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-800 font-mono">
                  Monthly Rate = (Completed This Week) × 4
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  {throughput.completedThisWeek} tickets × 4 weeks = {throughput.estimatedMonthlyRate} tickets/month
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> This is a rough estimate assuming consistent weekly performance.
                  Actual monthly throughput may vary based on ticket complexity and team availability.
                </p>
              </div>
              <button
                onClick={() => setShowMonthlyRateModal(false)}
                className="w-full btn btn-primary"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* This Week Modal */}
      {showThisWeekModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-millipore-blue to-blue-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h3 className="text-lg font-bold text-white">This Week's Completion</h3>
              <button
                onClick={() => setShowThisWeekModal(false)}
                className="text-white hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What this shows:</h4>
                <p className="text-sm text-gray-700">
                  Number of tickets that were marked as <strong>COMPLETED</strong> in the last 7 days
                  (rolling window).
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-900 mb-1">{throughput.completedThisWeek}</p>
                <p className="text-sm text-green-700">tickets completed</p>
                <p className="text-xs text-green-600 mt-2">in the last 7 days</p>
              </div>
              <div className="text-xs text-gray-600">
                <p>• Tracks team productivity</p>
                <p>• Used to calculate estimated monthly rate</p>
                <p>• Updated in real-time as tickets are completed</p>
              </div>
              <button
                onClick={() => setShowThisWeekModal(false)}
                className="w-full btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PMOPSDashboard;
