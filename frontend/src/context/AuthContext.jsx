import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../api/api.js';

const AuthContext = createContext(null);

const ROLE_DASHBOARDS = {
  admin:    '/admin/dashboard',
  mentor:   '/mentor/dashboard',
  aspirant: '/aspirant/dashboard',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('tr_token'));
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  // Normalize role helper (maps student to aspirant)
  const normalizeUser = (userData) => {
    if (!userData) return null;
    const role = userData.role === 'student' ? 'aspirant' : userData.role;
    return { ...userData, role };
  };

  // ── Persist helpers ────────────────────────────
  const persistAuth = (userData, userToken) => {
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem('tr_token', userToken);
    localStorage.setItem('tr_user', JSON.stringify(normalizedUser));
    setToken(userToken);
    setUser(normalizedUser);
  };

  const clearAuth = useCallback(() => {
    localStorage.removeItem('tr_token');
    localStorage.removeItem('tr_user');
    setToken(null);
    setUser(null);
  }, []);

  // ── Bootstrap: rehydrate from localStorage then verify with /me ──
  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = localStorage.getItem('tr_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authAPI.getMe();
        if (data && data.user) {
          setUser(normalizeUser(data.user));
        } else {
          // Fallback if data format is unexpected but token is valid
          const storedUser = localStorage.getItem('tr_user');
          if (storedUser) {
            setUser(normalizeUser(JSON.parse(storedUser)));
          }
        }
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [clearAuth]);

  // ── Register ────────────────────────────────────
  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    const tokenVal = data.token || data.user?.token;
    const userVal = normalizeUser(data.user);
    persistAuth(userVal, tokenVal);
    toast.success(data.message || 'Registered successfully!');
    navigate(ROLE_DASHBOARDS[userVal.role] || '/');
  };

  // ── Login ───────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const tokenVal = data.token || data.user?.token;
    const userVal = normalizeUser(data.user);
    persistAuth(userVal, tokenVal);
    toast.success(data.message || `Welcome back!`);
    navigate(ROLE_DASHBOARDS[userVal.role] || '/');
  };

  // ── Logout ──────────────────────────────────────
  const logout = async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    clearAuth();
    toast.success('Logged out successfully. See you soon!');
    navigate('/');
  };

  // ── Update Profile ──────────────────────────────
  const updateProfile = async (formData) => {
    const { data } = await authAPI.updateProfile(formData);
    const tokenVal = data.token || data.user?.token;
    const userVal = normalizeUser(data.user);
    persistAuth(userVal, tokenVal);
    toast.success(data.message || 'Profile updated!');
    return userVal;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
