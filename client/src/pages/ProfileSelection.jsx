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
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
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
          <circle cx="1000" cy="220" r="3" fill="#cbd5e1" opacity="0.4"/>
          <circle cx="850" cy="450" r="3" fill="#cbd5e1" opacity="0.4"/>
          <circle cx="1050" cy="500" r="3" fill="#cbd5e1" opacity="0.4"/>
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