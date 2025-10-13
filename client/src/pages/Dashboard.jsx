import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  CheckIcon
} from '@heroicons/react/24/outline';
import { StatusBadge, PriorityBadge } from '../components/badges';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, isPMOPS } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentTickets, setRecentTickets] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentTickets();
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

  const fetchRecentTickets = async () => {
    try {
      // Fetch recent tickets (last 5)
      const response = await productAPI.getTickets({ page: 1, limit: 5 });
      setRecentTickets(response.data.tickets || []);

      // Fetch recent activity (status changes, comments, edits)
      const activityResponse = await productAPI.getRecentActivity({ limit: 10 });
      setRecentActivity(activityResponse.data.activities || []);
    } catch (error) {
      console.error('Failed to fetch recent tickets:', error);
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
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
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
          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
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
          </div>

          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
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
          </div>

          <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
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
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
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
          </div>
        </div>

        {/* Key Metrics Row 2 - Performance Indicators */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="card-body">
              <p className="text-xs font-medium text-gray-500 uppercase">Urgent Priority</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{statusCounts.urgent}</p>
              <p className="text-xs text-gray-500 mt-1">Requires immediate attention</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <p className="text-xs font-medium text-gray-500 uppercase">Total Backlog</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{performance.backlogSize}</p>
              <p className="text-xs text-gray-500 mt-1">Submitted + In Process</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <p className="text-xs font-medium text-gray-500 uppercase">This Week</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{throughput.completedThisWeek}</p>
              <p className="text-xs text-gray-500 mt-1">Completed tickets</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <p className="text-xs font-medium text-gray-500 uppercase">Monthly Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{throughput.estimatedMonthlyRate}</p>
              <p className="text-xs text-gray-500 mt-1">Estimated throughput</p>
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
      </div>
    );
  }

  // Default dashboard for Product Managers and others
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-600">{formatRoleName(user?.role)}</p>
            </div>
            <Link
              to="/tickets/new"
              className="btn btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Ticket
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats for Product Managers */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/tickets?status=DRAFT" className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <p className="text-xs font-medium text-gray-500 uppercase">Draft Tickets</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts.draft}</p>
          </div>
        </Link>

        <Link to="/tickets?status=SUBMITTED" className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <p className="text-xs font-medium text-gray-500 uppercase">Submitted</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts.submitted}</p>
          </div>
        </Link>

        <Link to="/tickets?status=IN_PROCESS" className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <p className="text-xs font-medium text-gray-500 uppercase">In Process</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts.inProcess}</p>
          </div>
        </Link>

        <Link to="/tickets?status=COMPLETED" className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <p className="text-xs font-medium text-gray-500 uppercase">Completed</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts.completed}</p>
          </div>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Tickets */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Tickets</h3>
              <Link to="/tickets" className="text-sm text-millipore-blue hover:text-millipore-blue-dark">
                View All →
              </Link>
            </div>
          </div>
          <div className="card-body p-0">
            {recentTickets.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentTickets.map((ticket) => (
                  <Link
                    key={ticket._id}
                    to={`/tickets/${ticket._id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {ticket.ticketNumber}
                          </p>
                          <StatusBadge status={ticket.status} />
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {ticket.productName || ticket.chemicalProperties?.casNumber || 'Untitled'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <p>No tickets yet</p>
                <Link to="/tickets/new" className="text-millipore-blue hover:text-millipore-blue-dark text-sm mt-2 inline-block">
                  Create your first ticket
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              <Link to="/tickets" className="text-sm text-millipore-blue hover:text-millipore-blue-dark">
                View All →
              </Link>
            </div>
          </div>
          <div className="card-body p-0">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentActivity.slice(0, 8).map((activity, index) => (
                  <Link
                    key={`${activity.ticketId}-${activity.timestamp}-${index}`}
                    to={`/tickets/${activity.ticketId}`}
                    className={`block px-6 py-4 hover:bg-gray-50 transition-colors border-l-4 ${getActivityBgColor(activity.type)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.ticketNumber}
                          </p>
                          <StatusBadge status={activity.status} />
                          {activity.priority && <PriorityBadge priority={activity.priority} />}
                        </div>
                        <p className="text-sm text-gray-700 mb-1 line-clamp-2">
                          {activity.description}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span className="font-medium">{activity.user}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(activity.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
