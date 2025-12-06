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
  KeyIcon,
  ScaleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import UserManagement from '../components/admin/UserManagement';
import PermissionsManagement from '../components/admin/PermissionsManagement';
import SystemSettings from '../components/admin/SystemSettings';
import ApiKeyManagement from '../components/admin/ApiKeyManagement';
import HelpDocumentation from '../components/admin/HelpDocumentation';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../utils/AuthContext';

// Lazy load Weight Matrix Management to avoid loading until needed
const WeightMatrixManagement = lazy(() => import('../components/admin/WeightMatrixManagement'));

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndicator, setSelectedIndicator] = useState(null);

  // Load thresholds from localStorage or use defaults
  const getDefaultThresholds = () => ({
    backlogManagement: { good: 20, fair: 40 },
    responseTime: { good: 48, fair: 96 },
    completionTime: { good: 100, fair: 150 },
    urgentHandling: { excellent: 0, good: 3 }
  });

  const [thresholds, setThresholds] = useState(() => {
    const saved = localStorage.getItem('healthIndicatorThresholds');
    return saved ? JSON.parse(saved) : getDefaultThresholds();
  });

  useEffect(() => {
    if (activeTab === 'overview' && user) {
      fetchStats();
    }
  }, [activeTab, user]);

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
    { id: 'system', name: 'System Settings', icon: CogIcon },
    { id: 'help', name: 'Help', icon: QuestionMarkCircleIcon }
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

  const HealthIndicator = ({ label, status, color, onClick }) => {
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
      <div
        className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded transition-colors"
        onClick={onClick}
        title="Click for details"
      >
        <span className="text-sm text-gray-700">{label}</span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getColorClasses(color)}`}>
          {status}
        </span>
      </div>
    );
  };

  const HealthIndicatorModal = ({ indicator, stats, onClose }) => {
    if (!indicator || !stats) return null;

    const [editMode, setEditMode] = useState(false);
    const [editedThresholds, setEditedThresholds] = useState(thresholds[indicator] || {});

    const handleSaveThresholds = () => {
      const newThresholds = { ...thresholds, [indicator]: editedThresholds };
      setThresholds(newThresholds);
      localStorage.setItem('healthIndicatorThresholds', JSON.stringify(newThresholds));
      setEditMode(false);
      toast.success('Thresholds updated successfully');
    };

    const handleResetThresholds = () => {
      const defaults = getDefaultThresholds();
      setEditedThresholds(defaults[indicator]);
    };

    const getIndicatorDetails = () => {
      const { performance, systemHealth, tickets } = stats;

      switch (indicator) {
        case 'database':
          return {
            title: 'Database Health',
            currentValue: systemHealth.indicators.database.status,
            description: 'Indicates whether the database connection is active and responsive.',
            calculation: 'Database health is determined by the ability to query the database successfully.',
            metrics: [
              { label: 'Connection Status', value: 'Connected', detail: 'Successfully querying database' },
              { label: 'Response Time', value: systemHealth.indicators.database.responseTime, detail: 'Query execution speed' }
            ],
            thresholds: [
              { label: 'Healthy', condition: 'Database is accessible and responding', color: 'green' },
              { label: 'Unhealthy', condition: 'Cannot connect or query timeout', color: 'red' }
            ]
          };

        case 'backlogManagement':
          const backlogSize = performance.backlogSize;
          const backlogThresholds = editMode ? editedThresholds : thresholds.backlogManagement;
          return {
            title: 'Backlog Management',
            currentValue: systemHealth.indicators.backlogManagement,
            description: 'Measures the current workload based on tickets awaiting action or in progress.',
            calculation: 'Backlog Size = Submitted Tickets + In Process Tickets',
            metrics: [
              { label: 'Submitted Tickets', value: tickets.byStatus.submitted, detail: 'Tickets awaiting action' },
              { label: 'In Process Tickets', value: tickets.byStatus.inProcess, detail: 'Tickets being actively worked' },
              { label: 'Total Backlog', value: backlogSize, detail: 'Combined workload', highlight: true }
            ],
            thresholds: [
              { label: 'Good', condition: `Backlog < ${backlogThresholds.good} tickets`, color: 'green', editable: true, key: 'good' },
              { label: 'Fair', condition: `Backlog ${backlogThresholds.good}-${backlogThresholds.fair - 1} tickets`, color: 'yellow', editable: true, key: 'fair' },
              { label: 'Needs Attention', condition: `Backlog ≥ ${backlogThresholds.fair} tickets`, color: 'orange', editable: false }
            ]
          };

        case 'responseTime':
          const avgHours = performance.avgResponseTime.hours;
          const avgDays = performance.avgResponseTime.days;
          const responseThresholds = editMode ? editedThresholds : thresholds.responseTime;
          return {
            title: 'Response Time',
            currentValue: systemHealth.indicators.responseTime,
            description: 'Average time from ticket submission to when work begins (IN_PROCESS status).',
            calculation: 'Average time between SUBMITTED and IN_PROCESS status across all processed tickets',
            metrics: [
              { label: 'Average Response Time', value: `${avgDays} days`, detail: `${avgHours} hours`, highlight: true },
              { label: 'Measurement Period', value: 'All time', detail: 'Based on historical ticket data' }
            ],
            thresholds: [
              { label: 'Good', condition: `< ${responseThresholds.good} hours (${responseThresholds.good / 24} days)`, color: 'green', editable: true, key: 'good' },
              { label: 'Fair', condition: `${responseThresholds.good}-${responseThresholds.fair} hours (${responseThresholds.good / 24}-${responseThresholds.fair / 24} days)`, color: 'yellow', editable: true, key: 'fair' },
              { label: 'Slow', condition: `≥ ${responseThresholds.fair} hours (${responseThresholds.fair / 24}+ days)`, color: 'orange', editable: false }
            ]
          };

        case 'completionTime':
          const avgCompletionDays = performance.avgCompletionTime.days;
          const avgCompletionHours = performance.avgCompletionTime.hours;
          const currentThresholds = editMode ? editedThresholds : thresholds.completionTime;

          return {
            title: 'Completion Time',
            currentValue: systemHealth.indicators.completionTime,
            description: 'Average time from ticket submission to completion.',
            calculation: 'Average time between SUBMITTED and COMPLETED status across all completed tickets',
            metrics: [
              { label: 'Average Completion Time', value: `${avgCompletionDays} days`, detail: `${avgCompletionHours} hours`, highlight: true },
              { label: 'Target', value: `< ${currentThresholds.good} days`, detail: 'Goal for ticket completion' },
              { label: 'Measurement Period', value: 'All time', detail: 'Based on historical ticket data' }
            ],
            thresholds: [
              { label: 'Good', condition: `< ${currentThresholds.good} days`, color: 'green', editable: true, key: 'good' },
              { label: 'Fair', condition: `${currentThresholds.good}-${currentThresholds.fair} days`, color: 'yellow', editable: true, key: 'fair' },
              { label: 'Slow', condition: `≥ ${currentThresholds.fair} days`, color: 'orange', editable: false }
            ]
          };

        case 'urgentHandling':
          const urgentWaiting = performance.urgentWaiting;
          const totalUrgent = tickets.byPriority.URGENT;
          const urgentThresholds = editMode ? editedThresholds : thresholds.urgentHandling;
          return {
            title: 'Urgent Handling',
            currentValue: systemHealth.indicators.urgentHandling,
            description: 'Number of urgent priority tickets waiting more than 1 day for action.',
            calculation: 'Count of URGENT tickets that have been waiting > 24 hours',
            metrics: [
              { label: 'Total Urgent Tickets', value: totalUrgent, detail: 'All urgent priority tickets' },
              { label: 'Urgent Waiting > 1 Day', value: urgentWaiting, detail: 'Requires immediate attention', highlight: true }
            ],
            thresholds: [
              { label: 'Excellent', condition: `${urgentThresholds.excellent} urgent tickets waiting`, color: 'green', editable: true, key: 'excellent' },
              { label: 'Good', condition: `< ${urgentThresholds.good} urgent tickets waiting`, color: 'blue', editable: true, key: 'good' },
              { label: 'Needs Attention', condition: `≥ ${urgentThresholds.good} urgent tickets waiting`, color: 'orange', editable: false }
            ]
          };

        default:
          return null;
      }
    };

    const details = getIndicatorDetails();
    if (!details) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-millipore-blue to-blue-600 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{details.title}</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Current Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Current Status</span>
                <span className="text-2xl font-bold text-blue-600">{details.currentValue}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">What This Measures</h3>
              <p className="text-sm text-gray-700">{details.description}</p>
            </div>

            {/* Calculation */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">How It's Calculated</h3>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <code className="text-sm text-gray-800">{details.calculation}</code>
              </div>
            </div>

            {/* Current Metrics */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Metrics</h3>
              <div className="space-y-2">
                {details.metrics.map((metric, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      metric.highlight ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className={`text-sm ${metric.highlight ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {metric.label}
                      </div>
                      {metric.detail && (
                        <div className="text-xs text-gray-500 mt-0.5">{metric.detail}</div>
                      )}
                    </div>
                    <div className={`text-lg font-bold ${metric.highlight ? 'text-yellow-900' : 'text-gray-900'}`}>
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thresholds */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Status Thresholds</h3>
                {indicator !== 'database' && (
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      editMode
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {editMode ? 'Cancel' : 'Edit Thresholds'}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {details.thresholds.map((threshold, index) => {
                  const colorClasses = {
                    green: 'bg-green-100 border-green-300 text-green-900',
                    blue: 'bg-blue-100 border-blue-300 text-blue-900',
                    yellow: 'bg-yellow-100 border-yellow-300 text-yellow-900',
                    orange: 'bg-orange-100 border-orange-300 text-orange-900',
                    red: 'bg-red-100 border-red-300 text-red-900'
                  };
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 border rounded-lg ${colorClasses[threshold.color]}`}
                    >
                      <span className="text-sm font-semibold">{threshold.label}</span>
                      {editMode && threshold.editable ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={editedThresholds[threshold.key] || 0}
                            onChange={(e) => setEditedThresholds({
                              ...editedThresholds,
                              [threshold.key]: parseFloat(e.target.value) || 0
                            })}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <span className="text-sm">{indicator === 'responseTime' ? 'hours' : indicator === 'completionTime' ? 'days' : 'tickets'}</span>
                        </div>
                      ) : (
                        <span className="text-sm">{threshold.condition}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {editMode && (
                <div className="flex items-center space-x-2 mt-4">
                  <button
                    onClick={handleSaveThresholds}
                    className="flex-1 btn btn-primary"
                  >
                    Save Thresholds
                  </button>
                  <button
                    onClick={handleResetThresholds}
                    className="flex-1 btn btn-secondary"
                  >
                    Reset to Default
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full btn btn-primary"
            >
              Close
            </button>
          </div>
        </div>
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
              subtitle="Total completed tickets"
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
              <p className="text-xs text-gray-500 mt-1">Click on any indicator for detailed calculation info</p>
            </div>
            <div className="px-6 py-4 space-y-1">
              <HealthIndicator
                label="Database"
                status={systemHealth.indicators.database.status}
                color={systemHealth.indicators.database.status === 'Healthy' ? 'green' : 'red'}
                onClick={() => setSelectedIndicator('database')}
              />
              <HealthIndicator
                label="Backlog Management"
                status={systemHealth.indicators.backlogManagement}
                color={
                  systemHealth.indicators.backlogManagement === 'Good' ? 'green' :
                  systemHealth.indicators.backlogManagement === 'Fair' ? 'yellow' : 'orange'
                }
                onClick={() => setSelectedIndicator('backlogManagement')}
              />
              <HealthIndicator
                label="Response Time"
                status={systemHealth.indicators.responseTime}
                color={
                  systemHealth.indicators.responseTime === 'Good' ? 'green' :
                  systemHealth.indicators.responseTime === 'Fair' ? 'yellow' : 'orange'
                }
                onClick={() => setSelectedIndicator('responseTime')}
              />
              <HealthIndicator
                label="Completion Time"
                status={systemHealth.indicators.completionTime}
                color={
                  systemHealth.indicators.completionTime === 'Good' ? 'green' :
                  systemHealth.indicators.completionTime === 'Fair' ? 'yellow' : 'orange'
                }
                onClick={() => setSelectedIndicator('completionTime')}
              />
              <HealthIndicator
                label="Urgent Handling"
                status={systemHealth.indicators.urgentHandling}
                color={
                  systemHealth.indicators.urgentHandling === 'Excellent' ? 'green' :
                  systemHealth.indicators.urgentHandling === 'Good' ? 'blue' : 'orange'
                }
                onClick={() => setSelectedIndicator('urgentHandling')}
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

        {/* Health Indicator Modal */}
        {selectedIndicator && (
          <HealthIndicatorModal
            indicator={selectedIndicator}
            stats={stats}
            onClose={() => setSelectedIndicator(null)}
          />
        )}
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
      case 'help':
        return <HelpDocumentation />;
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
          <nav className="-mb-px flex flex-wrap gap-x-4 sm:gap-x-6 lg:gap-x-8">
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
                  } flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors flex-shrink-0`}
                >
                  <Icon className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="whitespace-nowrap">{tab.name}</span>
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
