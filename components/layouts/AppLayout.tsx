'use client';

import { ReactNode } from 'react';
import { AppHeader } from '@/components/layouts/AppHeader';
import { AppSidebar } from '@/components/layouts/AppSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
