'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Profile {
  id: string;
  name: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  sbu: string;
}

interface AuthContextType {
  user: Profile | null;
  profiles: Profile[];
  loading: boolean;
  selectProfile: (profileId: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isProductManager: boolean;
  isPMOPS: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [profiles] = useState<Profile[]>([
    {
      id: 'product-manager',
      name: 'Product Manager',
      role: 'PRODUCT_MANAGER',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@milliporesigma.com',
      sbu: 'Life Science'
    },
    {
      id: 'pm-ops',
      name: 'PM Operations',
      role: 'PM_OPS',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@milliporesigma.com',
      sbu: 'Process Solutions'
    },
    {
      id: 'admin',
      name: 'Administrator',
      role: 'ADMIN',
      firstName: 'Mike',
      lastName: 'Wilson',
      email: 'mike.wilson@milliporesigma.com',
      sbu: 'Electronics'
    }
  ]);

  useEffect(() => {
    const savedProfile = localStorage.getItem('selectedProfile');
    if (savedProfile) {
      const profile = profiles.find(p => p.id === savedProfile);
      if (profile) {
        setUser(profile);
      }
    }
  }, [profiles]);

  const selectProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setUser(profile);
      localStorage.setItem('selectedProfile', profileId);
    }
  };

  const logout = () => {
    localStorage.removeItem('selectedProfile');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    profiles,
    loading,
    selectProfile,
    logout,
    isAuthenticated: !!user,
    isProductManager: user?.role === 'PRODUCT_MANAGER',
    isPMOPS: user?.role === 'PM_OPS',
    isAdmin: user?.role === 'ADMIN'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};