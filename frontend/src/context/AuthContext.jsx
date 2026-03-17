import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) { setLoading(false); return; }
    try {
      const u = await authApi.me();
      setUser(u);
    } catch {
      api.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    api.setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const registerFounder = async (data) => {
    const res = await authApi.registerFounder(data);
    api.setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const registerCompany = async (data) => {
    const res = await authApi.registerCompany(data);
    api.setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  const isFounder = user?.role === 'founder';
  const isCompany = user?.role === 'company';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user, loading, login, registerFounder, registerCompany, logout,
      isFounder, isCompany, isAdmin, loadUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
