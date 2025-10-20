'use client';

import React from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { ThemeToggle } from '@/components/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';

interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className = '' }: AppHeaderProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useNextTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <header
      className={`
        bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700
        sticky top-0 z-50 backdrop-blur-sm bg-opacity-95
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
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
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  vAI Travel Agent
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('header.tagline', 'Your AI-powered travel companion')}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="/dashboard"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium"
            >
              {t('nav.dashboard', 'Dashboard')}
            </a>
            <a
              href="/itineraries"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium"
            >
              {t('nav.itineraries', 'Itineraries')}
            </a>
            <a
              href="/chat"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium"
            >
              {t('nav.chat', 'Chat')}
            </a>
          </nav>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Language Selector - English Only */}
            <div className="relative">
              <div className="
                bg-transparent border border-gray-300 dark:border-gray-600
                rounded-lg px-3 py-2 text-sm
                text-gray-900 dark:text-white
                flex items-center space-x-2
              ">
                <span>English</span>
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle size="md" showLabel={false} />

            {/* User Menu */}
            <div className="relative">
              <button
                className="
                  flex items-center space-x-2 p-2 rounded-lg
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition-colors duration-200
                "
                aria-label="User menu"
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
                  className="w-4 h-4 text-gray-600 dark:text-gray-400"
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
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
        <div className="px-4 py-2 space-y-1">
          <a
            href="/dashboard"
            className="block px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            {t('nav.dashboard', 'Dashboard')}
          </a>
          <a
            href="/itineraries"
            className="block px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            {t('nav.itineraries', 'Itineraries')}
          </a>
          <a
            href="/chat"
            className="block px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            {t('nav.chat', 'Chat')}
          </a>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;