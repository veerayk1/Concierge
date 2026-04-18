import Link from 'next/link';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://concierge.app';

export const metadata: Metadata = {
  title: 'Pricing — Concierge',
  description:
    'Simple, transparent pricing for building management. Starter, Professional, and Enterprise tiers with no hidden fees.',
  openGraph: {
    title: 'Pricing — Concierge',
    description:
      'Simple, transparent pricing for building management. Starter, Professional, and Enterprise tiers with no hidden fees.',
    type: 'website',
    url: `${BASE_URL}/pricing`,
    siteName: 'Concierge',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — Concierge',
    description:
      'Simple, transparent pricing for building management. Starter, Professional, and Enterprise tiers with no hidden fees.',
  },
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface PricingTier {
  name: string;
  price: string;
  unit: string;
  description: string;
  cta: string;
  ctaHref: string;
  popular?: boolean;
  features: string[];
}

const TIERS: PricingTier[] = [
  {
    name: 'Starter',
    price: '$2.50',
    unit: '/unit/month',
    description: 'For small buildings getting started with digital management.',
    cta: 'Start Free Trial',
    ctaHref: '/demo',
    features: [
      'Package tracking',
      'Visitor logging',
      'Announcements',
      'Basic reporting',
      'Email notifications',
      'Resident portal',
    ],
  },
  {
    name: 'Professional',
    price: '$4.50',
    unit: '/unit/month',
    description: 'For managed properties that need the full suite.',
    cta: 'Start Free Trial',
    ctaHref: '/demo',
    popular: true,
    features: [
      'Everything in Starter',
      'Maintenance requests',
      'Amenity booking with payments',
      'Security console',
      'Staff training (LMS)',
      'Multi-channel notifications (email, SMS, push)',
      'Role-based access control',
      'Advanced reporting',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    unit: '',
    description: 'For management companies with multiple properties.',
    cta: 'Contact Sales',
    ctaHref: '/contact',
    features: [
      'Everything in Professional',
      'Multi-property management',
      'Custom integrations & API access',
      'Dedicated account manager',
      'SLA guarantee (99.9% uptime)',
      'White-label branding',
      'Data migration assistance',
      'Priority support',
    ],
  },
];

const FEATURE_COMPARISON = [
  { feature: 'Package Tracking', starter: true, professional: true, enterprise: true },
  { feature: 'Visitor Logging', starter: true, professional: true, enterprise: true },
  { feature: 'Announcements', starter: true, professional: true, enterprise: true },
  { feature: 'Resident Portal', starter: true, professional: true, enterprise: true },
  { feature: 'Email Notifications', starter: true, professional: true, enterprise: true },
  { feature: 'Security Console', starter: false, professional: true, enterprise: true },
  { feature: 'Maintenance Requests', starter: false, professional: true, enterprise: true },
  { feature: 'Amenity Booking', starter: false, professional: true, enterprise: true },
  { feature: 'Staff Training', starter: false, professional: true, enterprise: true },
  { feature: 'SMS & Push Notifications', starter: false, professional: true, enterprise: true },
  { feature: 'Role-Based Access', starter: false, professional: true, enterprise: true },
  { feature: 'Advanced Reporting', starter: false, professional: true, enterprise: true },
  { feature: 'Multi-Property', starter: false, professional: false, enterprise: true },
  { feature: 'API Access', starter: false, professional: false, enterprise: true },
  { feature: 'White-Label Branding', starter: false, professional: false, enterprise: true },
  { feature: 'Dedicated Support', starter: false, professional: false, enterprise: true },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PricingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 text-center md:pt-28 md:pb-24">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight text-neutral-900 md:text-[48px]">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[18px] leading-relaxed text-neutral-600">
          No hidden fees. No per-user charges. Just a fair price per unit in your building.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-xl border bg-white p-8 ${
                tier.popular ? 'border-neutral-900 shadow-lg' : 'border-neutral-200'
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-neutral-900 px-3 py-1 text-[12px] font-medium text-white">
                  Most Popular
                </span>
              )}
              <h2 className="text-[20px] font-semibold text-neutral-900">{tier.name}</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[40px] font-bold tracking-tight text-neutral-900">
                  {tier.price}
                </span>
                {tier.unit && <span className="text-[14px] text-neutral-500">{tier.unit}</span>}
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600">
                {tier.description}
              </p>
              <Link
                href={tier.ctaHref as never}
                className={`mt-6 flex h-11 items-center justify-center rounded-xl text-[14px] font-medium transition-colors ${
                  tier.popular
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                    : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {tier.cta}
              </Link>
              <ul className="mt-8 flex flex-col gap-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[14px] text-neutral-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="mt-0.5 shrink-0 text-neutral-400"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="border-t border-neutral-100 bg-neutral-50 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-[28px] font-bold tracking-tight text-neutral-900 md:text-[36px]">
            Feature comparison
          </h2>
          <div className="mt-12 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="pb-4 text-[14px] font-semibold text-neutral-900">Feature</th>
                  <th className="pb-4 text-center text-[14px] font-semibold text-neutral-900">
                    Starter
                  </th>
                  <th className="pb-4 text-center text-[14px] font-semibold text-neutral-900">
                    Professional
                  </th>
                  <th className="pb-4 text-center text-[14px] font-semibold text-neutral-900">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-neutral-100">
                    <td className="py-3 text-[14px] text-neutral-700">{row.feature}</td>
                    <td className="py-3 text-center">
                      {row.starter ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="mx-auto text-neutral-900"
                          aria-label="Included"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className="text-[14px] text-neutral-300" aria-label="Not included">
                          —
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {row.professional ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="mx-auto text-neutral-900"
                          aria-label="Included"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className="text-[14px] text-neutral-300" aria-label="Not included">
                          —
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {row.enterprise ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="mx-auto text-neutral-900"
                          aria-label="Included"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className="text-[14px] text-neutral-300" aria-label="Not included">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-neutral-100 bg-neutral-50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-[24px] font-bold tracking-tight text-neutral-900">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-6">
            {[
              {
                q: 'Is there a free trial?',
                a: 'Yes — every plan includes a 14-day free trial with full access to all features. No credit card required to start.',
              },
              {
                q: 'How is pricing calculated?',
                a: 'Pricing is based on the total number of units in your property. You only pay for active units. Common areas and commercial spaces do not count toward your unit total.',
              },
              {
                q: 'Can I switch plans later?',
                a: 'Absolutely. Upgrade or downgrade at any time. Changes take effect on your next billing cycle. No penalties or lock-in contracts.',
              },
              {
                q: 'What happens to my data if I cancel?',
                a: 'Your data is retained for 90 days after cancellation. You can export everything (CSV, Excel, PDF) at any time. After 90 days, data is securely deleted per our retention policy.',
              },
              {
                q: 'Is my data stored in Canada?',
                a: 'Yes. All data is stored in Canadian data centers. We are fully PIPEDA compliant and offer GDPR compliance for international properties.',
              },
              {
                q: 'Do you offer discounts for multiple properties?',
                a: 'Yes. Management companies with 3+ properties qualify for volume discounts. Contact our sales team for a custom quote.',
              },
              {
                q: 'How long does setup take?',
                a: 'Our onboarding wizard gets you operational in under 30 minutes. Import your units via CSV, invite your staff, and go live — no waiting for support calls.',
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-neutral-200 bg-white p-5">
                <h3 className="text-[15px] font-semibold text-neutral-900">{faq.q}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
        <h2 className="text-[24px] font-bold tracking-tight text-neutral-900">
          Not sure which plan is right?
        </h2>
        <p className="mt-3 text-[16px] text-neutral-600">
          Talk to our team and we will help you find the perfect fit for your property.
        </p>
        <Link
          href={'/contact' as never}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-6 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Request a Demo
        </Link>
      </section>
    </div>
  );
}
