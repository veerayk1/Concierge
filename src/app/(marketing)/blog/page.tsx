import Link from 'next/link';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Blog — Concierge',
  description:
    'Insights on building management, resident satisfaction, security best practices, and property technology from the Concierge team.',
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const BLOG_POSTS = [
  {
    slug: 'future-of-condo-management',
    title: 'The Future of Condo Management',
    excerpt:
      'Legacy platforms built in the 2000s are showing their age. Fragmented tools, dated UIs, and missing features are costing property managers hours every week. Here is what the next generation of building management looks like.',
    date: '2026-03-15',
    readTime: '8 min read',
    category: 'Industry',
  },
  {
    slug: 'improve-resident-satisfaction',
    title: '5 Ways to Improve Resident Satisfaction',
    excerpt:
      'Resident satisfaction drives retention and property value. From self-service portals to multi-channel notifications, these five strategies reduce complaints and build community trust.',
    date: '2026-03-08',
    readTime: '6 min read',
    category: 'Best Practices',
  },
  {
    slug: 'security-best-practices-multi-tenant',
    title: 'Security Best Practices for Multi-Tenant Buildings',
    excerpt:
      'Physical security and digital security go hand in hand. FOB management, incident logging, audit trails, and visitor tracking form the foundation of a secure building. Here is how to get it right.',
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
    category: 'Technology',
  },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Industry: 'bg-blue-50 text-blue-700',
  'Best Practices': 'bg-green-50 text-green-700',
  Security: 'bg-amber-50 text-amber-700',
  Technology: 'bg-purple-50 text-purple-700',
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
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 text-center md:pt-28 md:pb-24">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight text-neutral-900 md:text-[48px]">
          Blog
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[18px] leading-relaxed text-neutral-600">
          Insights on building management, property technology, and creating better experiences for
          residents and staff.
        </p>
      </section>

      {/* Blog grid */}
      <section className="mx-auto max-w-7xl px-6 pb-20 md:pb-28">
        <div className="grid gap-6 sm:grid-cols-2">
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
                <h2 className="mt-3 text-[20px] leading-snug font-semibold text-neutral-900 group-hover:text-neutral-700">
                  <Link
                    href={`/blog/${post.slug}` as never}
                    className="after:absolute after:inset-0"
                  >
                    {post.title}
                  </Link>
                </h2>

                {/* Excerpt */}
                <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">{post.excerpt}</p>

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
