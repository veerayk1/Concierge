import type { Metadata } from 'next';
import { LegalShell } from '@/components/marketing/LegalShell';

// ---------------------------------------------------------------------------
// SEO Metadata
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://concierge.app';

const SEO_TITLE = 'Terms of Service | Concierge Property Management Platform';
const SEO_DESCRIPTION =
  'The terms governing your use of Concierge — the all-in-one property management platform. Plain-language, fair-use, and built on enterprise security commitments.';

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/terms` },
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    type: 'website',
    url: `${BASE_URL}/terms`,
    siteName: 'Concierge',
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

export default function TermsOfServicePage() {
  return (
    <LegalShell
      eyebrow="Plain-language terms"
      title="Terms of Service"
      description="The agreement between you and Concierge — written in plain English, with no hidden gotchas, and built on enterprise security commitments."
      lastUpdated={LAST_UPDATED}
    >
      <h2>1. Agreement to terms</h2>
      <p>
        By accessing or using Concierge (&ldquo;the Service&rdquo;) you agree to be bound by these
        Terms of Service (&ldquo;Terms&rdquo;). If you are using the Service on behalf of a property
        corporation, building owner, condo board, HOA, or other entity, you represent that you have
        authority to bind that entity to these Terms.
      </p>
      <p>If you do not agree to these Terms, do not use the Service.</p>

      <h2>2. The service</h2>
      <p>
        Concierge is a multi-tenant property management software-as-a-service platform that replaces
        a portfolio of legacy tools. It includes (without limitation): package tracking, visitor
        management, maintenance requests, amenity booking, security console, resident portal, board
        governance, vendor compliance, and compliance reporting.
      </p>
      <p>
        We provide the Service on a continuous-improvement basis. New features ship regularly.
        Material changes that affect data handling are communicated 30 days in advance.
      </p>

      <h2>3. Accounts</h2>
      <h3>Creating an account</h3>
      <ul>
        <li>You must be at least 13 years old to create an account</li>
        <li>You agree to provide accurate, up-to-date information</li>
        <li>
          You are responsible for safeguarding your password and for all activity on your account
        </li>
        <li>
          You must immediately notify us of any unauthorized access at{' '}
          <a href="mailto:security@concierge.com">security@concierge.com</a>
        </li>
      </ul>
      <h3>Roles & permissions</h3>
      <p>
        The Service uses role-based access control. The customer (property corporation, building
        owner, board, or management company) is responsible for assigning roles appropriately and
        removing access when staff or residents leave.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose or in violation of these Terms</li>
        <li>
          Upload, post, or transmit content that is harmful, harassing, defamatory, obscene, or
          infringing
        </li>
        <li>
          Attempt to gain unauthorized access to any part of the Service, other accounts, or our
          infrastructure
        </li>
        <li>
          Reverse-engineer, decompile, or disassemble the Service, except as expressly permitted by
          applicable law
        </li>
        <li>
          Use the Service to harvest personal information about residents, staff, or visitors beyond
          what is operationally necessary
        </li>
        <li>
          Interfere with or disrupt the integrity or performance of the Service or the data
          contained therein
        </li>
        <li>
          Use automated means (bots, scrapers) to access the Service except through our published
          API with valid credentials
        </li>
      </ul>
      <p>We may suspend or terminate accounts that violate these acceptable-use rules.</p>

      <h2>5. Customer data</h2>
      <p>
        You retain ownership of all data you upload to the Service (&ldquo;Customer Data&rdquo;).
        Concierge processes Customer Data solely to provide the Service to you and on your behalf.
      </p>
      <p>
        We do <strong>not</strong> sell Customer Data. We do <strong>not</strong> use Customer Data
        to train machine-learning models that benefit other customers without your explicit consent.
        We do <strong>not</strong> share Customer Data with third-party advertisers.
      </p>
      <p>
        See our <a href="/privacy">Privacy Policy</a> and{' '}
        <a href="/security-privacy">Security &amp; Privacy</a> page for the operational controls
        that back this up.
      </p>

      <h2>6. Fees & billing</h2>
      <ul>
        <li>Fees are described in your order form or subscription agreement</li>
        <li>Fees are billed monthly or annually, in advance</li>
        <li>Subscriptions renew automatically unless cancelled at least 30 days before renewal</li>
        <li>Late payments may result in suspension after 15 days&rsquo; written notice</li>
        <li>All fees are exclusive of taxes (HST/GST/VAT) which you are responsible for paying</li>
      </ul>

      <h2>7. Service level agreement</h2>
      <p>
        We commit to a <strong>99.99% uptime SLA</strong> measured monthly (approximately 52 minutes
        of allowable downtime per year). Scheduled maintenance is announced at least 7 days in
        advance and does not count against the SLA.
      </p>
      <p>
        If we miss the SLA, service credits are issued automatically against your next invoice on
        the schedule documented in your order form.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        Concierge retains all rights, title, and interest in the Service, including all software,
        documentation, designs, trademarks, and underlying technology. These Terms grant you a
        limited, non-exclusive, non-transferable, revocable licence to use the Service in accordance
        with these Terms and your subscription.
      </p>
      <p>
        Customer Data remains your property. You grant Concierge a limited licence to use Customer
        Data solely to provide the Service.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the maximum
        extent permitted by applicable law, we disclaim all warranties, express or implied,
        including warranties of merchantability, fitness for a particular purpose, and non-
        infringement.
      </p>
      <p>
        Concierge is a tool to <em>support</em> property operations. It does not replace legal,
        accounting, security, or emergency response professionals. If your building is in an active
        emergency, contact emergency services.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by applicable law, Concierge&rsquo;s aggregate liability for
        any claim arising out of or relating to the Service is limited to the fees you paid in the
        12 months preceding the event giving rise to the claim.
      </p>
      <p>
        We are not liable for indirect, consequential, special, or punitive damages, including lost
        profits or lost data, except where such liability cannot be excluded under applicable law.
      </p>

      <h2>11. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless Concierge and its officers, directors,
        employees, and agents from any claim arising out of your use of the Service in violation of
        these Terms or applicable law.
      </p>

      <h2>12. Termination</h2>
      <ul>
        <li>You may cancel your subscription at any time via your account or by contacting us</li>
        <li>
          We may suspend or terminate accounts for material violation of these Terms with 14
          days&rsquo; written notice (or immediately for serious security violations)
        </li>
        <li>
          On termination, you have 30 days to export your Customer Data; after 30 days, we may
          delete it
        </li>
        <li>
          Sections of these Terms that by their nature should survive (IP, indemnification,
          limitations) survive termination
        </li>
      </ul>

      <h2>13. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Province of Ontario, Canada, without regard to
        conflict-of-law principles. Disputes will be resolved in the courts of Toronto, Ontario.
      </p>

      <h2>14. Changes to these terms</h2>
      <p>
        We may modify these Terms from time to time. Material changes will be notified by email and
        an in-app notice at least 30 days before they take effect. Continued use of the Service
        after the change constitutes acceptance.
      </p>

      <h2>15. Contact</h2>
      <p>
        Questions about these Terms? Contact us at{' '}
        <a href="mailto:legal@concierge.com">legal@concierge.com</a>.
      </p>
    </LegalShell>
  );
}
