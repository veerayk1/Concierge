import type { Metadata } from 'next';
import { LegalShell } from '@/components/marketing/LegalShell';

// ---------------------------------------------------------------------------
// SEO Metadata
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://buildingautopilot.ca';

const SEO_TITLE =
  'Privacy Policy | PIPEDA, GDPR, HIPAA Compliant Property Software — BuildingAutopilot';
const SEO_DESCRIPTION =
  'How BuildingAutopilot collects, uses, and protects personal information. Compliant with PIPEDA (Canada), GDPR (EU), and HIPAA (US). Full DSAR workflow, ROPA documented, data minimization by design.';

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/privacy` },
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    type: 'website',
    url: `${BASE_URL}/privacy`,
    siteName: 'BuildingAutopilot',
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
  },
};

const LAST_UPDATED = 'March 20, 2026';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PrivacyPolicyPage() {
  return (
    <LegalShell
      eyebrow="Plain-language privacy"
      title="Privacy Policy"
      description="How we collect, use, store, and protect your information — written in plain language, backed by PIPEDA, GDPR, and HIPAA compliance frameworks."
      lastUpdated={LAST_UPDATED}
    >
      <h2>1. Introduction</h2>
      {/* TODO(legal-entity): "BuildingAutopilot Property Management Inc." is a PLACEHOLDER —
          the legal entity is not yet registered. Replace with the exact registered name once
          incorporated. Also appears at the Contact section below and in terms/page.tsx.
          See docs/LEGAL-ENTITY-TODO.md */}
      <p>
        BuildingAutopilot Property Management Inc. (&ldquo;BuildingAutopilot&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) respects your privacy. This policy
        explains, in plain language, what personal information we collect, why we collect it, how we
        use it, and the rights you have over it.
      </p>
      <p>
        BuildingAutopilot complies with the{' '}
        <strong>Personal Information Protection and Electronic Documents Act (PIPEDA)</strong> in
        Canada, the <strong>General Data Protection Regulation (GDPR)</strong> in the European
        Union, and the <strong>Health Insurance Portability and Accountability Act (HIPAA)</strong>{' '}
        where applicable in the United States.
      </p>
      <p>
        If you have any questions, contact our Privacy Officer at{' '}
        <a href="mailto:privacy@buildingautopilot.ca">privacy@buildingautopilot.ca</a>.
      </p>

      <h2>2. Information we collect</h2>
      <h3>Identity & contact information</h3>
      <ul>
        <li>Name, email address, phone number, mailing address</li>
        <li>Unit number, residency status (owner, tenant, family member), move-in date</li>
        <li>Emergency contacts, vehicle plate, parking spot, pet records (optional)</li>
      </ul>
      <h3>Operational data (created as you use the platform)</h3>
      <ul>
        <li>Package deliveries, visitor sign-ins, maintenance requests, amenity bookings</li>
        <li>Communications: announcements you read, replies, support tickets</li>
        <li>Sign-in events with timestamp, IP address, device, and browser</li>
      </ul>
      <h3>Technical & security data</h3>
      <ul>
        <li>Audit log entries for every administrative action</li>
        <li>API request metadata (path, status, latency) used for monitoring</li>
        <li>Cookies for session management and CSRF protection (no third-party tracking)</li>
      </ul>
      <h3>Sensitive data — handled with extra care</h3>
      <p>
        For HIPAA-covered properties, we may process limited health-related accommodations (e.g.,
        service animal records, accessibility accommodations) under a Business Associate Agreement.
        Health data is encrypted at the column level with a separate key.
      </p>

      <h2>3. How we use your information</h2>
      <ul>
        <li>
          To deliver the platform&rsquo;s core functions — packages, maintenance, amenities,
          communications
        </li>
        <li>
          To notify you of building events, deliveries, and announcements (via your chosen channels)
        </li>
        <li>To investigate incidents and produce auditor-ready compliance reports</li>
        <li>To improve the platform (aggregated, de-identified analytics)</li>
        <li>To comply with our legal obligations and respond to lawful requests</li>
      </ul>
      <p>
        We <strong>never sell your data</strong>. We do not use it for behavioural advertising. We
        do not share it with third-party marketing platforms.
      </p>

      <h2>4. How we protect your information</h2>
      <ul>
        <li>
          <strong>Encryption at rest</strong> — AES-256 column-level encryption
        </li>
        <li>
          <strong>Encryption in flight</strong> — TLS 1.3 on every API endpoint
        </li>
        <li>
          <strong>Encrypted backups</strong> — continuous, geo-redundant, point-in-time recovery to
          any minute in the last 30 days
        </li>
        <li>
          <strong>Mandatory MFA</strong> for admin, board, and finance roles
        </li>
        <li>
          <strong>Immutable audit log</strong> — every administrative action logged with operator,
          IP, timestamp
        </li>
        <li>
          <strong>Annual penetration testing</strong> by independent third parties
        </li>
      </ul>
      <p>
        Read the full <a href="/security-privacy">security and privacy page</a> for the compliance
        framework details.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We retain personal information only as long as required to deliver the service and meet
        legal obligations.
      </p>
      <ul>
        <li>
          <strong>Resident records</strong> — retained while you reside in the building, then 7
          years for legal/financial records (or as required by jurisdiction)
        </li>
        <li>
          <strong>Operational records</strong> (packages, visitors, requests) — 7 years for audit
          purposes
        </li>
        <li>
          <strong>Audit log</strong> — minimum 7 years, append-only, never rotated out
        </li>
        <li>
          <strong>Backups</strong> — point-in-time to 30 days; older backups purged automatically
        </li>
      </ul>

      <h2>6. Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>
          <strong>Access</strong> — request a copy of your personal information
        </li>
        <li>
          <strong>Rectification</strong> — correct inaccurate or incomplete information
        </li>
        <li>
          <strong>Erasure</strong> — request deletion of your personal information (subject to legal
          retention requirements)
        </li>
        <li>
          <strong>Portability</strong> — receive your data in a machine-readable format
        </li>
        <li>
          <strong>Restriction</strong> — pause processing while we investigate a request
        </li>
        <li>
          <strong>Objection</strong> — object to processing on legitimate-interest grounds
        </li>
        <li>
          <strong>Withdraw consent</strong> — withdraw your consent at any time (where consent is
          the legal basis)
        </li>
      </ul>
      <p>
        Submit a Data Subject Access Request (DSAR) by emailing{' '}
        <a href="mailto:privacy@buildingautopilot.ca">privacy@buildingautopilot.ca</a>. We will
        respond within 30 days (and typically within 48 hours).
      </p>

      <h2>7. Cookies & tracking</h2>
      <p>
        We use only the cookies necessary to keep you signed in and to prevent CSRF attacks. We do
        not use behavioural advertising cookies, fingerprinting, or third-party analytics scripts
        that track you across the web.
      </p>

      <h2>8. International transfers</h2>
      <p>
        BuildingAutopilot primarily stores data in Canadian and US data centres. For EU customers,
        we operate an EU data residency option. International transfers are protected by
        <em> Standard Contractual Clauses</em> and equivalent safeguards.
      </p>

      <h2>9. Children&rsquo;s privacy</h2>
      <p>
        BuildingAutopilot is not directed at children under 13. If a parent or guardian becomes
        aware that a child under 13 has provided personal information, please contact us and we will
        delete it.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be communicated via email
        and an in-app notification at least 30 days before they take effect.
      </p>

      <h2>11. Contact</h2>
      <p>
        <strong>Privacy Officer</strong>
        <br />
        {/* TODO(legal-entity): PLACEHOLDER name — replace once the entity is registered. See docs/LEGAL-ENTITY-TODO.md */}
        BuildingAutopilot Property Management Inc.
        <br />
        Toronto, Ontario, Canada
        <br />
        Email: <a href="mailto:privacy@buildingautopilot.ca">privacy@buildingautopilot.ca</a>
      </p>
      <p>
        For Canadian residents, you also have the right to complain to the{' '}
        <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer">
          Office of the Privacy Commissioner of Canada
        </a>
        .
      </p>
    </LegalShell>
  );
}
