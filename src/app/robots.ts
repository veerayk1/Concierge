import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://buildingautopilot.ca';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/features',
          '/for-teams',
          '/about',
          '/contact',
          '/security-privacy',
          '/blog',
          '/demo',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/portal/',
          '/admin/',
          '/settings/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/_next/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
