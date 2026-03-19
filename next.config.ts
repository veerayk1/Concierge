import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  output: 'standalone',

  serverExternalPackages: [
    'argon2',
    'pino',
    'pino-pretty',
    'isomorphic-dompurify',
    'jsdom',
    'dompurify',
  ],

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/concierge-*/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/.well-known/security.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
      },
    ];
  },

  typedRoutes: true,
};

export default nextConfig;
