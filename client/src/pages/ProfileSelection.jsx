import React from 'react';
import { useAuth } from '../utils/AuthContext';

const ProfileSelection = () => {
  const { profiles, selectProfile } = useAuth();

  const handleProfileSelect = (profileId) => {
    selectProfile(profileId);
  };

  const formatRoleName = (role) => {
    if (!role) return '';
    // Convert PRODUCT_MANAGER to Product Manager
    return role.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Subtle honeycomb pattern background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0, opacity: 0.4 }}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="honeycomb-profile" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse">
              <path d="M28 0l14 8v16l-14 8-14-8V8l14-8z" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.2"/>
              <path d="M28 50l14 8v16l-14 8-14-8V58l14-8z" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#honeycomb-profile)"/>
        </svg>
      </div>

      {/* Content wrapper with higher z-index */}
      <div className="relative" style={{ zIndex: 1 }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Select Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose a profile to access the NPDI application
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleProfileSelect(profile.id)}
                className="w-full flex items-center justify-between p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                      profile.role === 'PRODUCT_MANAGER' ? 'bg-green-500' :
                      profile.role === 'PM_OPS' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}>
                      {profile.firstName[0]}{profile.lastName[0]}
                    </div>
                  </div>
                  <div className="ml-4 text-left">
                    <div className="text-lg font-medium text-gray-900">
                      {profile.firstName} {profile.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{formatRoleName(profile.role)}</div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          MilliporeSigma NPDI Application - Development Mode
        </p>
      </div>
      </div>
    </div>
  );
};

export default ProfileSelection;