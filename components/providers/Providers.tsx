'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { I18nextProvider } from 'react-i18next';
import { FirebaseProvider } from './FirebaseProvider';
import { ThemeProvider } from './ThemeProvider';
import { AppLayout } from '@/components/layouts/AppLayout';
import { i18n } from '@/lib/i18n';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <FirebaseProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </FirebaseProvider>
        </I18nextProvider>
      </ThemeProvider>
    </NextThemeProvider>
  );
}
