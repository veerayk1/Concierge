import Link from 'next/link';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Privacy Policy — Concierge',
  description:
    'How Concierge collects, uses, and protects your personal information. Compliant with PIPEDA, GDPR, and HIPAA.',
  openGraph: {
    title: 'Privacy Policy — Concierge',
    description: 'Privacy policy covering PIPEDA, GDPR, and HIPAA compliance.',
    type: 'website',
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const LAST_UPDATED = 'March 20, 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
      <h1 className="text-[32px] font-bold tracking-tight text-neutral-900">Privacy Policy</h1>
      <p className="mt-2 text-[14px] text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 max-w-none text-[15px] leading-relaxed text-neutral-700">
        {/* 1. Introduction */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">1. Introduction</h2>
          <p className="mt-3">
            Concierge (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to
            protecting the privacy of individuals who use our building management platform. This
            Privacy Policy explains how we collect, use, disclose, and safeguard your personal
            information in compliance with the Personal Information Protection and Electronic
            Documents Act (PIPEDA), the General Data Protection Regulation (GDPR), the Health
            Insurance Portability and Accountability Act (HIPAA), and applicable Canadian provincial
            privacy legislation.
          </p>
          <p className="mt-3">
            This policy applies to all users of the Concierge platform, including property
            administrators, staff members, security personnel, board members, and residents. By
            using our platform, you acknowledge that you have read and understood this Privacy
            Policy.
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">2. Information We Collect</h2>
          <p className="mt-3">We collect the following categories of personal information:</p>

          <h3 className="mt-5 text-[16px] font-semibold text-neutral-900">
            2.1 Account Information
          </h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Full name, email address, and phone number</li>
            <li>Unit number, building association, and role within the property</li>
            <li>Login credentials (passwords are hashed and salted, never stored in plain text)</li>
            <li>Multi-factor authentication tokens and recovery codes</li>
          </ul>

          <h3 className="mt-5 text-[16px] font-semibold text-neutral-900">2.2 Property Data</h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Building address, unit details, floor plans, and amenity configurations</li>
            <li>Maintenance requests, work orders, and associated photographs</li>
            <li>Amenity bookings, visitor logs, and package tracking records</li>
            <li>Announcements, communications, and notification preferences</li>
          </ul>

          <h3 className="mt-5 text-[16px] font-semibold text-neutral-900">2.3 Security Data</h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>FOB serial numbers, key checkout records, and buzzer codes</li>
            <li>Incident reports, parking permit information, and violation records</li>
            <li>Visitor check-in/check-out logs and vehicle information</li>
            <li>Emergency contact information</li>
          </ul>

          <h3 className="mt-5 text-[16px] font-semibold text-neutral-900">2.4 Usage Data</h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Login timestamps, IP addresses, and device information</li>
            <li>Feature usage analytics (privacy-respecting, no third-party trackers)</li>
            <li>Audit trail entries for all user actions within the platform</li>
          </ul>

          <h3 className="mt-5 text-[16px] font-semibold text-neutral-900">
            2.5 Health-Related Data (HIPAA)
          </h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>
              Accessibility requirements or health-related notes stored in unit files (e.g.,
              mobility aids, medical alerts)
            </li>
            <li>Emergency medical information provided voluntarily by residents</li>
            <li>
              This data is treated as Protected Health Information (PHI) and subject to HIPAA
              safeguards
            </li>
          </ul>
        </section>

        {/* 3. How We Use Your Information */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">3. How We Use Your Information</h2>
          <p className="mt-3">Your personal information is used to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Provide and maintain the building management platform and all its modules</li>
            <li>Process maintenance requests, work orders, and amenity bookings</li>
            <li>
              Manage building security, visitor access, FOB/key tracking, and incident reporting
            </li>
            <li>
              Send notifications and announcements through your preferred channels (email, SMS,
              push)
            </li>
            <li>Generate reports and analytics for property management decision-making</li>
            <li>Provide customer support and respond to inquiries</li>
            <li>Detect and prevent fraud, unauthorized access, and security threats</li>
            <li>Comply with legal obligations and enforce our Terms of Service</li>
            <li>Improve the platform through anonymized, aggregated usage analytics</li>
          </ul>
        </section>

        {/* 4. Legal Basis for Processing (GDPR) */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">
            4. Legal Basis for Processing (GDPR)
          </h2>
          <p className="mt-3">
            For individuals located in the European Economic Area (EEA), we process personal data
            under the following legal bases:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Contract performance:</strong> Processing necessary to provide the building
              management services you or your property have subscribed to.
            </li>
            <li>
              <strong>Legitimate interest:</strong> Security monitoring, fraud prevention, and
              platform improvement where our interests do not override your rights.
            </li>
            <li>
              <strong>Legal obligation:</strong> Processing required to comply with applicable laws
              and regulations.
            </li>
            <li>
              <strong>Consent:</strong> Where required, we obtain explicit consent for specific
              processing activities such as marketing communications.
            </li>
          </ul>
        </section>

        {/* 5. Data Sharing */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">5. Data Sharing</h2>
          <p className="mt-3">
            We do not sell, rent, or trade your personal information. We may share data with:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Property Management Companies:</strong> Your building&apos;s management
              company has access to property-level data necessary for building operations, as
              governed by your property&apos;s management agreement.
            </li>
            <li>
              <strong>Service Providers (Sub-processors):</strong> We use trusted third-party
              services as detailed in Section 8 (Sub-processors). All providers are contractually
              bound to protect your data through Data Processing Agreements (DPAs).
            </li>
            <li>
              <strong>Legal Requirements:</strong> We may disclose information when required by law,
              court order, or to protect the safety of our users. We will notify affected users
              unless prohibited by law.
            </li>
            <li>
              <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of
              assets, personal data may be transferred. Users will be notified of any such change.
            </li>
          </ul>
        </section>

        {/* 6. Data Security */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">6. Data Security</h2>
          <p className="mt-3">
            We implement enterprise-grade security measures to protect your data:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Encryption at rest:</strong> AES-256 encryption for all stored data, with
              column-level encryption for sensitive personal information
            </li>
            <li>
              <strong>Encryption in transit:</strong> TLS 1.3 for all data transmission
            </li>
            <li>
              <strong>Access controls:</strong> Multi-factor authentication, role-based access
              control, and the principle of least privilege
            </li>
            <li>
              <strong>Audit logging:</strong> Comprehensive audit trails recording who, what, when,
              and from where for every action
            </li>
            <li>
              <strong>Infrastructure:</strong> Hosted in SOC 2 certified data centres located in
              Canada with cross-region disaster recovery
            </li>
            <li>
              <strong>Testing:</strong> Regular penetration testing, SAST on every pull request,
              DAST on every release
            </li>
            <li>
              <strong>Incident response:</strong> Documented incident response procedures with
              notification within 72 hours as required by GDPR and PIPEDA
            </li>
          </ul>
        </section>

        {/* 7. Data Retention */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">7. Data Retention</h2>
          <p className="mt-3">
            We retain personal data for as long as necessary to provide our services and comply with
            legal obligations:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Active accounts:</strong> Data is retained for the duration of the
              subscription plus 90 days after termination for data export
            </li>
            <li>
              <strong>Audit logs:</strong> Retained for 7 years as required by applicable
              regulations
            </li>
            <li>
              <strong>Backup data:</strong> Encrypted backups are retained for 90 days and then
              permanently deleted
            </li>
            <li>
              <strong>Anonymized analytics:</strong> Aggregated, anonymized data may be retained
              indefinitely for product improvement
            </li>
            <li>
              <strong>Deletion requests:</strong> Upon verified request, personal data is deleted
              within 30 days, except where retention is required by law
            </li>
          </ul>
        </section>

        {/* 8. Sub-processors */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">8. Sub-processors</h2>
          <p className="mt-3">
            We use the following categories of sub-processors to deliver our services. Each
            sub-processor is bound by a Data Processing Agreement:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-3 pr-4 text-left font-semibold text-neutral-900">Category</th>
                  <th className="py-3 pr-4 text-left font-semibold text-neutral-900">Purpose</th>
                  <th className="py-3 text-left font-semibold text-neutral-900">Data Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="py-3 pr-4">Cloud Infrastructure</td>
                  <td className="py-3 pr-4">Application hosting and database storage</td>
                  <td className="py-3">Canada</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Email Delivery</td>
                  <td className="py-3 pr-4">Transactional and notification emails</td>
                  <td className="py-3">United States</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">SMS Provider</td>
                  <td className="py-3 pr-4">SMS notifications and verification codes</td>
                  <td className="py-3">United States</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Push Notifications</td>
                  <td className="py-3 pr-4">Mobile and web push notifications</td>
                  <td className="py-3">United States</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Payment Processing</td>
                  <td className="py-3 pr-4">Subscription billing and payment handling</td>
                  <td className="py-3">United States</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">File Storage</td>
                  <td className="py-3 pr-4">Document and image uploads</td>
                  <td className="py-3">Canada</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[14px] text-neutral-600">
            For sub-processors located outside Canada, we ensure adequate data protection through
            Standard Contractual Clauses (SCCs) and verify that each provider maintains equivalent
            security standards. Primary data storage always remains in Canada.
          </p>
        </section>

        {/* 9. Your Rights */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">9. Your Rights</h2>

          <h3 className="mt-5 text-[16px] font-semibold text-neutral-900">
            9.1 Under PIPEDA (Canadian Residents)
          </h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Access your personal information held by us</li>
            <li>Request correction of inaccurate or incomplete data</li>
            <li>Withdraw consent for data processing</li>
            <li>Challenge our compliance with PIPEDA to the Privacy Commissioner of Canada</li>
          </ul>

          <h3 className="mt-5 text-[16px] font-semibold text-neutral-900">
            9.2 Under GDPR (EU/EEA Residents)
          </h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Right of access to your personal data</li>
            <li>Right to rectification of inaccurate data</li>
            <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
            <li>Right to restriction of processing</li>
            <li>Right to data portability in a machine-readable format</li>
            <li>Right to object to processing based on legitimate interest</li>
            <li>Right not to be subject to automated decision-making</li>
            <li>Right to lodge a complaint with your supervisory authority</li>
          </ul>

          <h3 className="mt-5 text-[16px] font-semibold text-neutral-900">
            9.3 Under HIPAA (Health Data)
          </h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Right to access your Protected Health Information (PHI)</li>
            <li>Right to request amendments to your PHI</li>
            <li>Right to an accounting of disclosures of your PHI</li>
            <li>Right to request restrictions on certain uses and disclosures</li>
            <li>Right to receive a copy of this privacy notice</li>
          </ul>

          <p className="mt-4">
            To exercise any of these rights, submit a Data Subject Access Request (DSAR) by emailing{' '}
            <a
              href="mailto:privacy@concierge.com"
              className="font-medium text-neutral-900 underline"
            >
              privacy@concierge.com
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        {/* 10. International Data Transfers */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">
            10. International Data Transfers
          </h2>
          <p className="mt-3">
            All primary data for Canadian properties is stored in Canadian data centres. Where
            sub-processors are located outside Canada (see Section 8), we ensure adequate protection
            through:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
            <li>Data Processing Agreements with all sub-processors</li>
            <li>
              Verification that receiving countries provide adequate data protection or that
              additional safeguards are in place
            </li>
            <li>
              No cross-border transfers of personal data without contractual protections and, where
              required, explicit consent
            </li>
          </ul>
        </section>

        {/* 11. Cookies and Tracking */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">11. Cookies and Tracking</h2>
          <p className="mt-3">
            Concierge uses only essential cookies required for platform functionality:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Session cookies:</strong> Required for authentication and maintaining your
              login session
            </li>
            <li>
              <strong>Security cookies:</strong> Used for CSRF protection and rate limiting
            </li>
            <li>
              <strong>Preference cookies:</strong> Store your language and notification preferences
            </li>
          </ul>
          <p className="mt-3">
            We do not use advertising cookies, tracking pixels, third-party analytics scripts, or
            any form of cross-site tracking. We do not participate in ad networks or data exchanges.
          </p>
        </section>

        {/* 12. Children's Privacy */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">12. Children&apos;s Privacy</h2>
          <p className="mt-3">
            Concierge is not directed at individuals under the age of 16. We do not knowingly
            collect personal information from children. If we become aware that we have collected
            data from a child under 16, we will delete it promptly.
          </p>
        </section>

        {/* 13. Changes to This Policy */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">13. Changes to This Policy</h2>
          <p className="mt-3">
            We may update this Privacy Policy from time to time. Material changes will be
            communicated through the platform and via email to property administrators at least 30
            days before they take effect. Continued use of the platform after the effective date
            constitutes acceptance of the updated policy.
          </p>
        </section>

        {/* 14. Contact */}
        <section className="mb-10">
          <h2 className="text-[20px] font-bold text-neutral-900">14. Contact Us</h2>
          <p className="mt-3">For privacy inquiries or to exercise your rights, contact:</p>
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <p className="font-semibold text-neutral-900">Privacy Officer</p>
            <p className="mt-1 text-[14px] text-neutral-600">Concierge</p>
            <p className="text-[14px] text-neutral-600">Toronto, Ontario, Canada</p>
            <p className="mt-2 text-[14px]">
              Email:{' '}
              <a
                href="mailto:privacy@concierge.com"
                className="font-medium text-neutral-900 underline"
              >
                privacy@concierge.com
              </a>
            </p>
          </div>
          <p className="mt-4">
            If you are not satisfied with our response, you may file a complaint with the{' '}
            <a
              href="https://www.priv.gc.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-neutral-900 underline"
            >
              Office of the Privacy Commissioner of Canada
            </a>{' '}
            or your local data protection authority.
          </p>
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
