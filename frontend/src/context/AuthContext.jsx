import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('datapulse_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('datapulse_token');
      if (savedToken) {
        try {
          const res = await api.get('/me');
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to verify token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('datapulse_token', receivedToken);
    localStorage.setItem('datapulse_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/register', { name, email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('datapulse_token', receivedToken);
    localStorage.setItem('datapulse_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('datapulse_token');
    localStorage.removeItem('datapulse_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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
