'use client';

import React from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { ThemeToggle } from '@/components/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';

interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className = '' }: AppHeaderProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  return (
    <header
      className={`
        bg-background-primary border-b border-neutral-200 dark:border-neutral-700
        sticky top-0 z-50 backdrop-blur-sm bg-opacity-95
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  vAI Travel Agent
                </h1>
                <p className="text-sm text-text-secondary">
                  {t('header.tagline', 'Your AI-powered travel companion')}
                </p>
              </div>
            </div>
        </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="/dashboard"
              className="text-text-secondary hover:text-text-primary transition-colors duration-200 font-medium"
            >
              {t('nav.dashboard', 'Dashboard')}
            </a>
            <a
              href="/itineraries"
              className="text-text-secondary hover:text-text-primary transition-colors duration-200 font-medium"
            >
              {t('nav.itineraries', 'Itineraries')}
            </a>
            <a
              href="/chat"
              className="text-text-secondary hover:text-text-primary transition-colors duration-200 font-medium"
            >
              {t('nav.chat', 'Chat')}
            </a>
          </nav>

          {/* Right side controls */}
        <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <select
                className="
                  bg-transparent border border-neutral-300 dark:border-neutral-600
                  rounded-lg px-3 py-2 text-sm
                  text-text-primary
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                  transition-colors duration-200
                "
                defaultValue="en"
                onChange={(e) => {
                  // Language switching logic would go here
                  console.log('Language changed to:', e.target.value);
                }}
                aria-label="Select language"
              >
                <option value="en">English</option>
                <option value="he">עברית</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle size="md" showLabel={false} />

            {/* User Menu */}
            <div className="relative">
              <button
                className="
                  flex items-center space-x-2 p-2 rounded-lg
                  hover:bg-neutral-100 dark:hover:bg-neutral-800
                  transition-colors duration-200
                "
                aria-label="User menu"
              >
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-primary-600 dark:text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <svg
                  className="w-4 h-4 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
                </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-neutral-200 dark:border-neutral-700">
        <div className="px-4 py-2 space-y-1">
          <a
            href="/dashboard"
            className="block px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors duration-200"
          >
            {t('nav.dashboard', 'Dashboard')}
          </a>
          <a
            href="/itineraries"
            className="block px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors duration-200"
          >
            {t('nav.itineraries', 'Itineraries')}
          </a>
          <a
            href="/chat"
            className="block px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors duration-200"
          >
            {t('nav.chat', 'Chat')}
          </a>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;