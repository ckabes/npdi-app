'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ChartBarIcon,
  PlusCircleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/select-profile');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/products/dashboard/stats');
        const data = await response.json();
        setStats(data);
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
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="glass-effect p-8 rounded-3xl">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="text-lg font-medium text-gray-700">Loading NPDI Dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, color, icon: Icon }: { 
    title: string, 
    value: number, 
    color: string, 
    icon: React.ComponentType<any>
  }) => {
    const colorClasses = {
      blue: {
        bg: 'from-blue-500 to-blue-600',
        text: 'text-blue-600',
        iconBg: 'bg-blue-500',
        shadow: 'shadow-blue-200',
        hover: 'hover:from-blue-600 hover:to-blue-700'
      },
      yellow: {
        bg: 'from-yellow-500 to-yellow-600',
        text: 'text-yellow-600',
        iconBg: 'bg-yellow-500',
        shadow: 'shadow-yellow-200',
        hover: 'hover:from-yellow-600 hover:to-yellow-700'
      },
      green: {
        bg: 'from-green-500 to-green-600',
        text: 'text-green-600',
        iconBg: 'bg-green-500',
        shadow: 'shadow-green-200',
        hover: 'hover:from-green-600 hover:to-green-700'
      },
      gray: {
        bg: 'from-gray-500 to-gray-600',
        text: 'text-gray-600',
        iconBg: 'bg-gray-500',
        shadow: 'shadow-gray-200',
        hover: 'hover:from-gray-600 hover:to-gray-700'
      }
    };

    const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;

    return (
      <div className="group relative overflow-hidden glass-effect rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-4 bg-gradient-to-r ${colors.bg} ${colors.hover} rounded-2xl shadow-lg ${colors.shadow} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                {title}
              </p>
              <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                {value.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-8 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <nav className="relative z-10 glass-effect border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18 py-3">
            <div className="flex items-center space-x-4">
              <div className="millipore-gradient p-3 rounded-2xl shadow-lg">
                <h1 className="text-xl font-bold text-white tracking-wide">NPDI</h1>
              </div>
              <div className="hidden md:block">
                <p className="text-sm text-gray-600">New Product Development & Introduction</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <UserCircleIcon className="h-5 w-5 text-white" />
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.name}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="btn btn-secondary shadow-lg hover:shadow-xl"
              >
                Switch Profile
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="glass-effect rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-8 py-8">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">
                      Welcome back, {user?.firstName}! 👋
                    </h1>
                    <p className="text-blue-100 text-lg font-medium">
                      {user?.name} • {user?.sbu}
                    </p>
                    <p className="text-blue-200 text-sm mt-1">
                      Ready to drive innovation forward?
                    </p>
                  </div>
                  <button className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex items-center space-x-2">
                    <PlusCircleIcon className="h-6 w-6" />
                    <span>New Ticket</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Draft Tickets"
                value={stats?.statusCounts?.draft || 0}
                color="gray"
                icon={DocumentTextIcon}
              />
              <StatCard
                title="In Process"
                value={stats?.statusCounts?.inProcess || 0}
                color="yellow"
                icon={ClockIcon}
              />
              <StatCard
                title="Completed"
                value={stats?.statusCounts?.completed || 0}
                color="green"
                icon={CheckCircleIcon}
              />
              <StatCard
                title="Total Tickets"
                value={stats?.statusCounts?.total || 0}
                color="blue"
                icon={ChartBarIcon}
              />
            </div>

            {/* SBU and Priority Breakdown */}
            {stats?.sbuBreakdown && stats.sbuBreakdown.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-effect rounded-3xl overflow-hidden shadow-2xl group hover:shadow-3xl transition-all duration-300">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <ChartBarIcon className="h-6 w-6 mr-2" />
                      Tickets by SBU
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {stats.sbuBreakdown.map((sbu: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-sm"></div>
                            <span className="font-semibold text-gray-800">{sbu._id}</span>
                          </div>
                          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                            <span className="font-bold text-blue-700">{sbu.count}</span>
                            <span className="text-xs text-gray-500 ml-1">tickets</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-effect rounded-3xl overflow-hidden shadow-2xl group hover:shadow-3xl transition-all duration-300">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <ChartBarIcon className="h-6 w-6 mr-2" />
                      Priority Breakdown
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {stats.priorityBreakdown.map((priority: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 group-hover:from-green-100 group-hover:to-emerald-100 transition-all duration-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-sm"></div>
                            <span className="font-semibold text-gray-800 capitalize">
                              {priority._id?.toLowerCase() || 'Unassigned'}
                            </span>
                          </div>
                          <span className={`badge priority-${priority._id?.toLowerCase() || 'medium'} shadow-lg`}>
                            {priority.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}