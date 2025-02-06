//src/contexts/ThemeProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  forceDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const pathname = usePathname();
  const [forceDarkMode, setForceDarkMode] = useState(true);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('bndy-theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // Determine if we should force dark mode based on the route
    const isPublicRoute = ['/', '/login', '/register'].includes(pathname || '');
    setForceDarkMode(isPublicRoute);
    
    // Apply theme
    document.documentElement.setAttribute(
      'data-theme', 
      isPublicRoute ? 'dark' : savedTheme || 'dark'
    );
  }, [pathname]);

  const toggleTheme = () => {
    if (!forceDarkMode) {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      localStorage.setItem('bndy-theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, forceDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};