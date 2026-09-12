import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { tokenStore } from '../services/api.js';
import { connectSocket, disconnectSocket } from '../services/socket.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const loadMe = useCallback(async () => {
    const token = tokenStore.get();
    if (!token) {
      setUser(null);
      setInitializing(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data.user);
      connectSocket();
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
    const onExpired = () => {
      setUser(null);
      disconnectSocket();
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [loadMe]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: loggedIn } = res.data.data;
    tokenStore.set(token);
    setUser(loggedIn);
    connectSocket();
    return loggedIn;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload);
    const { token, user: created } = res.data.data;
    tokenStore.set(token);
    setUser(created);
    connectSocket();
    return created;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    disconnectSocket();
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, register, logout, refresh: loadMe }),
    [user, initializing, login, register, logout, loadMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}