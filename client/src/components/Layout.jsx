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
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-white relative">
      {/* Hexagonal molecular network background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Hexagon grid pattern */}
            <pattern id="hexGrid" x="0" y="0" width="80" height="69.3" patternUnits="userSpaceOnUse">
              <polygon points="40,0 74.6,20 74.6,49.3 40,69.3 5.4,49.3 5.4,20"
                       fill="none"
                       stroke="#1e3a8a"
                       strokeWidth="1"
                       opacity="0.15"/>
            </pattern>
          </defs>

          {/* Background grid */}
          <rect width="100%" height="100%" fill="url(#hexGrid)"/>

          {/* Filled hexagons - scattered on left side */}
          <polygon points="40,0 74.6,20 74.6,49.3 40,69.3 5.4,49.3 5.4,20"
                   fill="#1e40af"
                   opacity="0.8"
                   transform="translate(60, 50)"/>
          <polygon points="40,0 74.6,20 74.6,49.3 40,69.3 5.4,49.3 5.4,20"
                   fill="#1e40af"
                   opacity="0.8"
                   transform="translate(60, 190)"/>
          <polygon points="40,0 74.6,20 74.6,49.3 40,69.3 5.4,49.3 5.4,20"
                   fill="#1e40af"
                   opacity="0.8"
                   transform="translate(60, 330)"/>
          <polygon points="40,0 74.6,20 74.6,49.3 40,69.3 5.4,49.3 5.4,20"
                   fill="#1e40af"
                   opacity="0.8"
                   transform="translate(60, 470)"/>
          <polygon points="40,0 74.6,20 74.6,49.3 40,69.3 5.4,49.3 5.4,20"
                   fill="#1e40af"
                   opacity="0.8"
                   transform="translate(60, 610)"/>
          <polygon points="40,0 74.6,20 74.6,49.3 40,69.3 5.4,49.3 5.4,20"
                   fill="#1e40af"
                   opacity="0.8"
                   transform="translate(220, 120)"/>
          <polygon points="40,0 74.6,20 74.6,49.3 40,69.3 5.4,49.3 5.4,20"
                   fill="#1e40af"
                   opacity="0.8"
                   transform="translate(220, 400)"/>
          <polygon points="40,0 74.6,20 74.6,49.3 40,69.3 5.4,49.3 5.4,20"
                   fill="#1e40af"
                   opacity="0.8"
                   transform="translate(220, 680)"/>
          <polygon points="40,0 74.6,20 74.6,49.3 40,69.3 5.4,49.3 5.4,20"
                   fill="#1e40af"
                   opacity="0.8"
                   transform="translate(380, 260)"/>
          <polygon points="40,0 74.6,20 74.6,49.3 40,69.3 5.4,49.3 5.4,20"
                   fill="#1e40af"
                   opacity="0.8"
                   transform="translate(540, 120)"/>
          <polygon points="40,0 74.6,20 74.6,49.3 40,69.3 5.4,49.3 5.4,20"
                   fill="#1e40af"
                   opacity="0.8"
                   transform="translate(700, 190)"/>

          {/* Connection lines and nodes - molecular network */}
          {/* Left side - denser network */}
          <line x1="95" y1="85" x2="180" y2="140" stroke="#1e40af" strokeWidth="1.5" opacity="0.4"/>
          <circle cx="95" cy="85" r="4" fill="#1e40af" opacity="0.7"/>
          <circle cx="180" cy="140" r="4" fill="#1e40af" opacity="0.7"/>

          <line x1="100" y1="220" x2="220" y2="160" stroke="#1e40af" strokeWidth="1.5" opacity="0.4"/>
          <circle cx="100" cy="220" r="4" fill="#1e40af" opacity="0.7"/>

          <line x1="95" y1="365" x2="180" y2="420" stroke="#1e40af" strokeWidth="1.5" opacity="0.4"/>
          <circle cx="95" cy="365" r="4" fill="#1e40af" opacity="0.7"/>
          <circle cx="180" cy="420" r="4" fill="#1e40af" opacity="0.7"/>

          <line x1="100" y1="505" x2="195" y2="460" stroke="#1e40af" strokeWidth="1.5" opacity="0.4"/>
          <circle cx="100" cy="505" r="4" fill="#1e40af" opacity="0.7"/>

          <line x1="140" y1="540" x2="220" y2="490" stroke="#1e40af" strokeWidth="1.5" opacity="0.4"/>
          <circle cx="140" cy="540" r="4" fill="#1e40af" opacity="0.7"/>
          <circle cx="220" cy="490" r="4" fill="#1e40af" opacity="0.7"/>

          {/* Middle area - medium density */}
          <line x1="260" y1="155" x2="380" y2="220" stroke="#1e40af" strokeWidth="1.5" opacity="0.3"/>
          <circle cx="260" cy="155" r="4" fill="#1e40af" opacity="0.5"/>

          <line x1="300" y1="280" x2="420" y2="330" stroke="#1e40af" strokeWidth="1.5" opacity="0.3"/>
          <circle cx="300" cy="280" r="3" fill="#cbd5e1" opacity="0.6"/>
          <circle cx="420" cy="330" r="4" fill="#1e40af" opacity="0.5"/>

          <line x1="420" y1="295" x2="520" y2="350" stroke="#1e40af" strokeWidth="1.5" opacity="0.3"/>
          <circle cx="420" cy="295" r="4" fill="#1e40af" opacity="0.5"/>
          <circle cx="520" cy="350" r="3" fill="#cbd5e1" opacity="0.6"/>

          <line x1="500" y1="430" x2="600" y2="380" stroke="#1e40af" strokeWidth="1.5" opacity="0.3"/>
          <circle cx="500" cy="430" r="3" fill="#cbd5e1" opacity="0.6"/>
          <circle cx="600" cy="380" r="4" fill="#1e40af" opacity="0.5"/>

          {/* Right side - sparse network with light dots */}
          <line x1="575" y1="155" x2="680" y2="200" stroke="#1e40af" strokeWidth="1.5" opacity="0.2"/>
          <circle cx="575" cy="155" r="4" fill="#1e40af" opacity="0.4"/>
          <circle cx="680" cy="200" r="3" fill="#cbd5e1" opacity="0.5"/>

          <line x1="700" y1="330" x2="820" y2="280" stroke="#1e40af" strokeWidth="1.5" opacity="0.2"/>
          <circle cx="700" cy="330" r="3" fill="#cbd5e1" opacity="0.5"/>
          <circle cx="820" cy="280" r="3" fill="#cbd5e1" opacity="0.5"/>

          <circle cx="900" cy="150" r="3" fill="#cbd5e1" opacity="0.4"/>
          <circle cx="950" cy="320" r="3" fill="#cbd5e1" opacity="0.4"/>
          <circle cx="1000" y="220" r="3" fill="#cbd5e1" opacity="0.4"/>
          <circle cx="850" cy="450" r="3" fill="#cbd5e1" opacity="0.4"/>
          <circle cx="1050" cy="500" r="3" fill="#cbd5e1" opacity="0.4"/>
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