import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiRequest, checkBackendStatus, getDemoModeStatus } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sh_token') || null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Load user profile on start
  useEffect(() => {
    async function loadUser() {
      // Establish backend status on load
      const isOnline = await checkBackendStatus();
      setIsDemo(!isOnline);

      if (token) {
        try {
          const profile = await apiRequest('/auth/me');
          setUser(profile);
        } catch (err) {
          console.error("Auth initialization failed. Clearing expired token.", err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  // Login action
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      localStorage.setItem('sh_token', response.token);
      setToken(response.token);
      setUser(response.user);
      
      // Update Demo Mode state
      setIsDemo(getDemoModeStatus());
      return response.user;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register action
  const register = async (name, email, password, role, village) => {
    setLoading(true);
    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role, village })
      });

      localStorage.setItem('sh_token', response.token);
      setToken(response.token);
      setUser(response.user);
      
      setIsDemo(getDemoModeStatus());
      return response.user;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('sh_token');
    localStorage.removeItem('sh_current_user');
    setToken(null);
    setUser(null);
  };

  // Explicitly check backend and toggle demo mode
  const refreshBackendConnection = async () => {
    const isOnline = await checkBackendStatus({ forceCheck: true });
    setIsDemo(!isOnline);
    return isOnline;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isDemo,
      login,
      register,
      logout,
      refreshBackendConnection
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
