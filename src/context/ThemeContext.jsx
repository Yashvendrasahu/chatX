import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('chatx_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [chatWallpaper, setChatWallpaper] = useState(() => {
    return localStorage.getItem('chatx_wallpaper') || 'default';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('chatx_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateWallpaper = (wp) => {
    setChatWallpaper(wp);
    localStorage.setItem('chatx_wallpaper', wp);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, chatWallpaper, updateWallpaper }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
