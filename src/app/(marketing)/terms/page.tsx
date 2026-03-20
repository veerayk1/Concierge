import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Concierge',
  description: 'Terms and conditions for using the Concierge building management platform.',
};

const LAST_UPDATED = 'March 20, 2026';

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-[32px] font-bold tracking-tight text-neutral-900">Terms of Service</h1>
      <p className="mt-2 text-[14px] text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-neutral mt-10 max-w-none text-[15px] leading-relaxed text-neutral-700">
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">1. Acceptance of Terms</h2>
          <p className="mt-3">
            By accessing or using the Concierge platform (&quot;Service&quot;), you agree to be
            bound by these Terms of Service (&quot;Terms&quot;). If you are using the Service on
            behalf of a property management company, condominium corporation, or other organization,
            you represent that you have the authority to bind that organization to these Terms.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">2. Description of Service</h2>
          <p className="mt-3">
            Concierge is a cloud-based building management platform that provides tools for property
            management, security operations, resident services, maintenance tracking, amenity
            bookings, and communication. The Service is provided on a subscription basis.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">3. Account Responsibilities</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              You are responsible for maintaining the confidentiality of your account credentials
            </li>
            <li>You must notify us immediately of any unauthorized access to your account</li>
            <li>You are responsible for all activity that occurs under your account</li>
            <li>Account sharing is prohibited; each user must have their own credentials</li>
            <li>
              Property Administrators are responsible for managing user access within their property
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">4. Acceptable Use</h2>
          <p className="mt-3">You agree not to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Use the Service for any unlawful purpose</li>
            <li>Upload malicious code, viruses, or harmful content</li>
            <li>Attempt to gain unauthorized access to other accounts or systems</li>
            <li>Interfere with the proper operation of the Service</li>
            <li>Use the Service to harass, discriminate against, or threaten any individual</li>
            <li>Scrape, crawl, or data-mine the Service without written permission</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">5. Data Ownership</h2>
          <p className="mt-3">
            You retain ownership of all data you upload to the Service. Concierge does not claim
            ownership of your property data, resident information, or uploaded content. We process
            your data solely to provide the Service as described in our Privacy Policy.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">6. Service Availability</h2>
          <p className="mt-3">
            We strive for 99.9% uptime but do not guarantee uninterrupted service. We may perform
            scheduled maintenance with advance notice. We are not liable for downtime caused by
            factors outside our reasonable control, including internet outages, hardware failures at
            third-party providers, or force majeure events.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">7. Billing and Payments</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Subscription fees are billed monthly or annually as selected</li>
            <li>All prices are in Canadian Dollars (CAD) unless otherwise stated</li>
            <li>
              Fees are non-refundable except as required by applicable consumer protection laws
            </li>
            <li>We reserve the right to modify pricing with 30 days advance notice</li>
            <li>Failure to pay may result in suspension or termination of your account</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">8. Termination</h2>
          <p className="mt-3">
            Either party may terminate the subscription with 30 days written notice. Upon
            termination, your data will be available for export for 90 days, after which it will be
            permanently deleted. We may immediately terminate accounts that violate these Terms.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">9. Limitation of Liability</h2>
          <p className="mt-3">
            To the maximum extent permitted by law, Concierge shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, including but not limited to
            loss of profits, data, or business opportunities. Our total liability shall not exceed
            the amount you paid for the Service in the 12 months preceding the claim.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">10. Governing Law</h2>
          <p className="mt-3">
            These Terms are governed by the laws of the Province of Ontario and the federal laws of
            Canada applicable therein. Any disputes arising from these Terms shall be resolved in
            the courts of Ontario, Canada.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">11. Contact</h2>
          <p className="mt-3">
            For questions about these Terms, contact us at{' '}
            <a href="mailto:legal@concierge.com" className="font-medium text-neutral-900 underline">
              legal@concierge.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
