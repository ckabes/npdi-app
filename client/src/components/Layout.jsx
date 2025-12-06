import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import {
  HomeIcon,
  DocumentIcon,
  PlusIcon,
  PencilIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CogIcon,
  CircleStackIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Layout = () => {
  const { user, logout, isProductManager, isPMOPS, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Switched profiles');
    navigate('/select-profile');
  };

  const formatRoleName = (role) => {
    if (!role) return '';
    // Convert PRODUCT_MANAGER to Product Manager
    return role.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const navigation = [
    { name: isPMOPS || isAdmin ? 'PMOps Dashboard' : 'Dashboard', href: isPMOPS || isAdmin ? '/pm-ops' : '/dashboard', icon: HomeIcon },
    { name: 'Tickets', href: '/tickets', icon: DocumentIcon },
    ...(isPMOPS || isAdmin ? [
      { name: 'Drafts', href: '/drafts', icon: PencilIcon }
    ] : []),
    ...(isProductManager || isAdmin ? [
      { name: 'New Ticket', href: '/tickets/new', icon: PlusIcon }
    ] : []),
    ...(isAdmin ? [
      { name: 'Admin Dashboard', href: '/admin', icon: CogIcon },
      { name: 'Template Manager', href: '/templates', icon: DocumentTextIcon },
      { name: 'MongoDB Explorer', href: '/mongodb', icon: CircleStackIcon }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative">
      {/* Subtle honeycomb pattern background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0, opacity: 0.4 }}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="honeycomb" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse">
              <path d="M28 0l14 8v16l-14 8-14-8V8l14-8z" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.2"/>
              <path d="M28 50l14 8v16l-14 8-14-8V58l14-8z" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#honeycomb)"/>
        </svg>
      </div>

      {/* Content wrapper with higher z-index */}
      <div className="relative" style={{ zIndex: 1 }}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600/75 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} 
             onClick={() => setSidebarOpen(false)} />
        
        <div className={`fixed inset-y-0 left-0 flex w-64 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex min-h-0 flex-1 flex-col bg-white shadow-xl">
            <div className="flex h-16 flex-shrink-0 items-center justify-between px-4 bg-millipore-blue">
              <img className="h-10 w-auto" src="/M.png" alt="MilliporeSigma" />
              <button
                type="button"
                className="text-white hover:text-gray-200"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-millipore-blue text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-6 w-6 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white shadow">
          <div className="flex h-16 flex-shrink-0 items-center px-4 bg-millipore-blue">
            <img className="h-10 w-auto" src="/M.png" alt="MilliporeSigma" />
            <span className="ml-2 text-white font-semibold">NPDI Portal</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-millipore-blue text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-6 w-6 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-30 flex h-16 flex-shrink-0 bg-white shadow">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-millipore-blue md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1">
              <div className="flex w-full md:ml-0">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {navigation.find(item => item.href === location.pathname)?.name || 'NPDI Portal'}
                  </h1>
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {formatRoleName(user?.role)}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <ArrowRightOnRectangleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      </div>
    </div>
  );
};

export default Layout;