/**
 * Concierge — Root Layout
 *
 * Applies global fonts (Inter + Inter Display via next/font/google),
 * imports global styles, sets up CSP nonce, and wraps the app in providers.
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';

import '@/styles/globals.css';
import { Providers } from '@/components/layout/providers';

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
  title: 'Concierge | Building Management Portal',
  description:
    'Next-generation condo and building management portal with role-aware interfaces, unified event logging, and Apple-grade design.',
  robots: { index: false, follow: false },
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-white antialiased">
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: '',
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
