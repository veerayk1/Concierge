import Link from 'next/link';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Terms of Service — Concierge',
  description:
    'Terms and conditions for using the Concierge building management platform. Governed by the laws of Ontario, Canada.',
  openGraph: {
    title: 'Terms of Service — Concierge',
    description: 'Terms and conditions for the Concierge building management platform.',
    type: 'website',
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const LAST_UPDATED = 'March 20, 2026';

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
      <h1 className="text-[32px] font-bold tracking-tight text-neutral-900">Terms of Service</h1>
      <p className="mt-2 text-[14px] text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 max-w-none text-[15px] leading-relaxed text-neutral-700">
        {/* 1. Acceptance of Terms */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">1. Acceptance of Terms</h2>
          <p className="mt-3">
            By accessing or using the Concierge platform (&quot;Service&quot;), you agree to be
            bound by these Terms of Service (&quot;Terms&quot;). If you are using the Service on
            behalf of a property management company, condominium corporation, homeowners
            association, or other organization, you represent that you have the authority to bind
            that organization to these Terms. If you do not agree to these Terms, you must not use
            the Service.
          </p>
        </section>

        {/* 2. Description of Service */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">2. Description of Service</h2>
          <p className="mt-3">
            Concierge is a cloud-based building management platform that provides tools for:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Property and unit management with configurable fields</li>
            <li>
              Security operations including visitor logging, incident reporting, and FOB/key
              tracking
            </li>
            <li>Package tracking with courier-branded cards and notification workflows</li>
            <li>Maintenance request management with photo uploads and vendor assignment</li>
            <li>Amenity booking with calendar views and approval workflows</li>
            <li>Multi-channel communication (email, SMS, push notifications)</li>
            <li>Resident self-service portal</li>
            <li>Staff training and compliance management</li>
            <li>Reporting and analytics</li>
          </ul>
          <p className="mt-3">
            The Service is provided on a subscription basis. Features available depend on your
            selected plan (Starter, Professional, or Enterprise).
          </p>
        </section>

        {/* 3. Account Terms */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">3. Account Terms</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              Accounts are created by Property Administrators. There is no self-registration. This
              is by design for security-sensitive building environments.
            </li>
            <li>
              You are responsible for maintaining the confidentiality of your account credentials.
            </li>
            <li>You must notify us immediately of any unauthorized access to your account.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>
              Account sharing is prohibited. Each user must have their own unique credentials.
            </li>
            <li>
              Property Administrators are responsible for managing user access, assigning roles, and
              deactivating accounts for departing staff or residents.
            </li>
            <li>
              Multi-factor authentication (MFA) may be required by your Property Administrator. We
              strongly recommend enabling MFA for all accounts.
            </li>
          </ul>
        </section>

        {/* 4. Acceptable Use */}
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
            <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            <li>
              Use the Service to store or process data unrelated to building management operations
            </li>
            <li>
              Exceed reasonable usage limits or use the Service in a way that degrades performance
              for other users
            </li>
          </ul>
        </section>

        {/* 5. Data Ownership */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">5. Data Ownership</h2>
          <p className="mt-3">
            You retain full ownership of all data you upload to the Service. Concierge does not
            claim ownership of your property data, resident information, uploaded documents,
            photographs, or any other content you create within the platform.
          </p>
          <p className="mt-3">
            We process your data solely to provide the Service as described in our{' '}
            <Link href={'/privacy' as never} className="font-medium text-neutral-900 underline">
              Privacy Policy
            </Link>
            . We will never sell, license, or monetize your data. You may export your data at any
            time in standard formats (CSV, JSON, PDF).
          </p>
          <p className="mt-3">
            You grant Concierge a limited license to process, store, and transmit your data solely
            for the purpose of providing and improving the Service.
          </p>
        </section>

        {/* 6. Payment Terms */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">6. Payment Terms</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              Subscription fees are billed monthly or annually as selected at the time of purchase.
            </li>
            <li>
              All prices are in Canadian Dollars (CAD) unless otherwise stated in your agreement.
            </li>
            <li>
              Pricing is per unit per month. The total subscription cost is calculated based on the
              number of units in your property.
            </li>
            <li>
              Payment is processed through Stripe. We do not store credit card numbers on our
              servers.
            </li>
            <li>
              Annual subscriptions are billed upfront for the full year. Monthly subscriptions are
              billed on the same day each month.
            </li>
            <li>
              Fees are non-refundable except as required by applicable consumer protection laws or
              as specified in your Enterprise agreement.
            </li>
            <li>
              We reserve the right to modify pricing with 30 days advance written notice. Price
              changes will not apply to the current billing period.
            </li>
            <li>
              If payment fails, we will attempt to charge the payment method on file for 7 days.
              After 14 days of failed payment, the account may be suspended. After 30 days, the
              account may be terminated.
            </li>
            <li>
              Taxes (HST/GST) are applied based on your province of residence and are added to the
              subscription price.
            </li>
          </ul>
        </section>

        {/* 7. Service Level Agreement (SLA) */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">
            7. Service Level Agreement (SLA)
          </h2>
          <p className="mt-3">We commit to the following service levels for all paid plans:</p>
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[13px] font-semibold tracking-wider text-neutral-400 uppercase">
                  Uptime Guarantee
                </p>
                <p className="mt-1 text-[24px] font-bold text-neutral-900">99.9%</p>
                <p className="mt-1 text-[13px] text-neutral-600">
                  Measured monthly, excluding scheduled maintenance
                </p>
              </div>
              <div>
                <p className="text-[13px] font-semibold tracking-wider text-neutral-400 uppercase">
                  Scheduled Maintenance
                </p>
                <p className="mt-1 text-[14px] text-neutral-700">
                  Maintenance windows are scheduled during off-peak hours (2:00 AM - 5:00 AM ET)
                  with at least 48 hours advance notice.
                </p>
              </div>
            </div>
          </div>
          <p className="mt-4">
            <strong>SLA Credits:</strong> If monthly uptime falls below 99.9%, affected customers
            are eligible for service credits:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>99.0% - 99.9% uptime: 10% credit on monthly fees</li>
            <li>95.0% - 99.0% uptime: 25% credit on monthly fees</li>
            <li>Below 95.0% uptime: 50% credit on monthly fees</li>
          </ul>
          <p className="mt-3">
            Credit requests must be submitted within 30 days of the downtime event. Credits are
            applied to future invoices and do not exceed one month of fees.
          </p>
        </section>

        {/* 8. Intellectual Property */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">8. Intellectual Property</h2>
          <p className="mt-3">
            The Service, including its design, code, features, documentation, and branding, is owned
            by Concierge and protected by intellectual property laws. Your subscription grants you a
            non-exclusive, non-transferable, revocable license to use the Service for its intended
            purpose.
          </p>
          <p className="mt-3">
            You may not copy, modify, distribute, or create derivative works of the Service without
            our express written permission.
          </p>
        </section>

        {/* 9. Termination */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">9. Termination</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              Either party may terminate the subscription with 30 days written notice to the other
              party.
            </li>
            <li>
              Upon termination, your data will be available for export for 90 days in standard
              formats (CSV, JSON, PDF). After 90 days, data will be permanently deleted.
            </li>
            <li>
              We may immediately suspend or terminate accounts that violate these Terms, including
              accounts involved in unauthorized access, data exfiltration, or abusive behavior.
            </li>
            <li>
              If we terminate your account without cause, you will receive a pro-rated refund for
              any prepaid, unused subscription period.
            </li>
            <li>
              Sections relating to Data Ownership, Limitation of Liability, and Governing Law
              survive termination.
            </li>
          </ul>
        </section>

        {/* 10. Limitation of Liability */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">10. Limitation of Liability</h2>
          <p className="mt-3">
            To the maximum extent permitted by applicable law, Concierge shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages, including but not
            limited to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Loss of profits, revenue, or business opportunities</li>
            <li>
              Loss of data (beyond our obligation to maintain backups as described in this
              agreement)
            </li>
            <li>Cost of procurement of substitute services</li>
            <li>
              Any damages arising from unauthorized access to your account due to compromised
              credentials
            </li>
          </ul>
          <p className="mt-3">
            Our total aggregate liability for any claims arising from or related to the Service
            shall not exceed the total amount you paid for the Service in the 12 months immediately
            preceding the event giving rise to the claim.
          </p>
          <p className="mt-3">
            This limitation of liability applies regardless of the legal theory (contract, tort,
            negligence, strict liability, or otherwise) and even if we have been advised of the
            possibility of such damages.
          </p>
        </section>

        {/* 11. Indemnification */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">11. Indemnification</h2>
          <p className="mt-3">
            You agree to indemnify and hold harmless Concierge, its officers, directors, employees,
            and agents from any claims, losses, damages, liabilities, and expenses (including
            reasonable legal fees) arising from your use of the Service, violation of these Terms,
            or infringement of any third-party rights.
          </p>
        </section>

        {/* 12. Dispute Resolution */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">12. Dispute Resolution</h2>
          <p className="mt-3">
            Before initiating formal legal proceedings, both parties agree to attempt to resolve
            disputes through good-faith negotiation for a period of 30 days. If negotiation fails,
            disputes may be submitted to binding arbitration in Toronto, Ontario, under the rules of
            the ADR Institute of Canada.
          </p>
        </section>

        {/* 13. Modifications to Terms */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">13. Modifications to Terms</h2>
          <p className="mt-3">
            We may update these Terms from time to time. Material changes will be communicated to
            Property Administrators via email and in-platform notification at least 30 days before
            they take effect. Continued use of the Service after the effective date constitutes
            acceptance of the updated Terms.
          </p>
        </section>

        {/* 14. Governing Law */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">14. Governing Law</h2>
          <p className="mt-3">
            These Terms are governed by and construed in accordance with the laws of the Province of
            Ontario and the federal laws of Canada applicable therein, without regard to conflict of
            law principles. Any disputes arising from these Terms that are not resolved through
            arbitration shall be submitted to the exclusive jurisdiction of the courts located in
            Toronto, Ontario, Canada.
          </p>
        </section>

        {/* 15. Severability */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">15. Severability</h2>
          <p className="mt-3">
            If any provision of these Terms is found to be unenforceable or invalid by a court of
            competent jurisdiction, that provision shall be limited or eliminated to the minimum
            extent necessary, and the remaining provisions shall remain in full force and effect.
          </p>
        </section>

        {/* 16. Entire Agreement */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">16. Entire Agreement</h2>
          <p className="mt-3">
            These Terms, together with our Privacy Policy and any applicable Enterprise agreement,
            constitute the entire agreement between you and Concierge regarding the use of the
            Service and supersede all prior agreements and understandings.
          </p>
        </section>

        {/* 17. Contact */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">17. Contact</h2>
          <p className="mt-3">
            For questions about these Terms, contact us at{' '}
            <a href="mailto:legal@concierge.com" className="font-medium text-neutral-900 underline">
              legal@concierge.com
            </a>
            .
          </p>
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <p className="font-semibold text-neutral-900">Concierge Legal</p>
            <p className="mt-1 text-[14px] text-neutral-600">Toronto, Ontario, Canada</p>
            <p className="mt-2 text-[14px]">
              Email:{' '}
              <a
                href="mailto:legal@concierge.com"
                className="font-medium text-neutral-900 underline"
              >
                legal@concierge.com
              </a>
            </p>
          </div>
        </section>
      </div>

      {/* Back to home */}
      <div className="mt-8 border-t border-neutral-200 pt-8">
        <Link
          href={'/' as never}
          className="text-[14px] font-medium text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
