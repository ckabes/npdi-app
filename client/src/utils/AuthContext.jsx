import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, apiClient } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [profiles, setProfiles] = useState([]);

  // Fetch profiles from API
  const fetchProfiles = async () => {
    try {
      const response = await apiClient.get('/profiles');
      setProfiles(response.data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setProfiles([]);
    }
  };

  useEffect(() => {
    // Fetch available profiles
    fetchProfiles();

    // Check for stored token on mount
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: authToken, user: userData } = response.data;

      // Store token and user data
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token: authToken, user: newUser } = response.data;

      // Store token and user data
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      setToken(authToken);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  const selectProfile = (profileId) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setUser(profile);
      localStorage.setItem('selectedProfile', profileId);
      localStorage.setItem('currentProfileData', JSON.stringify(profile));
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedProfile');
    localStorage.removeItem('currentProfileData');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    profiles,
    loading,
    login,
    register,
    selectProfile,
    logout,
    refreshProfiles: fetchProfiles,
    isAuthenticated: !!user && !!token,
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