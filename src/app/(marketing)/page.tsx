import type { Metadata } from 'next';
import { HeroSection } from '@/components/marketing/HeroSection';
import { ProblemSection } from '@/components/marketing/ProblemSection';
import { SolutionSection } from '@/components/marketing/SolutionSection';
import { FeaturesGrid } from '@/components/marketing/FeaturesGrid';
import { RoleTabs } from '@/components/marketing/RoleTabs';
import { DesignPhilosophy } from '@/components/marketing/DesignPhilosophy';
import { MetricsSection } from '@/components/marketing/MetricsSection';
import { TestimonialSection } from '@/components/marketing/TestimonialSection';
import { CTASection } from '@/components/marketing/CTASection';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://concierge.app';

export const metadata: Metadata = {
  title: 'Concierge | The Last Platform Your Building Will Ever Need',
  description:
    'Concierge replaces your fragmented tools with one unified system — packages, maintenance, security, amenities, parking, and everything in between — designed for the people who actually run buildings.',
  openGraph: {
    title: 'Concierge | Building Management, Reimagined',
    description:
      'One platform. Every building. No compromises. Packages, maintenance, security logs, visitor management, amenity bookings, parking, resident communications, and more.',
    type: 'website',
    url: BASE_URL,
    siteName: 'Concierge',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Concierge | Building Management, Reimagined',
    description:
      'One platform. Every building. No compromises.',
  },
};

// ---------------------------------------------------------------------------
// JSON-LD Structured Data
// ---------------------------------------------------------------------------

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Concierge',
  url: BASE_URL,
  description:
    'Next-generation condo and building management platform. Packages, maintenance, security, amenities, parking — all unified.',
  logo: `${BASE_URL}/logo.png`,
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    url: `${BASE_URL}/contact`,
  },
};

// ---------------------------------------------------------------------------
// Page — 10 sections, top to bottom
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* Section 0: Preloader is rendered in layout.tsx */}

      {/* Section 1: Hero */}
      <HeroSection />

      {/* Section 2: Problem Statement / "The Old Way" */}
      <ProblemSection />

      {/* Section 3: The Solution / Product Introduction */}
      <SolutionSection />

      {/* Section 4: Core Feature Pillars */}
      <FeaturesGrid />

      {/* Section 5: Role-Based Experience */}
      <RoleTabs />

      {/* Section 6: Design Philosophy */}
      <DesignPhilosophy />

      {/* Section 7: Metrics / Social Proof */}
      <MetricsSection />

      {/* Section 8: Testimonial / Quote */}
      <TestimonialSection />

      {/* Section 9: CTA / Closing Section */}
      <CTASection />

      {/* Section 10: Footer is rendered in layout.tsx */}
    </>
  );
}
