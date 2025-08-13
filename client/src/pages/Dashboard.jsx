import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { productAPI } from '../services/api';
import {
  DocumentIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color, href }) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600',
    yellow: 'bg-yellow-500 text-yellow-600',
    green: 'bg-green-500 text-green-600',
    red: 'bg-red-500 text-red-600',
    gray: 'bg-gray-500 text-gray-600'
  };

  const bgColor = colorClasses[color] || colorClasses.gray;

  const content = (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg ${bgColor.split(' ')[0]} bg-opacity-20`}>
              <Icon className={`h-6 w-6 ${bgColor.split(' ')[1]}`} />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return href ? <Link to={href}>{content}</Link> : content;
};

const Dashboard = () => {
  const { user, isProductManager } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await productAPI.getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Use mock data if API fails
        setStats({
          statusCounts: {
            draft: 5,
            inProcess: 8,
            completed: 12,
            canceled: 2,
            total: 27
          },
          sbuBreakdown: [
            { _id: 'Life Science', count: 15 },
            { _id: 'Process Solutions', count: 8 },
            { _id: 'Electronics', count: 4 }
          ],
          priorityBreakdown: [
            { _id: 'HIGH', count: 6 },
            { _id: 'MEDIUM', count: 15 },
            { _id: 'LOW', count: 6 }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-millipore-blue"></div>
      </div>
    );
  }

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
              <p className="text-gray-600">
                {isProductManager 
                  ? `Product Manager - ${user?.sbu}` 
                  : `${user?.role.replace('_', ' ')}`
                }
              </p>
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

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Draft Tickets"
          value={stats?.statusCounts?.draft || 0}
          icon={DocumentIcon}
          color="gray"
          href="/tickets?status=DRAFT"
        />
        <StatCard
          title="Submitted"
          value={stats?.statusCounts?.submitted || 0}
          icon={DocumentIcon}
          color="blue"
          href="/tickets?status=SUBMITTED"
        />
        <StatCard
          title="In Process"
          value={stats?.statusCounts?.inProcess || 0}
          icon={ClockIcon}
          color="yellow"
          href="/tickets?status=IN_PROCESS"
        />
        <StatCard
          title="Completed"
          value={stats?.statusCounts?.completed || 0}
          icon={CheckCircleIcon}
          color="green"
          href="/tickets?status=COMPLETED"
        />
        <StatCard
          title="Total Tickets"
          value={stats?.statusCounts?.total || 0}
          icon={DocumentIcon}
          color="blue"
          href="/tickets"
        />
      </div>

      {/* PMOps Assigned Tickets - Highlighted Section */}
      {user?.role === 'PM_OPS' && user?.sbu === '775' && stats?.sarahTickets && (
        <div className="mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-white/10 rounded-full"></div>
            <div className="relative">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">My Assigned Tickets</h2>
                  <p className="text-purple-100">SBU 775 tickets automatically assigned to {user?.firstName} {user?.lastName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  🎯 Priority Focus
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  📊 Real-time Updates
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Draft (775)"
              value={stats.sarahTickets.draft || 0}
              icon={DocumentIcon}
              color="gray"
              href="/tickets?status=DRAFT&assigned=me"
            />
            <StatCard
              title="⚠️ Submitted (775)"
              value={stats.sarahTickets.submitted || 0}
              icon={DocumentIcon}
              color="blue"
              href="/tickets?status=SUBMITTED&assigned=me"
            />
            <StatCard
              title="In Process (775)"
              value={stats.sarahTickets.inProcess || 0}
              icon={ClockIcon}
              color="yellow"
              href="/tickets?status=IN_PROCESS&assigned=me"
            />
            <StatCard
              title="Completed (775)"
              value={stats.sarahTickets.completed || 0}
              icon={CheckCircleIcon}
              color="green"
              href="/tickets?status=COMPLETED&assigned=me"
            />
            <StatCard
              title="Total Assigned"
              value={stats.sarahTickets.total || 0}
              icon={DocumentIcon}
              color="blue"
              href="/tickets?assigned=me"
            />
          </div>
          
          {/* Action Needed Banner */}
          {stats.sarahTickets.submitted > 0 && (
            <div className="mt-6 bg-yellow-100 border border-yellow-300 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Action Required
                  </h3>
                  <div className="mt-1 text-sm text-yellow-700">
                    You have <strong>{stats.sarahTickets.submitted}</strong> submitted ticket{stats.sarahTickets.submitted !== 1 ? 's' : ''} waiting for SKU assignment.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SBU Breakdown */}
      {stats?.sbuBreakdown && stats.sbuBreakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Tickets by SBU</h3>
                {user?.role === 'PM_OPS' && (
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    Sarah's View
                  </span>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {stats.sbuBreakdown.map((sbu, index) => (
                  <div key={index} className={`flex items-center justify-between p-2 rounded ${sbu._id === '775' && user?.role === 'PM_OPS' ? 'bg-purple-50 border-l-4 border-purple-500' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700">SBU {sbu._id}</span>
                      {sbu._id === '775' && user?.role === 'PM_OPS' && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                          Your Assignment
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{sbu.count} tickets</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Priority Breakdown</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {stats.priorityBreakdown.map((priority, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {priority._id?.toLowerCase() || 'Unassigned'}
                    </span>
                    <span className={`badge priority-${priority._id?.toLowerCase() || 'medium'}`}>
                      {priority.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/tickets/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <PlusIcon className="h-8 w-8 text-millipore-blue mr-3" />
              <div>
                <p className="font-medium text-gray-900">Create New Ticket</p>
                <p className="text-sm text-gray-500">Start a new product development request</p>
              </div>
            </Link>
            
            <Link
              to="/tickets"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DocumentIcon className="h-8 w-8 text-millipore-blue mr-3" />
              <div>
                <p className="font-medium text-gray-900">View All Tickets</p>
                <p className="text-sm text-gray-500">Browse and search existing tickets</p>
              </div>
            </Link>

            <Link
              to="/profile"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="h-8 w-8 bg-millipore-blue rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Update Profile</p>
                <p className="text-sm text-gray-500">Manage your account settings</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;