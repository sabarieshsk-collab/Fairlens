import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCompany, isLoggedIn, verifyToken, logout as authLogout } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    return isLoggedIn() ? getCompany() : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      if (!isLoggedIn()) {
        setUser(null);
        setLoading(false);
        return;
      }

      const cachedCompany = getCompany();
      if (cachedCompany) {
        setUser(cachedCompany);
      }

      try {
        const response = await verifyToken();
        if (response?.company) {
          setUser(response.company);
          localStorage.setItem('fairlens_company', JSON.stringify(response.company));
        }
      } catch (err) {
        console.warn('Token verification warning:', err.message);
        const errStr = err.message ? err.message.toLowerCase() : '';
        if (errStr.includes('401') || errStr.includes('expired') || errStr.includes('invalid') || errStr.includes('token')) {
          authLogout();
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const logout = () => {
    authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: isLoggedIn() ? getCompany() : null,
      loading: false,
      logout: authLogout,
      setUser: () => {},
    };
  }
  return context;
}