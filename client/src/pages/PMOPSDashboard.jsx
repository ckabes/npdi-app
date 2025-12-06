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

  useEffect(() => {
    fetchStats();
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

  const { statusCounts, throughput, performance } = stats;

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

      {/* Monthly Rate Modal */}
      {showMonthlyRateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
