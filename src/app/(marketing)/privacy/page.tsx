import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Concierge',
  description:
    'How Concierge collects, uses, and protects your personal information. Compliant with PIPEDA, GDPR, and Canadian privacy law.',
};

const LAST_UPDATED = 'March 20, 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-[32px] font-bold tracking-tight text-neutral-900">Privacy Policy</h1>
      <p className="mt-2 text-[14px] text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-neutral mt-10 max-w-none text-[15px] leading-relaxed text-neutral-700">
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">1. Introduction</h2>
          <p className="mt-3">
            Concierge (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to
            protecting the privacy of individuals who use our building management platform. This
            Privacy Policy explains how we collect, use, disclose, and safeguard your personal
            information in compliance with the Personal Information Protection and Electronic
            Documents Act (PIPEDA), the General Data Protection Regulation (GDPR), and applicable
            Canadian provincial privacy legislation.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">2. Information We Collect</h2>
          <p className="mt-3">We collect the following categories of personal information:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Account Information:</strong> Name, email address, phone number, unit number,
              and role within the property.
            </li>
            <li>
              <strong>Property Data:</strong> Building address, unit details, amenity bookings,
              maintenance requests, and visitor logs.
            </li>
            <li>
              <strong>Security Data:</strong> FOB serial numbers, key checkout records, incident
              reports, and parking permit information.
            </li>
            <li>
              <strong>Usage Data:</strong> Login timestamps, IP addresses, device information, and
              feature usage analytics.
            </li>
            <li>
              <strong>Communication Data:</strong> Announcements, messages, and notification
              preferences.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">3. How We Use Your Information</h2>
          <p className="mt-3">Your personal information is used to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Provide and maintain the building management platform</li>
            <li>Process maintenance requests and amenity bookings</li>
            <li>Manage building security, visitor access, and key tracking</li>
            <li>Send notifications and announcements through your preferred channels</li>
            <li>Generate reports and analytics for property management</li>
            <li>Comply with legal obligations and enforce our terms of service</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">4. Data Sharing</h2>
          <p className="mt-3">We do not sell your personal information. We may share data with:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Property Management Companies:</strong> Your building&apos;s management
              company has access to property-level data necessary for building operations.
            </li>
            <li>
              <strong>Service Providers:</strong> We use trusted third-party services for email
              delivery, SMS, cloud hosting, and payment processing. All providers are contractually
              bound to protect your data.
            </li>
            <li>
              <strong>Legal Requirements:</strong> We may disclose information when required by law,
              court order, or to protect the safety of our users.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">5. Data Security</h2>
          <p className="mt-3">
            We implement enterprise-grade security measures including AES-256 encryption at rest,
            TLS 1.3 in transit, multi-factor authentication, role-based access controls, and
            comprehensive audit logging. Our infrastructure is hosted in SOC 2 certified data
            centres located in Canada.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">6. Your Rights</h2>
          <p className="mt-3">Under PIPEDA and GDPR, you have the right to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Access your personal information held by us</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (subject to legal retention requirements)</li>
            <li>Withdraw consent for data processing</li>
            <li>Export your data in a portable format (Data Subject Access Request)</li>
            <li>Lodge a complaint with the Office of the Privacy Commissioner of Canada</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">7. Data Retention</h2>
          <p className="mt-3">
            We retain personal data for as long as necessary to provide our services and comply with
            legal obligations. When a property account is terminated, data is retained for 90 days
            before permanent deletion. Audit logs are retained for 7 years as required by applicable
            regulations.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">8. Contact Us</h2>
          <p className="mt-3">
            For privacy inquiries or to exercise your rights, contact our Privacy Officer at{' '}
            <a
              href="mailto:privacy@concierge.com"
              className="font-medium text-neutral-900 underline"
            >
              privacy@concierge.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
