'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  storageKey?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vai-travel-theme',
  enableSystem = true,
  disableTransitionOnChange = true,
}: ThemeProviderProps) {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return <div className="min-h-screen bg-background-primary">{children}</div>;
  }

  const contextValue: ThemeContextType = {
    theme: (theme as 'light' | 'dark' | 'system') || defaultTheme,
    setTheme: (newTheme: 'light' | 'dark' | 'system') => {
      setTheme(newTheme);
    },
    resolvedTheme: resolvedTheme as 'light' | 'dark',
    systemTheme: systemTheme as 'light' | 'dark',
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system',
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className="min-h-screen bg-background-primary text-text-primary transition-colors duration-300">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// Theme Toggle Component
interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ 
  className = '', 
  showLabel = true, 
  size = 'md' 
}: ThemeToggleProps) {
  const { theme, setTheme, isDark, isLight, isSystem } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`btn btn-secondary ${className}`}>
        <div className="w-4 h-4" />
        {showLabel && <span className="ml-2">Theme</span>}
      </div>
    );
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const cycleTheme = () => {
    if (isLight) {
      setTheme('dark');
    } else if (isDark) {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (isSystem) {
      return (
        <svg
          className={iconSize[size]}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    } else if (isDark) {
      return (
        <svg
          className={iconSize[size]}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      );
    } else {
      return (
        <svg
          className={iconSize[size]}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      );
    }
  };

  const getLabel = () => {
    if (isSystem) return 'System';
    if (isDark) return 'Dark';
    return 'Light';
  };

  return (
    <button
      onClick={cycleTheme}
      className={`
        btn btn-secondary ${sizeClasses[size]} ${className}
        flex items-center justify-center
        hover:bg-neutral-200 dark:hover:bg-neutral-700
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        transition-all duration-200
      `}
      aria-label={`Switch to ${isLight ? 'dark' : isDark ? 'system' : 'light'} theme`}
      title={`Current theme: ${getLabel()}. Click to cycle themes.`}
    >
      {getIcon()}
      {showLabel && (
        <span className="ml-2 hidden sm:inline">
          {getLabel()}
        </span>
      )}
    </button>
  );
}

// Theme Selector Component
interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className = '' }: ThemeSelectorProps) {
  const { theme, setTheme, isDark, isLight, isSystem } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <select className={`input ${className}`} disabled>
        <option>Loading...</option>
      </select>
    );
  }

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
      className={`input ${className}`}
      aria-label="Select theme"
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}

export default ThemeProvider;
