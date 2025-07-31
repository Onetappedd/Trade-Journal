import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Axios instance with interceptor
  const api = axios.create({ baseURL: '/api' });
  api.interceptors.request.use(
    config => {
      const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (t) config.headers['Authorization'] = `Bearer ${t}`;
      return config;
    },
    error => Promise.reject(error)
  );
  api.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setToken(t);
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await axios.post(
        '/api/users/token',
        new URLSearchParams({ username, password }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      localStorage.setItem('token', res.data.access_token);
      setToken(res.data.access_token);
      router.push('/dashboard');
    } catch (err) {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    router.push('/login');
  };

  // Optionally, implement token refresh if backend supports it
  const refresh = async () => {
    // Example: call /users/refresh endpoint if available
    // Not implemented here as backend does not provide refresh
  };

  // Redirect to /login if not authenticated
  useEffect(() => {
    if (!loading && !token && router.pathname !== '/login' && router.pathname !== '/register') {
      router.push('/login');
    }
  }, [token, loading, router]);

  return (
    <AuthContext.Provider value={{ token, login, logout, refresh, api, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
