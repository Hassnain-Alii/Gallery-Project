import { createContext, useContext, useState, useEffect } from 'react';

const GalleryContext = createContext(null);

export const GalleryProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAuthor, setActiveAuthor] = useState('All');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  
  const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  useEffect(() => {
    // Restore user session from localStorage on app load
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (storedUser && storedToken && storedRefreshToken) {
      try {
        setUser(JSON.parse(storedUser));
        // Trigger an immediate refresh attempt to ensure the session is still valid
        refreshSession(storedRefreshToken);
      } catch {
        logout();
      }
    }
  }, []);

  // Periodic refresh effect: Refresh token every 14 minutes if user is logged in
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const rt = localStorage.getItem('refreshToken');
      if (rt) refreshSession(rt);
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(interval);
  }, [user]);

  const refreshSession = async (rt) => {
    try {
      const res = await fetch(`${apiBaseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Session refresh failed:', err);
      // Don't logout on network error, only on auth error
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const login = (userData, token, refreshToken) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  };

  const logout = async () => {
    const rt = localStorage.getItem('refreshToken');
    if (rt) {
      try {
        fetch(`${apiBaseURL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt })
        });
      } catch (err) { /* ignore logout errors */ }
    }
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <GalleryContext.Provider value={{
      user,
      login,
      logout,
      updateUser,
      searchQuery,
      setSearchQuery,
      activeAuthor,
      setActiveAuthor,
      theme,
      toggleTheme,
      isGlobalLoading,
      setIsGlobalLoading,
      apiBaseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
    }}>
      {children}
    </GalleryContext.Provider>
  );
};

export const useGallery = () => useContext(GalleryContext);
