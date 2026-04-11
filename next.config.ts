// Prisma client regenerated — full 131 model support
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  serverExternalPackages: [
    'argon2',
    'pino',
    'pino-pretty',
    'isomorphic-dompurify',
    'jsdom',
    'dompurify',
    'socket.io',
    'socket.io-client',
    'bullmq',
    'ioredis',
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

  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.claude/**',
          '**/.git/**',
          '**/private/tmp/**',
          '**/*.output',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
