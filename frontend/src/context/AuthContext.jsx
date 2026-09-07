import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('bakery_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('bakery_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('bakery_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Failed to verify authentication token", err);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchMe();
  }, [token]);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { access_token, user: loggedUser } = response.data;
    
    setToken(access_token);
    setUser(loggedUser);
    localStorage.setItem('bakery_token', access_token);
    localStorage.setItem('bakery_user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bakery_token');
    localStorage.removeItem('bakery_user');
  };

  const hasRole = (allowedRoles) => {
    if (!user || !user.role) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
