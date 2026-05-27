import Link from 'next/link';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// SEO Metadata
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://concierge.app';

const SEO_TITLE =
  'The Concierge Field Notes | Property Management, Building Operations & Resident Experience';
const SEO_DESCRIPTION =
  'Insights for property managers, condo boards, and concierge teams. Building operations playbooks, security best practices, resident experience tactics, and product changelogs from the Concierge team.';

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  keywords: [
    'property management blog',
    'condo management insights',
    'building operations playbook',
    'concierge team training',
    'resident experience',
    'HOA best practices',
    'property technology blog',
    'PropTech insights',
    'multi-family operations',
  ],
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    type: 'website',
    url: `${BASE_URL}/blog`,
    siteName: 'Concierge',
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
  },
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const POSTS = [
  {
    slug: 'future-of-condo-management',
    title: 'The future of condo management software',
    excerpt:
      'Legacy platforms built in the 2000s are showing their age. Fragmented tools, dated UIs, and missing features cost property managers hours every week. Here is what the next generation of building management looks like.',
    date: '2026-03-15',
    readTime: '8 min read',
    category: 'Industry Insights',
    featured: true,
    accent: '#C9A96E',
  },
  {
    slug: 'introducing-role-aware-dashboards',
    title: 'Introducing role-aware dashboards',
    excerpt:
      'Every user role now gets a tailored dashboard. Concierge staff see packages and visitors. Security guards see incidents and FOB tracking. Property managers see maintenance and vendor compliance. No more information overload.',
    date: '2026-03-10',
    readTime: '5 min read',
    category: 'Product Updates',
    accent: '#5BD493',
  },
  {
    slug: 'improve-resident-satisfaction',
    title: '5 ways to improve resident satisfaction in a high-rise',
    excerpt:
      'Resident satisfaction drives retention and property value. From self-service portals to multi-channel notifications, these five strategies reduce complaints and build community trust.',
    date: '2026-03-08',
    readTime: '6 min read',
    category: 'Tips & Tricks',
    accent: '#62C7E5',
  },
  {
    slug: 'security-best-practices-multi-tenant',
    title: 'Security best practices for multi-tenant buildings',
    excerpt:
      'Physical security and digital security go hand in hand. FOB management, incident logging, audit trails, and visitor tracking form the foundation of a secure building.',
    date: '2026-02-28',
    readTime: '10 min read',
    category: 'Security',
    accent: '#F47B7B',
  },
  {
    slug: 'ai-transforming-property-management',
    title: 'How AI is transforming property management',
    excerpt:
      'From predictive maintenance to AI-assisted shift briefings, artificial intelligence is changing how property teams operate. We explore practical applications that save time without replacing human judgment.',
    date: '2026-02-20',
    readTime: '7 min read',
    category: 'Industry Insights',
    accent: '#B292FF',
  },
  {
    slug: 'pipeda-compliance-guide',
    title: "A property manager's guide to PIPEDA compliance",
    excerpt:
      'Canadian privacy law applies to every condo corporation and rental property. Here is the practical guide to PIPEDA: what data you can collect, how long to retain it, and how to handle DSAR requests.',
    date: '2026-02-12',
    readTime: '11 min read',
    category: 'Security',
    accent: '#7C9CFF',
  },
  {
    slug: 'amenity-booking-strategies',
    title: 'Amenity booking strategies that actually work',
    excerpt:
      'BBQ pits booked every weekend by the same unit. Party room double-booked. Gym overcrowded at 6pm. We share approval workflows and conflict-detection patterns that keep amenity access fair and predictable.',
    date: '2026-02-04',
    readTime: '6 min read',
    category: 'Tips & Tricks',
    accent: '#E89B6F',
  },
  {
    slug: 'package-management-holidays',
    title: 'Package management software during the holidays',
    excerpt:
      'Black Friday through New Year is the busiest stretch of the year for any front desk. Bulk intake, perishable flags, and aging-shelf alerts make the difference between a calm lobby and a customer-service crisis.',
    date: '2026-01-22',
    readTime: '5 min read',
    category: 'Tips & Tricks',
    accent: '#A5D5A8',
  },
  {
    slug: 'visitor-management-modern-condo',
    title: 'Modern visitor management for condo buildings',
    excerpt:
      'Pre-authorized arrivals, photo capture, ID verification, parking pass linkage. Visitor management has evolved past the paper sign-in book — here is what the modern stack looks like.',
    date: '2026-01-10',
    readTime: '7 min read',
    category: 'Industry Insights',
    accent: '#C9A96E',
  },
];

const CATEGORIES = [
  { label: 'All', value: 'all', accent: '#C9A96E' },
  { label: 'Industry Insights', value: 'Industry Insights', accent: '#C9A96E' },
  { label: 'Product Updates', value: 'Product Updates', accent: '#5BD493' },
  { label: 'Security', value: 'Security', accent: '#F47B7B' },
  { label: 'Tips & Tricks', value: 'Tips & Tricks', accent: '#62C7E5' },
] as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BlogPage() {
  const featured = POSTS.find((p) => p.featured);
  const rest = POSTS.filter((p) => !p.featured);

  return (
    <>
      {/* ============================ HERO ============================ */}
      <section
        style={{
          position: 'relative',
          background: '#0A0A0A',
          color: '#fff',
          marginTop: -72,
          paddingTop: 'calc(72px + 5rem)',
          paddingBottom: '3rem',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 900px 600px at 50% 25%, rgba(201,169,110,0.16), transparent 65%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, #000 30%, transparent 85%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 80% 70% at 50% 50%, #000 30%, transparent 85%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            maxWidth: 1080,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: 999,
              background: 'rgba(201,169,110,0.08)',
              border: '1px solid rgba(201,169,110,0.18)',
              fontSize: '0.8125rem',
              color: 'rgba(212,186,133,0.9)',
              marginBottom: '2rem',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#C9A96E',
                boxShadow: '0 0 0 4px rgba(201,169,110,0.18)',
              }}
            />
            Field notes for property teams · Updated monthly
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              lineHeight: 1.05,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            Field notes from{' '}
            <span style={{ color: '#C9A96E', fontStyle: 'italic', fontWeight: 400 }}>
              the property floor.
            </span>
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.1875rem)',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.65)',
              maxWidth: 720,
              margin: '1.5rem auto 0',
            }}
          >
            Operational playbooks, product updates, security deep-dives, and the occasional rant.
            Written for property managers, board directors, concierge teams, and the rest of us who
            care about how buildings actually run.
          </p>
        </div>
      </section>

      {/* ============================ CATEGORY STRIP ============================ */}
      <section
        style={{
          background: '#0E0E0E',
          color: '#fff',
          padding: '2rem 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {CATEGORIES.map((c, idx) => (
            <span
              key={c.value}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 999,
                background: idx === 0 ? 'rgba(201,169,110,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${
                  idx === 0 ? 'rgba(201,169,110,0.3)' : 'rgba(255,255,255,0.08)'
                }`,
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: idx === 0 ? '#C9A96E' : 'rgba(255,255,255,0.75)',
              }}
            >
              {c.label}
            </span>
          ))}
        </div>
      </section>

      {/* ============================ FEATURED POST ============================ */}
      {featured && (
        <section
          style={{
            background: '#0E0E0E',
            color: '#fff',
            padding: '3rem 0',
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: '0 auto',
              padding: '0 clamp(1.5rem, 4vw, 3rem)',
            }}
          >
            <article
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 24,
                background:
                  'linear-gradient(135deg, rgba(201,169,110,0.10), rgba(255,255,255,0.03))',
                border: '1px solid rgba(201,169,110,0.2)',
                padding: 'clamp(2rem, 5vw, 4rem)',
              }}
            >
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: -120,
                  right: -120,
                  width: 360,
                  height: 360,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(201,169,110,0.18), transparent 70%)',
                  filter: 'blur(40px)',
                  pointerEvents: 'none',
                }}
              />
              <div style={{ position: 'relative', maxWidth: 720 }}>
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#C9A96E',
                    margin: 0,
                  }}
                >
                  Featured · {featured.category}
                </p>
                <h2
                  style={{
                    fontSize: 'clamp(1.875rem, 4vw, 2.875rem)',
                    fontWeight: 600,
                    lineHeight: 1.15,
                    letterSpacing: '-0.02em',
                    color: '#fff',
                    margin: '0.75rem 0 1.25rem',
                  }}
                >
                  {featured.title}
                </h2>
                <p
                  style={{
                    fontSize: '1.0625rem',
                    lineHeight: 1.65,
                    color: 'rgba(255,255,255,0.7)',
                    margin: 0,
                  }}
                >
                  {featured.excerpt}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginTop: '2rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <Link href={`/blog/${featured.slug}` as never} className="btn-primary">
                    Read the article
                  </Link>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      color: 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {formatDate(featured.date)} · {featured.readTime}
                  </span>
                </div>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* ============================ POST GRID ============================ */}
      <section
        style={{
          background: '#0E0E0E',
          color: '#fff',
          padding: '3rem 0 6rem',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {rest.map((post) => (
              <article
                key={post.slug}
                style={{
                  position: 'relative',
                  padding: '2rem',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${post.accent}, transparent 80%)`,
                  }}
                />
                <p
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: post.accent,
                    margin: 0,
                  }}
                >
                  {post.category}
                </p>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    lineHeight: 1.3,
                    color: '#fff',
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  <Link
                    href={`/blog/${post.slug}` as never}
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                    }}
                  >
                    {post.title}
                  </Link>
                </h3>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    lineHeight: 1.65,
                    color: 'rgba(255,255,255,0.6)',
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {post.excerpt}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                    {formatDate(post.date)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                    {post.readTime}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ NEWSLETTER CTA ============================ */}
      <section
        style={{
          background: '#0A0A0A',
          color: '#fff',
          padding: '6rem 0 8rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 800px 500px at 50% 80%, rgba(201,169,110,0.12), transparent 65%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          style={{
            position: 'relative',
            maxWidth: 720,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#fff',
              margin: 0,
            }}
          >
            One short email a month. No fluff.
          </h2>
          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.6)',
              margin: '1.25rem auto 2.5rem',
              maxWidth: 580,
            }}
          >
            New product features, our best operational playbooks, and the rare deep- dive that takes
            us a week to write. Free, easy to unsubscribe, never sold.
          </p>
          <Link href={'/contact' as never} className="btn-primary">
            Subscribe via the contact form
          </Link>
        </div>
      </section>
    </>
  );
}
