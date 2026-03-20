import type { Metadata } from 'next';
import Link from 'next/link';
import PropertyLoginForm from './PropertyLoginForm';

// ---------------------------------------------------------------------------
// Mock property data (replaced by database lookup in production)
// ---------------------------------------------------------------------------

const MOCK_PROPERTIES: Record<
  string,
  { name: string; logo?: string; primaryColor: string; unitCount: number }
> = {
  'maple-ridge-condos': {
    name: 'Maple Ridge Condos',
    primaryColor: '#1e40af',
    unitCount: 245,
  },
  'harbourview-towers': {
    name: 'Harbourview Towers',
    primaryColor: '#059669',
    unitCount: 312,
  },
  'queensway-park': {
    name: 'Queensway Park Condos',
    primaryColor: '#7c3aed',
    unitCount: 171,
  },
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function lookupProperty(slug: string) {
  return MOCK_PROPERTIES[slug] ?? null;
}

// ---------------------------------------------------------------------------
// Dynamic Metadata
// ---------------------------------------------------------------------------

interface PageParams {
  params: Promise<{ 'property-slug': string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { 'property-slug': slug } = await params;
  const property = lookupProperty(slug);

  if (!property) {
    return {
      title: 'Property Not Found | Concierge',
      description: 'The requested property could not be found.',
    };
  }

  return {
    title: `Sign In | ${property.name} | Concierge`,
    description: `Sign in to the ${property.name} resident portal on Concierge.`,
  };
}

// ---------------------------------------------------------------------------
// Not Found View
// ---------------------------------------------------------------------------

function PropertyNotFound({ slug }: { slug: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-[420px] text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
          <svg
            className="h-8 w-8 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
            />
          </svg>
        </div>

        <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
          Property not found
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-500">
          We couldn&apos;t find a property matching{' '}
          <span className="font-medium text-neutral-700">&ldquo;{slug}&rdquo;</span>. Check the URL
          or contact your property manager for the correct link.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href={'/login' as never}
            className="inline-flex h-[48px] w-full items-center justify-center rounded-xl bg-neutral-900 text-[15px] font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            Go to Main Login
          </Link>
          <Link
            href={'/' as never}
            className="text-[14px] text-neutral-500 transition-colors hover:text-neutral-700"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function PropertyLoginPage({ params }: PageParams) {
  const { 'property-slug': slug } = await params;
  const property = lookupProperty(slug);

  if (!property) {
    return <PropertyNotFound slug={slug} />;
  }

  return <PropertyLoginForm property={property} slug={slug} />;
}
