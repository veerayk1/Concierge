import Link from 'next/link';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Blog — Concierge',
  description:
    'Insights on property management, building security, resident satisfaction, and property technology from the Concierge team.',
  openGraph: {
    title: 'Blog — Concierge',
    description: 'Insights on property management and building technology.',
    type: 'website',
  },
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Product Updates', value: 'Product Updates' },
  { label: 'Industry Insights', value: 'Industry Insights' },
  { label: 'Security', value: 'Security' },
  { label: 'Tips & Tricks', value: 'Tips & Tricks' },
] as const;

const BLOG_POSTS = [
  {
    slug: 'future-of-condo-management',
    title: 'The Future of Condo Management',
    excerpt:
      'Legacy platforms built in the 2000s are showing their age. Fragmented tools, dated UIs, and missing features are costing property managers hours every week. Here is what the next generation of building management looks like.',
    date: '2026-03-15',
    readTime: '8 min read',
    category: 'Industry Insights',
  },
  {
    slug: 'introducing-role-aware-dashboards',
    title: 'Introducing Role-Aware Dashboards',
    excerpt:
      'Every user role now gets a tailored dashboard. Concierge staff see packages and visitors. Security guards see incidents and FOB tracking. Property managers see maintenance and vendor compliance. No more information overload.',
    date: '2026-03-10',
    readTime: '5 min read',
    category: 'Product Updates',
  },
  {
    slug: 'improve-resident-satisfaction',
    title: '5 Ways to Improve Resident Satisfaction',
    excerpt:
      'Resident satisfaction drives retention and property value. From self-service portals to multi-channel notifications, these five strategies reduce complaints and build community trust.',
    date: '2026-03-08',
    readTime: '6 min read',
    category: 'Tips & Tricks',
  },
  {
    slug: 'security-best-practices-multi-tenant',
    title: 'Security Best Practices for Multi-Tenant Buildings',
    excerpt:
      'Physical security and digital security go hand in hand. FOB management, incident logging, audit trails, and visitor tracking form the foundation of a secure building.',
    date: '2026-02-28',
    readTime: '10 min read',
    category: 'Security',
  },
  {
    slug: 'ai-transforming-property-management',
    title: 'How AI is Transforming Property Management',
    excerpt:
      'From predictive maintenance to smart briefings, AI is changing how property teams operate. We explore practical applications that save time without replacing human judgment.',
    date: '2026-02-20',
    readTime: '7 min read',
    category: 'Industry Insights',
  },
  {
    slug: 'pipeda-compliance-guide',
    title: "A Property Manager's Guide to PIPEDA Compliance",
    excerpt:
      'Canadian privacy law applies to every condo corporation handling resident data. This guide breaks down your obligations under PIPEDA, what data you can collect, and how to handle access requests.',
    date: '2026-02-12',
    readTime: '9 min read',
    category: 'Security',
  },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  'Product Updates': 'bg-blue-50 text-blue-700',
  'Industry Insights': 'bg-green-50 text-green-700',
  Security: 'bg-amber-50 text-amber-700',
  'Tips & Tricks': 'bg-purple-50 text-purple-700',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BlogPage() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-12 text-center md:pt-28 md:pb-16">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight text-neutral-900 md:text-[48px]">
          Blog
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[18px] leading-relaxed text-neutral-600">
          Insights on property management, building technology, and creating better experiences for
          residents and staff.
        </p>
      </section>

      {/* Category filters */}
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <span
              key={cat.value}
              className={`inline-flex cursor-default rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                cat.value === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {cat.label}
            </span>
          ))}
        </div>
      </section>

      {/* Coming soon banner */}
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mt-0.5 shrink-0 text-blue-600"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <p className="text-[14px] font-medium text-blue-900">Coming soon</p>
              <p className="mt-0.5 text-[13px] text-blue-700">
                Full blog articles are in development. Subscribe to our newsletter to get notified
                when new posts are published.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Blog grid */}
      <section className="mx-auto max-w-7xl px-6 pb-20 md:pb-28">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.slug}
              className="group relative rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md"
            >
              {/* Thumbnail placeholder */}
              <div className="aspect-[16/9] rounded-t-xl border-b border-neutral-100 bg-neutral-50" />

              <div className="p-6">
                {/* Category + meta */}
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                      CATEGORY_COLORS[post.category] || 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {post.category}
                  </span>
                  <span className="text-[13px] text-neutral-400">{post.readTime}</span>
                </div>

                {/* Title */}
                <h2 className="mt-3 text-[18px] leading-snug font-semibold text-neutral-900 group-hover:text-neutral-700">
                  <Link
                    href={`/blog/${post.slug}` as never}
                    className="after:absolute after:inset-0"
                  >
                    {post.title}
                  </Link>
                </h2>

                {/* Excerpt */}
                <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-neutral-600">
                  {post.excerpt}
                </p>

                {/* Date */}
                <p className="mt-4 text-[13px] text-neutral-400">{formatDate(post.date)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-neutral-100 bg-neutral-50 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 md:text-[36px]">
            Ready to see Concierge in action?
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-neutral-600">
            Request a personalized demo and discover how Concierge can modernize your building
            management.
          </p>
          <Link
            href={'/demo' as never}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-6 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Request a Demo
          </Link>
        </div>
      </section>
    </div>
  );
}
