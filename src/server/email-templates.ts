/**
 * Concierge — Email Template Rendering Engine
 *
 * Renders HTML email templates with variable interpolation, escaping,
 * conditional sections, and loop support. All templates share a responsive
 * base layout with header branding and footer with unsubscribe link.
 *
 * @module server/email-templates
 */

import { AppError } from '@/server/errors';

// ---------------------------------------------------------------------------
// Error Classes
// ---------------------------------------------------------------------------

export class TemplateNotFoundError extends AppError {
  readonly statusCode = 404 as const;
  readonly code = 'TEMPLATE_NOT_FOUND' as const;

  constructor(templateName: string) {
    super(`Email template "${templateName}" not found.`);
  }
}

export class MissingVariableError extends AppError {
  readonly statusCode = 400 as const;
  readonly code = 'MISSING_TEMPLATE_VARIABLE' as const;

  constructor(variableName: string, templateName: string) {
    super(`Missing required variable "${variableName}" for email template "${templateName}".`);
  }
}

// ---------------------------------------------------------------------------
// HTML Escaping (XSS prevention)
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Base Layout
// ---------------------------------------------------------------------------

function baseLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased; }
    .email-wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
    .email-container { max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .email-header { padding: 32px 32px 24px; border-bottom: 1px solid #f1f5f9; }
    .email-logo { font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.025em; text-decoration: none; }
    .email-body { padding: 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #334155; }
    .email-body h1 { font-size: 22px; font-weight: 600; color: #0f172a; margin: 0 0 16px; }
    .email-body p { margin: 0 0 16px; }
    .email-body a.btn { display: inline-block; padding: 12px 28px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; }
    .email-body .info-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
    .email-body .info-card dt { font-size: 12px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 2px; }
    .email-body .info-card dd { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 12px; }
    .email-body .info-card dd:last-child { margin-bottom: 0; }
    .email-body .urgency-critical { color: #dc2626; font-weight: 700; }
    .email-body .urgency-high { color: #ea580c; font-weight: 700; }
    .email-body .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .email-body .status-completed { background-color: #dcfce7; color: #166534; }
    .email-body .status-in_progress { background-color: #dbeafe; color: #1e40af; }
    .email-body .status-on_hold { background-color: #fef3c7; color: #92400e; }
    .email-body .status-open { background-color: #f1f5f9; color: #475569; }
    .email-body .digest-item { border-bottom: 1px solid #f1f5f9; padding: 12px 0; }
    .email-body .digest-item:last-child { border-bottom: none; }
    .email-body .digest-item-title { font-weight: 600; color: #0f172a; margin: 0 0 2px; }
    .email-body .digest-item-desc { font-size: 14px; color: #64748b; margin: 0; }
    .email-footer { padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center; }
    .email-footer p { font-size: 12px; color: #94a3b8; margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .email-footer a { color: #64748b; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <a href="#" class="email-logo">Concierge</a>
      </div>
      <div class="email-body">
        ${bodyContent}
      </div>
      <div class="email-footer">
        <p>Concierge &mdash; Building Management</p>
        <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> from these notifications</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Template Definitions
// ---------------------------------------------------------------------------

interface TemplateDefinition {
  requiredVars: string[];
  render: (vars: Record<string, unknown>) => string;
}

const templates: Record<string, TemplateDefinition> = {
  // -----------------------------------------------------------------------
  // Package Received
  // -----------------------------------------------------------------------
  package_received: {
    requiredVars: ['residentName', 'packageRef', 'unitNumber'],
    render: (vars) =>
      baseLayout(
        'Package Received',
        `<h1>Package Received</h1>
        <p>Hi ${v(vars, 'residentName')},</p>
        <p>A package has arrived for you and is ready for pickup at the front desk.</p>
        <dl class="info-card">
          <dt>Reference</dt>
          <dd>${v(vars, 'packageRef')}</dd>
          <dt>Unit</dt>
          <dd>${v(vars, 'unitNumber')}</dd>
        </dl>
        <p>Please bring a valid ID to collect your package.</p>`,
      ),
  },

  // -----------------------------------------------------------------------
  // Package Reminder
  // -----------------------------------------------------------------------
  package_reminder: {
    requiredVars: ['residentName', 'packageRef', 'unitNumber'],
    render: (vars) =>
      baseLayout(
        'Package Still Waiting',
        `<h1>Your Package Is Still Waiting</h1>
        <p>Hi ${v(vars, 'residentName')},</p>
        <p>Just a friendly reminder that your package is still waiting for you at the front desk. Please pick it up at your earliest convenience.</p>
        <dl class="info-card">
          <dt>Reference</dt>
          <dd>${v(vars, 'packageRef')}</dd>
          <dt>Unit</dt>
          <dd>${v(vars, 'unitNumber')}</dd>
        </dl>`,
      ),
  },

  // -----------------------------------------------------------------------
  // Maintenance Update
  // -----------------------------------------------------------------------
  maintenance_update: {
    requiredVars: ['requestRef', 'status', 'updatedBy'],
    render: (vars) => {
      const status = raw(vars, 'status');
      const statusClass = ['completed', 'in_progress', 'on_hold', 'open'].includes(status)
        ? `status-${status}`
        : 'status-open';

      const statusLabel = status.replace(/_/g, ' ');

      let conditionalContent = '';
      if (status === 'completed' && vars.resolutionNotes) {
        conditionalContent = `
        <dl class="info-card">
          <dt>Resolution Notes</dt>
          <dd>${v(vars, 'resolutionNotes')}</dd>
        </dl>`;
      }

      return baseLayout(
        `Maintenance Update — ${raw(vars, 'requestRef')}`,
        `<h1>Maintenance Request Updated</h1>
        <p>Your maintenance request has been updated.</p>
        <dl class="info-card">
          <dt>Reference</dt>
          <dd>${v(vars, 'requestRef')}</dd>
          <dt>Status</dt>
          <dd><span class="status-badge ${statusClass}">${escapeHtml(statusLabel)}</span></dd>
          <dt>Updated By</dt>
          <dd>${v(vars, 'updatedBy')}</dd>
        </dl>${conditionalContent}`,
      );
    },
  },

  // -----------------------------------------------------------------------
  // Booking Approved
  // -----------------------------------------------------------------------
  booking_approved: {
    requiredVars: ['amenityName', 'date', 'time'],
    render: (vars) =>
      baseLayout(
        'Booking Approved',
        `<h1>Booking Approved</h1>
        <p>Your amenity booking has been approved.</p>
        <dl class="info-card">
          <dt>Amenity</dt>
          <dd>${v(vars, 'amenityName')}</dd>
          <dt>Date</dt>
          <dd>${v(vars, 'date')}</dd>
          <dt>Time</dt>
          <dd>${v(vars, 'time')}</dd>
        </dl>
        <p>If you need to cancel or reschedule, please do so through the resident portal.</p>`,
      ),
  },

  // -----------------------------------------------------------------------
  // Booking Declined
  // -----------------------------------------------------------------------
  booking_declined: {
    requiredVars: ['amenityName', 'reason'],
    render: (vars) =>
      baseLayout(
        'Booking Declined',
        `<h1>Booking Declined</h1>
        <p>Unfortunately, your booking request has been declined.</p>
        <dl class="info-card">
          <dt>Amenity</dt>
          <dd>${v(vars, 'amenityName')}</dd>
          <dt>Reason</dt>
          <dd>${v(vars, 'reason')}</dd>
        </dl>
        <p>If you have questions, please contact your property manager.</p>`,
      ),
  },

  // -----------------------------------------------------------------------
  // Welcome
  // -----------------------------------------------------------------------
  welcome: {
    requiredVars: ['firstName', 'propertyName', 'loginUrl'],
    render: (vars) =>
      baseLayout(
        'Welcome to Concierge',
        `<h1>Welcome to Concierge</h1>
        <p>Hi ${v(vars, 'firstName')},</p>
        <p>Your account at <strong>${v(vars, 'propertyName')}</strong> has been created. You can access the resident portal using the button below.</p>
        <p style="margin: 24px 0;">
          <a href="${v(vars, 'loginUrl')}" class="btn">Sign In</a>
        </p>
        <p>If you have questions, contact your property manager.</p>`,
      ),
  },

  // -----------------------------------------------------------------------
  // Password Reset
  // -----------------------------------------------------------------------
  password_reset: {
    requiredVars: ['resetUrl', 'expiresIn'],
    render: (vars) =>
      baseLayout(
        'Reset Your Password',
        `<h1>Password Reset</h1>
        <p>We received a request to reset your password. Click the button below to choose a new one:</p>
        <p style="margin: 24px 0;">
          <a href="${v(vars, 'resetUrl')}" class="btn">Reset Password</a>
        </p>
        <p>This link expires in <strong>${v(vars, 'expiresIn')}</strong>.</p>
        <p style="color: #64748b; font-size: 13px;">If you didn't request this, you can safely ignore this email. Do not share this link with anyone.</p>`,
      ),
  },

  // -----------------------------------------------------------------------
  // Incident Escalation
  // -----------------------------------------------------------------------
  incident_escalation: {
    requiredVars: ['incidentTitle', 'priority', 'escalatedTo'],
    render: (vars) => {
      const priority = raw(vars, 'priority');
      const isCritical = priority === 'critical';
      const urgencyClass = isCritical ? 'urgency-critical' : 'urgency-high';
      const urgencyBorder = isCritical ? '#dc2626' : '#ea580c';

      return baseLayout(
        `Incident Escalated — ${raw(vars, 'incidentTitle')}`,
        `<h1>Incident Escalated</h1>
        <p>An incident has been escalated and requires immediate attention.</p>
        <div class="info-card" style="border-left: 4px solid ${urgencyBorder};">
          <dl style="margin: 0;">
            <dt>Incident</dt>
            <dd>${v(vars, 'incidentTitle')}</dd>
            <dt>Priority</dt>
            <dd><span class="${urgencyClass}">${v(vars, 'priority')}</span></dd>
            <dt>Escalated To</dt>
            <dd>${v(vars, 'escalatedTo')}</dd>
          </dl>
        </div>
        <p><strong>Please review and respond as soon as possible.</strong></p>`,
      );
    },
  },

  // -----------------------------------------------------------------------
  // Announcement Distribution
  // -----------------------------------------------------------------------
  announcement: {
    requiredVars: ['title', 'body', 'propertyName', 'publishedBy'],
    render: (vars) =>
      baseLayout(
        `Announcement — ${v(vars, 'title')}`,
        `<h1>${v(vars, 'title')}</h1>
        <p>${v(vars, 'body')}</p>
        <dl class="info-card">
          <dt>Property</dt>
          <dd>${v(vars, 'propertyName')}</dd>
          <dt>Published By</dt>
          <dd>${v(vars, 'publishedBy')}</dd>
        </dl>`,
      ),
  },

  // -----------------------------------------------------------------------
  // Notification Digest (demonstrates loop support)
  // -----------------------------------------------------------------------
  notification_digest: {
    requiredVars: ['recipientName', 'items'],
    render: (vars) => {
      const items = vars.items as Array<{ title: string; description: string }>;

      let itemsHtml: string;
      if (items.length === 0) {
        itemsHtml = '<p style="color: #64748b; font-style: italic;">No new notifications.</p>';
      } else {
        itemsHtml = items
          .map(
            (item) =>
              `<div class="digest-item">
                <p class="digest-item-title">${escapeHtml(item.title)}</p>
                <p class="digest-item-desc">${escapeHtml(item.description)}</p>
              </div>`,
          )
          .join('\n');
      }

      return baseLayout(
        'Notification Digest',
        `<h1>Your Notification Digest</h1>
        <p>Hi ${v(vars, 'recipientName')},</p>
        <p>Here is a summary of your recent notifications:</p>
        <div class="info-card">
          ${itemsHtml}
        </div>`,
      );
    },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely retrieve a string variable from the vars map and HTML-escape it.
 * By the time render() is called, required vars have been validated,
 * so this coerces to string for TypeScript's noUncheckedIndexedAccess.
 */
function v(vars: Record<string, unknown>, key: string): string {
  return escapeHtml(String(vars[key] ?? ''));
}

/**
 * Retrieve a raw (unescaped) string variable. Use only when the value
 * will be placed in a safe context (e.g. CSS class names already validated).
 */
function raw(vars: Record<string, unknown>, key: string): string {
  return String(vars[key] ?? '');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render an email template by name with the given variables.
 *
 * @param templateName - Registered template identifier
 * @param variables    - Key/value map of template variables
 * @returns            - Fully rendered HTML email string
 *
 * @throws TemplateNotFoundError  — if templateName is not registered
 * @throws MissingVariableError   — if a required variable is not provided
 */
export function renderTemplate(templateName: string, variables: Record<string, unknown>): string {
  const template = templates[templateName];

  if (!template) {
    throw new TemplateNotFoundError(templateName);
  }

  // Validate required variables
  for (const varName of template.requiredVars) {
    if (variables[varName] === undefined || variables[varName] === null) {
      throw new MissingVariableError(varName, templateName);
    }
  }

  // Render the template
  const html = template.render(variables);

  // Replace the unsubscribe placeholder
  const unsubscribeUrl =
    (variables.unsubscribeUrl as string | undefined) ??
    'https://app.concierge.io/settings/notifications';

  return html.replace(/\{\{unsubscribeUrl\}\}/g, escapeHtml(unsubscribeUrl));
}

// ---------------------------------------------------------------------------
// Template Registry (for extensibility)
// ---------------------------------------------------------------------------

/**
 * Register a custom email template at runtime.
 */
export function registerTemplate(name: string, definition: TemplateDefinition): void {
  templates[name] = definition;
}

/**
 * Get the list of all registered template names.
 */
export function getRegisteredTemplates(): string[] {
  return Object.keys(templates);
}
