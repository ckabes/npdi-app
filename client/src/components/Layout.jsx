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
  CogIcon
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
    { name: isPMOPS || isAdmin ? 'PMOps Dashboard' : 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Tickets', href: '/tickets', icon: DocumentIcon },
    ...(isPMOPS || isAdmin ? [
      { name: 'Drafts', href: '/drafts', icon: PencilIcon }
    ] : []),
    ...(isProductManager || isPMOPS || isAdmin ? [
      { name: 'New Ticket', href: '/tickets/new', icon: PlusIcon }
    ] : []),
    ...(isAdmin ? [
      { name: 'Admin Dashboard', href: '/admin', icon: CogIcon }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white relative">
      {/* Hexagonal background pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <svg className="w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexagons" x="0" y="0" width="100" height="87" patternUnits="userSpaceOnUse">
              {/* Regular hexagons */}
              <polygon points="50,0 93.3,25 93.3,62 50,87 6.7,62 6.7,25"
                       fill="none"
                       stroke="#3b82f6"
                       strokeWidth="0.5"
                       opacity="0.3"/>
              <polygon points="50,0 93.3,25 93.3,62 50,87 6.7,62 6.7,25"
                       fill="none"
                       stroke="#60a5fa"
                       strokeWidth="0.3"
                       opacity="0.2"
                       transform="scale(0.7) translate(21, 18)"/>
              <circle cx="50" cy="43.5" r="2" fill="#3b82f6" opacity="0.2"/>

              {/* Accent hexagons - offset and different colors */}
              <polygon points="50,0 93.3,25 93.3,62 50,87 6.7,62 6.7,25"
                       fill="none"
                       stroke="#8b5cf6"
                       strokeWidth="0.7"
                       opacity="0.25"
                       transform="translate(120, 45) scale(0.8)"/>
              <circle cx="170" cy="88.5" r="2.5" fill="#8b5cf6" opacity="0.3"/>

              <polygon points="50,0 93.3,25 93.3,62 50,87 6.7,62 6.7,25"
                       fill="none"
                       stroke="#06b6d4"
                       strokeWidth="0.6"
                       opacity="0.3"
                       transform="translate(-75, 60) scale(0.9)"/>
              <circle cx="-25" cy="103.5" r="2" fill="#06b6d4" opacity="0.25"/>

              <polygon points="50,0 93.3,25 93.3,62 50,87 6.7,62 6.7,25"
                       fill="none"
                       stroke="#a78bfa"
                       strokeWidth="0.5"
                       opacity="0.2"
                       transform="translate(30, -30) scale(1.1)"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)"/>

          {/* Larger accent hexagons on the sides - more visible */}
          {/* Top left */}
          <polygon points="100,0 186.6,50 186.6,150 100,200 13.4,150 13.4,50"
                   fill="none"
                   stroke="#3b82f6"
                   strokeWidth="1.5"
                   opacity="0.15"
                   transform="translate(-50, 80)"/>
          <circle cx="50" cy="180" r="4" fill="#3b82f6" opacity="0.2"/>

          {/* Middle left - purple */}
          <polygon points="100,0 186.6,50 186.6,150 100,200 13.4,150 13.4,50"
                   fill="none"
                   stroke="#8b5cf6"
                   strokeWidth="2"
                   opacity="0.2"
                   transform="translate(-80, 350) scale(1.3)"/>
          <circle cx="50" cy="480" r="5" fill="#8b5cf6" opacity="0.25"/>

          {/* Bottom left - cyan */}
          <polygon points="100,0 186.6,50 186.6,150 100,200 13.4,150 13.4,50"
                   fill="none"
                   stroke="#06b6d4"
                   strokeWidth="1.8"
                   opacity="0.18"
                   transform="translate(-60, 650) scale(1.1) rotate(15 100 100)"/>

          {/* Top right */}
          <g transform="translate(0, 0)">
            <polygon points="100,0 186.6,50 186.6,150 100,200 13.4,150 13.4,50"
                     fill="none"
                     stroke="#60a5fa"
                     strokeWidth="1.6"
                     opacity="0.16"
                     transform="translate(calc(100vw - 150), 120) scale(1.2)"/>
            <circle cx="calc(100vw - 50)" cy="240" r="4.5" fill="#60a5fa" opacity="0.2"/>
          </g>

          {/* Middle right - light purple */}
          <polygon points="100,0 186.6,50 186.6,150 100,200 13.4,150 13.4,50"
                   fill="none"
                   stroke="#a78bfa"
                   strokeWidth="2.2"
                   opacity="0.2"
                   transform="translate(calc(100vw - 100), 400) scale(1.4) rotate(-10 100 100)"/>

          {/* Bottom right - purple accent */}
          <polygon points="100,0 186.6,50 186.6,150 100,200 13.4,150 13.4,50"
                   fill="none"
                   stroke="#8b5cf6"
                   strokeWidth="1.5"
                   opacity="0.15"
                   transform="translate(calc(100vw - 130), 700) scale(0.9)"/>
          <circle cx="calc(100vw - 30)" cy="790" r="3.5" fill="#8b5cf6" opacity="0.2"/>
        </svg>
      </div>

      {/* Content wrapper with higher z-index */}
      <div className="relative" style={{ zIndex: 1 }}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} 
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