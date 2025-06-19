
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Add transition class temporarily to prevent lag
    root.classList.add('theme-transition');
    
    // Apply theme changes
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    root.classList.toggle('dark', isDark);
    
    // Remove transition class after a short delay
    const timer = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 50);
    
    return () => clearTimeout(timer);
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
