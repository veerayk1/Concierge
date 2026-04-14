/**
 * POST /api/v1/public/contact
 *
 * Public endpoint — accepts contact form submissions from the marketing
 * site and forwards them as an email to the sales/support team.
 *
 * Rate-limited to 3 requests per email per hour (in-memory).
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/server/email';
import { createLogger } from '@/server/logger';
import { prisma } from '@/server/db';

const logger = createLogger('public:contact');

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address').max(320),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(1, 'Message is required').max(5000),
});

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, per email, 3 req/hour)
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const timestamps = (rateLimitMap.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return false;
}

// ---------------------------------------------------------------------------
// Email builder
// ---------------------------------------------------------------------------

const SALES_EMAIL = process.env.SALES_CONTACT_EMAIL ?? 'hello@concierge.com';

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  sales: 'Sales & Pricing',
  support: 'Technical Support',
  security: 'Security & Privacy',
};

function buildEmailHtml(data: z.infer<typeof ContactSchema>): string {
  const subjectLabel = SUBJECT_LABELS[data.subject] ?? data.subject;

  const rows = [
    ['Name', data.name],
    ['Email', data.email],
    ['Subject', subjectLabel],
    ['Message', data.message],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:8px 12px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;white-space:nowrap;vertical-align:top;">${label}</td>
          <td style="padding:8px 12px;color:#111827;border-bottom:1px solid #e5e7eb;">${escapeHtml(value ?? '')}</td>
        </tr>`,
    )
    .join('');

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 16px;">New Contact Message</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;">
        ${tableRows}
      </table>
      <p style="margin-top:16px;font-size:13px;color:#6b7280;">
        Submitted via concierge.com/contact
      </p>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    if (isRateLimited(data.email)) {
      logger.warn({ email: data.email }, 'Contact form rate-limited');
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    // Persist lead to database (non-blocking — email still sends on DB failure)
    try {
      await prisma.salesLead.create({
        data: {
          source: 'contact_form',
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
        },
      });
    } catch (dbErr) {
      logger.error({ err: dbErr }, 'Failed to persist contact form lead to database');
    }

    const subjectLabel = SUBJECT_LABELS[data.subject] ?? data.subject;

    await sendEmail({
      to: SALES_EMAIL,
      subject: `Contact: ${subjectLabel} — ${data.name}`,
      html: buildEmailHtml(data),
      replyTo: data.email,
    });

    logger.info({ email: data.email, subject: data.subject }, 'Contact form submitted');

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Failed to process contact form');
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
