import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  CogIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  ArrowPathIcon,
  KeyIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';
import UserManagement from '../components/admin/UserManagement';
import PermissionsManagement from '../components/admin/PermissionsManagement';
import SystemSettings from '../components/admin/SystemSettings';
import ApiKeyManagement from '../components/admin/ApiKeyManagement';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

// Lazy load Weight Matrix Management to avoid loading until needed
const WeightMatrixManagement = lazy(() => import('../components/admin/WeightMatrixManagement'));

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      toast.error('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'System Overview', icon: ChartBarIcon },
    { id: 'users', name: 'User Management', icon: UserGroupIcon },
    { id: 'permissions', name: 'Permissions', icon: ShieldCheckIcon },
    { id: 'api-keys', name: 'API Keys', icon: KeyIcon },
    { id: 'weight-matrix', name: 'Weight Matrix', icon: ScaleIcon },
    { id: 'system', name: 'System Settings', icon: CogIcon }
  ];

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, onClick }) => (
    <div
      className={`bg-white overflow-hidden shadow rounded-lg ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-8 w-8 text-${color}-600`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate mb-1">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
                  </div>
                )}
              </dd>
              {subtitle && (
                <dd className="text-xs text-gray-500 mt-1">{subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const HealthIndicator = ({ label, status, color }) => {
    const getColorClasses = (color) => {
      switch (color) {
        case 'green': return 'bg-green-100 text-green-800 border-green-200';
        case 'blue': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'orange': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'red': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-700">{label}</span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getColorClasses(color)}`}>
          {status}
        </span>
      </div>
    );
  };

  const renderOverview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-millipore-blue"></div>
        </div>
      );
    }

    if (!stats) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No statistics available</p>
          <button
            onClick={fetchStats}
            className="mt-4 btn btn-primary"
          >
            Retry
          </button>
        </div>
      );
    }

    const { users, tickets, performance, throughput, systemHealth, configuration } = stats;

    return (
      <div className="space-y-6">
        {/* Header with Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={fetchStats}
            className="btn btn-secondary flex items-center space-x-2"
            title="Refresh statistics"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Key Metrics Row 1 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={users.total}
            subtitle={`${users.active} active`}
            icon={UserGroupIcon}
            color="blue"
          />
          <StatCard
            title="Total Tickets"
            value={tickets.total}
            subtitle={`${tickets.active} active`}
            icon={DocumentTextIcon}
            color="purple"
          />
          <Link to="/tickets?status=COMPLETED">
            <StatCard
              title="Completed Tickets"
              value={tickets.completed}
              subtitle={`${performance.completionRate}% success rate`}
              icon={CheckCircleIcon}
              color="green"
            />
          </Link>
          <StatCard
            title="Monthly Rate"
            value={throughput.estimatedMonthlyRate}
            subtitle={`${throughput.completedThisWeek} completed (last 7 days)`}
            icon={ArrowTrendingUpIcon}
            color="indigo"
          />
        </div>

        {/* Key Metrics Row 2 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/tickets?status=SUBMITTED">
            <StatCard
              title="Submitted Tickets"
              value={tickets.byStatus.submitted}
              subtitle="Awaiting action"
              icon={ClockIcon}
              color="yellow"
            />
          </Link>
          <Link to="/tickets?status=IN_PROCESS">
            <StatCard
              title="In Process"
              value={tickets.byStatus.inProcess}
              subtitle="Active work"
              icon={BoltIcon}
              color="blue"
            />
          </Link>
          <StatCard
            title="Backlog Size"
            value={performance.backlogSize}
            subtitle={`${performance.agingTickets} aging`}
            icon={ChartBarIcon}
            color={performance.backlogSize > 30 ? 'orange' : 'blue'}
          />
          <Link to="/tickets?priority=URGENT">
            <StatCard
              title="Urgent Priority"
              value={tickets.byPriority.URGENT}
              subtitle={performance.urgentWaiting > 0 ? `${performance.urgentWaiting} waiting` : 'None waiting'}
              icon={ExclamationTriangleIcon}
              color={performance.urgentWaiting > 0 ? 'red' : 'green'}
            />
          </Link>
        </div>

        {/* System Health Indicators & Performance Metrics */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* System Health Indicators */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">System Health Indicators</h3>
            </div>
            <div className="px-6 py-4 space-y-1">
              <HealthIndicator
                label="Database"
                status={systemHealth.indicators.database.status}
                color={systemHealth.indicators.database.status === 'Healthy' ? 'green' : 'red'}
              />
              <HealthIndicator
                label="Backlog Management"
                status={systemHealth.indicators.backlogManagement}
                color={
                  systemHealth.indicators.backlogManagement === 'Good' ? 'green' :
                  systemHealth.indicators.backlogManagement === 'Fair' ? 'yellow' : 'orange'
                }
              />
              <HealthIndicator
                label="Response Time"
                status={systemHealth.indicators.responseTime}
                color={
                  systemHealth.indicators.responseTime === 'Good' ? 'green' :
                  systemHealth.indicators.responseTime === 'Fair' ? 'yellow' : 'orange'
                }
              />
              <HealthIndicator
                label="Completion Rate"
                status={systemHealth.indicators.completionRate}
                color={
                  systemHealth.indicators.completionRate === 'Excellent' ? 'green' :
                  systemHealth.indicators.completionRate === 'Good' ? 'blue' : 'yellow'
                }
              />
              <HealthIndicator
                label="Urgent Handling"
                status={systemHealth.indicators.urgentHandling}
                color={
                  systemHealth.indicators.urgentHandling === 'Excellent' ? 'green' :
                  systemHealth.indicators.urgentHandling === 'Good' ? 'blue' : 'orange'
                }
              />
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">Average Response Time</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-blue-600">{performance.avgResponseTime.days}</span>
                  <span className="text-sm text-blue-600">days</span>
                </div>
                <p className="text-xs text-blue-500 mt-1">({performance.avgResponseTime.hours} hours)</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-900 mb-1">Average Completion Time</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-green-600">{performance.avgCompletionTime.days}</span>
                  <span className="text-sm text-green-600">days</span>
                </div>
                <p className="text-xs text-green-500 mt-1">({performance.avgCompletionTime.hours} hours)</p>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Completion Rate</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">{performance.completionRate}%</span>
                  <p className="text-xs text-gray-500">vs canceled</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Distribution */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Status Distribution */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Tickets by Status</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              {Object.entries({
                'Draft': tickets.byStatus.draft,
                'Submitted': tickets.byStatus.submitted,
                'In Process': tickets.byStatus.inProcess,
                'NPDI Initiated': tickets.byStatus.npdiInitiated,
                'Completed': tickets.byStatus.completed,
                'Canceled': tickets.byStatus.canceled
              }).map(([status, count]) => {
                const percentage = tickets.total > 0 ? Math.round((count / tickets.total) * 100) : 0;
                const colors = {
                  'Draft': 'bg-gray-500',
                  'Submitted': 'bg-yellow-500',
                  'In Process': 'bg-blue-500',
                  'NPDI Initiated': 'bg-purple-500',
                  'Completed': 'bg-green-500',
                  'Canceled': 'bg-red-500'
                };

                return (
                  <div key={status}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{status}</span>
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${colors[status]} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{percentage}% of total</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SBU Distribution */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Tickets by SBU</h3>
              <p className="text-sm text-gray-500 mt-1">{configuration.totalSBUs} business units</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              {tickets.bySBU.map((sbu, index) => {
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-teal-500'];
                return (
                  <div key={sbu.sbu}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">SBU {sbu.sbu}</span>
                      <span className="text-sm font-semibold text-gray-900">{sbu.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${sbu.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{sbu.percentage}% of total</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* System Configuration */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">System Configuration</h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{users.active}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Form Configurations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{configuration.formConfigs}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Business Units</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{configuration.totalSBUs}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return <UserManagement />;
      case 'permissions':
        return <PermissionsManagement />;
      case 'api-keys':
        return <ApiKeyManagement />;
      case 'weight-matrix':
        return (
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading Weight Matrix...</p>
              </div>
            </div>
          }>
            <WeightMatrixManagement />
          </Suspense>
        );
      case 'system':
        return <SystemSettings />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <WrenchScrewdriverIcon className="h-8 w-8 text-millipore-blue mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">System administration and configuration</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-millipore-blue text-millipore-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
