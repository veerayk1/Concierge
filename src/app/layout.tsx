/**
 * Concierge — Root Layout
 *
 * Applies global fonts (Inter + Inter Display via next/font/google),
 * imports global styles, sets up CSP nonce, and wraps the app in providers.
 */

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';

import '@/styles/globals.css';
import { Providers } from '@/components/layout/providers';
import { ServiceWorkerRegister } from '@/components/layout/service-worker-register';

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Note: Inter Display is not available on Google Fonts as a separate family.
// We use Inter with optical sizing which activates display-grade alternates
// at larger sizes. The CSS variable is set for design-token compatibility.

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'BuildingAutopilot | Building Management Portal',
  description:
    'Next-generation condo and building management portal with role-aware interfaces, unified event logging, and Apple-grade design.',
  robots: { index: false, follow: false },
  manifest: '/manifest.webmanifest',
  applicationName: 'BuildingAutopilot',
  appleWebApp: {
    capable: true,
    title: 'BuildingAutopilot',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', sizes: '180x180' }],
  },
};

// Viewport must be in a separate export per Next 15. The
// viewport-fit=cover line is what lets the app actually use the
// safe-area insets on iPhones with a notch / Dynamic Island when
// installed to the home screen.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-white antialiased">
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
