import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    setUser(storedUser ? JSON.parse(storedUser) : null);
    setLoading(false);
  }, []);

  const login = (userInfo) => {
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    if (!loading && !user && router.pathname !== '/login' && router.pathname !== '/register') {
      router.push('/login');
    }
  }, [user, loading, router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
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
