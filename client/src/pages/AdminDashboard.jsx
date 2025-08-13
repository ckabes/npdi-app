import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  CogIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import UserManagement from '../components/admin/UserManagement';
import FormConfiguration from '../components/admin/FormConfiguration';
import PermissionsManagement from '../components/admin/PermissionsManagement';
import SystemSettings from '../components/admin/SystemSettings';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTickets: 0,
    completedTickets: 0,
    systemHealth: 'Good'
  });

  useEffect(() => {
    // Load admin stats
    // This would be replaced with actual API calls
    setStats({
      totalUsers: 12,
      activeTickets: 24,
      completedTickets: 156,
      systemHealth: 'Good'
    });
  }, []);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'users', name: 'User Management', icon: UserGroupIcon },
    { id: 'form-fields', name: 'Form Configuration', icon: DocumentTextIcon },
    { id: 'permissions', name: 'Permissions', icon: ShieldCheckIcon },
    { id: 'system', name: 'System Settings', icon: CogIcon }
  ];

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={UserGroupIcon} 
          color="blue" 
        />
        <StatCard 
          title="Active Tickets" 
          value={stats.activeTickets} 
          icon={DocumentTextIcon} 
          color="yellow" 
        />
        <StatCard 
          title="Completed Tickets" 
          value={stats.completedTickets} 
          icon={ChartBarIcon} 
          color="green" 
        />
        <StatCard 
          title="System Health" 
          value={stats.systemHealth} 
          icon={ShieldCheckIcon} 
          color="green" 
        />
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Activity
          </h3>
          <div className="mt-5">
            <div className="flow-root">
              <ul className="-mb-8">
                {[
                  { action: 'New user registered', user: 'John Doe', time: '2 hours ago' },
                  { action: 'Form field updated', user: 'Admin', time: '4 hours ago' },
                  { action: 'Permission changed', user: 'Sarah Johnson', time: '1 day ago' }
                ].map((activity, index) => (
                  <li key={index}>
                    <div className="relative pb-8">
                      <div className="relative flex space-x-3">
                        <div className="flex h-6 w-6 items-center justify-center">
                          <div className="h-2 w-2 bg-gray-400 rounded-full" />
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-gray-900">{activity.user}</span> {activity.action}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return <UserManagement />;
      case 'form-fields':
        return <FormConfiguration />;
      case 'permissions':
        return <PermissionsManagement />;
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
              <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Manage system configuration and users</p>
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
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm`}
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