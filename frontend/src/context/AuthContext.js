import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [restricted, setRestricted] = useState(false);
  const [banned, setBanned] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (token) {
      api.setToken(token);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    
    // Check if account is banned
    if (res.data.user?.accountStatus === 'banned') {
      setBanned(true);
      return { banned: true, message: 'Account has been banned. Contact support.' };
    }

    if (res.data.restricted) {
      // store token for later verification calls
      const t = res.data.token;
      setToken(t);
      localStorage.setItem('token', t);
      setRestricted(true);
      setUserId(res.data.user.id);
      setUserRole(res.data.user.role || 'user');
      return { restricted: true };
    }

    // normal login
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
    setRestricted(false);
    setBanned(false);
    setUserId(res.data.user.id);
    setUserRole(res.data.user.role || 'user');
    return { restricted: false, user: res.data.user };
  };

  const logout = () => {
    setToken(null);
    setRestricted(false);
    setBanned(false);
    setUserId(null);
    setUserRole(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, restricted, banned, userId, userRole, login, logout, setRestricted, setBanned }}>
      {children}
    </AuthContext.Provider>
  );
};
