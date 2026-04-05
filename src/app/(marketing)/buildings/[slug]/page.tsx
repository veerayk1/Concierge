import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/server/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PropertyData {
  name: string;
  address: string;
  city: string;
  province: string;
  logo: string | null;
  unitCount: number;
  branding: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getProperty(slug: string): Promise<PropertyData | null> {
  try {
    const property = await prisma.property.findFirst({
      where: {
        slug: slug.toLowerCase(),
        isActive: true,
        deletedAt: null,
      },
      select: {
        name: true,
        address: true,
        city: true,
        province: true,
        logo: true,
        unitCount: true,
        branding: true,
      },
    });
    if (!property) return null;
    return {
      ...property,
      branding: property.branding as Record<string, unknown> | null,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Quick Links
// ---------------------------------------------------------------------------

const QUICK_LINKS = [
  {
    title: 'Book Amenity',
    description: 'Reserve party rooms, gyms, guest suites, and more.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    ),
  },
  {
    title: 'Track Package',
    description: 'Check the status of your deliveries in real time.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5"><path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    ),
  },
  {
    title: 'Submit Request',
    description: 'Report maintenance issues with photo uploads.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
    ),
  },
  {
    title: 'Register Visitor',
    description: 'Pre-authorize guests for seamless check-in.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    ),
  },
  {
    title: 'View Announcements',
    description: 'Stay updated with building news and notices.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" /></svg>
    ),
  },
  {
    title: 'Contact Management',
    description: 'Reach your property management office.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) {
    return { title: 'Property Not Found | Concierge' };
  }

  return {
    title: `${property.name} | Concierge`,
    description: `Access the resident portal for ${property.name} at ${property.address}, ${property.city}.`,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PropertyVanityPage({ params }: PageParams) {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center"
        style={{ background: '#0A0A0A', fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 4.5vw, 4rem)',
            fontWeight: 300,
            color: '#ffffff',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            marginBottom: '1.5rem',
          }}
        >
          Property Not Found
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
          The property you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/"
          className="btn-primary"
          style={{
            background: '#C9A96E',
            color: '#0A0A0A',
            padding: '1rem 2.5rem',
            borderRadius: '100px',
            fontWeight: 500,
            fontSize: '0.9375rem',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const primaryColor =
    (property.branding as Record<string, unknown> | null)?.primary_color as string | undefined;
  const accentColor = primaryColor || '#C9A96E';

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Hero Section */}
      <section
        style={{
          height: '60vh',
          minHeight: '400px',
          background: `linear-gradient(to bottom, rgba(10,10,10,0.7), rgba(10,10,10,0.85)), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        {property.logo && (
          <div style={{ marginBottom: '1.5rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={property.logo}
              alt={`${property.name} logo`}
              style={{
                height: '64px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
              }}
            />
          </div>
        )}

        <h1
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            fontWeight: 300,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          {property.name}
        </h1>

        <p
          style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
            color: 'rgba(255,255,255,0.6)',
            marginTop: '0.75rem',
            fontWeight: 400,
            letterSpacing: '-0.01em',
          }}
        >
          {property.address}, {property.city}, {property.province}
        </p>

        <Link
          href="/login"
          style={{
            marginTop: '2rem',
            display: 'inline-block',
            background: accentColor,
            color: '#0A0A0A',
            padding: '1rem 2.5rem',
            borderRadius: '100px',
            fontWeight: 500,
            fontSize: '0.9375rem',
            letterSpacing: '0.02em',
            textDecoration: 'none',
            transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          Resident Login
        </Link>
      </section>

      {/* Quick Links Grid */}
      <section
        style={{
          background: '#FAFAF8',
          padding: 'clamp(3rem, 8vh, 5rem) clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.title}
                href="/login"
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #E8E6E1',
                  textDecoration: 'none',
                  transition: 'transform 300ms ease, box-shadow 300ms ease',
                  display: 'block',
                }}
              >
                <div style={{ marginBottom: '0.75rem' }}>{link.icon}</div>
                <h3
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    color: '#1A1A1A',
                    marginBottom: '0.25rem',
                  }}
                >
                  {link.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6B6B6B', lineHeight: 1.6, margin: 0 }}>
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Building Information */}
      <section
        style={{
          background: '#ffffff',
          padding: 'clamp(3rem, 8vh, 5rem) clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '3rem',
            }}
          >
            {/* About */}
            <div>
              <h2
                style={{
                  fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
                  fontWeight: 300,
                  color: '#1A1A1A',
                  letterSpacing: '-0.01em',
                  marginBottom: '1rem',
                }}
              >
                About
              </h2>
              <p
                style={{
                  fontSize: '1.125rem',
                  color: '#6B6B6B',
                  lineHeight: 1.7,
                }}
              >
                {property.name} is a premier residential address in {property.city},{' '}
                {property.province}
                {property.unitCount > 0
                  ? `, offering ${property.unitCount} suites`
                  : ''}
                . Managed through the Concierge platform, residents enjoy seamless access to amenity
                bookings, package tracking, maintenance requests, and building communications.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2
                style={{
                  fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
                  fontWeight: 300,
                  color: '#1A1A1A',
                  letterSpacing: '-0.01em',
                  marginBottom: '1rem',
                }}
              >
                Contact
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Concierge Desk', value: 'Available via portal' },
                  { label: 'Hours', value: '24/7 Concierge | Management Office M-F 9-5' },
                  { label: 'Address', value: `${property.address}, ${property.city}` },
                ].map((item) => (
                  <div key={item.label}>
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        color: '#1A1A1A',
                        letterSpacing: '0.02em',
                        marginBottom: '0.125rem',
                      }}
                    >
                      {item.label}
                    </p>
                    <p style={{ fontSize: '1rem', color: '#6B6B6B', margin: 0 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightweight Footer */}
      <footer
        style={{
          background: '#0E0E0E',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '2rem clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <span
            style={{
              fontWeight: 300,
              fontSize: '1.25rem',
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            Concierge
          </span>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link
              href="/privacy"
              style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
            >
              Terms
            </Link>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
              &copy; 2026 Concierge
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
