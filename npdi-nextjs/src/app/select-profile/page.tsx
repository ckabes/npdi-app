'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SelectProfile() {
  const { profiles, selectProfile, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleProfileSelect = (profileId: string) => {
    selectProfile(profileId);
    router.push('/dashboard');
  };

  const getProfileIcon = (role: string) => {
    switch (role) {
      case 'PRODUCT_MANAGER':
        return '👨‍💼';
      case 'PM_OPS':
        return '🔧';
      case 'ADMIN':
        return '👑';
      default:
        return '👤';
    }
  };

  const getProfileColor = (role: string) => {
    switch (role) {
      case 'PRODUCT_MANAGER':
        return 'from-blue-500 to-blue-600';
      case 'PM_OPS':
        return 'from-green-500 to-green-600';
      case 'ADMIN':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -top-8 left-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <div className="millipore-gradient p-6 rounded-3xl shadow-2xl">
            <h1 className="text-4xl font-bold text-white tracking-wide">
              NPDI
            </h1>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome to NPDI
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            New Product Development & Introduction
          </p>
          <p className="text-lg text-gray-500">
            Select your profile to continue
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-12 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="space-y-6">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleProfileSelect(profile.id)}
              className="w-full group relative overflow-hidden bg-white/80 backdrop-blur-lg border-2 border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/90 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 relative">
                  <div className={`h-16 w-16 bg-gradient-to-r ${getProfileColor(profile.role)} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-2xl">
                      {getProfileIcon(profile.role)}
                    </span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <div className="ml-6 text-left flex-1">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                    {profile.name}
                  </h3>
                  <p className="text-base font-medium text-gray-700 mt-1">
                    {profile.firstName} {profile.lastName}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    {profile.sbu}
                  </p>
                </div>
                
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            </button>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            MilliporeSigma Product Development System
          </p>
          <div className="flex justify-center items-center mt-2 space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-400">Secure • Reliable • Efficient</p>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}