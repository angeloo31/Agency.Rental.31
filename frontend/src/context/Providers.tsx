'use client';

import React from 'react';
import { AuthProvider } from './AuthContext';
import { LanguageProvider } from './LanguageContext';
import { BookingProvider } from './BookingContext';
import { ConfirmProvider } from './ConfirmContext';
import { Toaster } from 'react-hot-toast';

import { SettingsProvider, SiteSettings } from './SettingsContext';

export function Providers({ children, initialSettings }: { children: React.ReactNode, initialSettings?: SiteSettings | null }) {
  return (
    <SettingsProvider initialSettings={initialSettings}>
      <LanguageProvider>
        <ConfirmProvider>
          <AuthProvider>
            <BookingProvider>
              {children}
              <Toaster position="bottom-right" />
            </BookingProvider>
          </AuthProvider>
        </ConfirmProvider>
      </LanguageProvider>
    </SettingsProvider>
  );
}
