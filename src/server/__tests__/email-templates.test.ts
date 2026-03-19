/**
 * Email Template Rendering Engine — TDD Tests
 *
 * Tests for the renderTemplate function covering all notification types,
 * HTML structure, variable escaping, error handling, conditionals, and loops.
 */

import { describe, expect, it } from 'vitest';
import {
  renderTemplate,
  TemplateNotFoundError,
  MissingVariableError,
} from '@/server/email-templates';

// ---------------------------------------------------------------------------
// 1. package_received
// ---------------------------------------------------------------------------

describe('renderTemplate("package_received")', () => {
  it('renders HTML with resident name, package ref, and unit number', () => {
    const html = renderTemplate('package_received', {
      residentName: 'Jane Doe',
      packageRef: 'PKG-20260319-001',
      unitNumber: '1204',
    });

    expect(html).toContain('Jane Doe');
    expect(html).toContain('PKG-20260319-001');
    expect(html).toContain('1204');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });
});

// ---------------------------------------------------------------------------
// 2. package_reminder
// ---------------------------------------------------------------------------

describe('renderTemplate("package_reminder")', () => {
  it('renders HTML with "still waiting" messaging', () => {
    const html = renderTemplate('package_reminder', {
      residentName: 'John Smith',
      packageRef: 'PKG-20260318-042',
      unitNumber: '305',
    });

    expect(html).toContain('John Smith');
    expect(html).toContain('PKG-20260318-042');
    expect(html.toLowerCase()).toContain('still waiting');
  });
});

// ---------------------------------------------------------------------------
// 3. maintenance_update
// ---------------------------------------------------------------------------

describe('renderTemplate("maintenance_update")', () => {
  it('renders status-specific content for in_progress', () => {
    const html = renderTemplate('maintenance_update', {
      requestRef: 'MNT-2026-0087',
      status: 'in_progress',
      updatedBy: 'Mike Chen',
    });

    expect(html).toContain('MNT-2026-0087');
    expect(html).toContain('in_progress');
    expect(html).toContain('Mike Chen');
  });

  it('renders status-specific content for completed', () => {
    const html = renderTemplate('maintenance_update', {
      requestRef: 'MNT-2026-0088',
      status: 'completed',
      updatedBy: 'Sarah Park',
    });

    expect(html).toContain('MNT-2026-0088');
    expect(html).toContain('completed');
    expect(html).toContain('Sarah Park');
  });
});

// ---------------------------------------------------------------------------
// 4. booking_approved
// ---------------------------------------------------------------------------

describe('renderTemplate("booking_approved")', () => {
  it('includes amenity name, date, and time', () => {
    const html = renderTemplate('booking_approved', {
      amenityName: 'Rooftop Lounge',
      date: 'March 22, 2026',
      time: '6:00 PM — 9:00 PM',
    });

    expect(html).toContain('Rooftop Lounge');
    expect(html).toContain('March 22, 2026');
    expect(html).toContain('6:00 PM — 9:00 PM');
    expect(html.toLowerCase()).toContain('approved');
  });
});

// ---------------------------------------------------------------------------
// 5. booking_declined
// ---------------------------------------------------------------------------

describe('renderTemplate("booking_declined")', () => {
  it('includes amenity name and decline reason', () => {
    const html = renderTemplate('booking_declined', {
      amenityName: 'Party Room',
      reason: 'Time slot conflicts with a scheduled maintenance window.',
    });

    expect(html).toContain('Party Room');
    expect(html).toContain('Time slot conflicts with a scheduled maintenance window.');
    expect(html.toLowerCase()).toContain('declined');
  });
});

// ---------------------------------------------------------------------------
// 6. welcome
// ---------------------------------------------------------------------------

describe('renderTemplate("welcome")', () => {
  it('includes onboarding content with first name, property, and login URL', () => {
    const html = renderTemplate('welcome', {
      firstName: 'Emily',
      propertyName: 'The Meridian Towers',
      loginUrl: 'https://app.concierge.io/auth/login',
    });

    expect(html).toContain('Emily');
    expect(html).toContain('The Meridian Towers');
    expect(html).toContain('https://app.concierge.io/auth/login');
    expect(html.toLowerCase()).toContain('welcome');
  });
});

// ---------------------------------------------------------------------------
// 7. password_reset
// ---------------------------------------------------------------------------

describe('renderTemplate("password_reset")', () => {
  it('includes reset URL and expiry, plus security warning', () => {
    const html = renderTemplate('password_reset', {
      resetUrl: 'https://app.concierge.io/auth/reset?token=abc123',
      expiresIn: '1 hour',
    });

    expect(html).toContain('https://app.concierge.io/auth/reset?token=abc123');
    expect(html).toContain('1 hour');
    // Security warning about not sharing / not requesting
    expect(html.toLowerCase()).toMatch(/didn.t request|ignore this email|do not share/);
  });
});

// ---------------------------------------------------------------------------
// 8. incident_escalation
// ---------------------------------------------------------------------------

describe('renderTemplate("incident_escalation")', () => {
  it('includes incident title, priority, escalation target, and urgency styling', () => {
    const html = renderTemplate('incident_escalation', {
      incidentTitle: 'Water leak in parking level B2',
      priority: 'critical',
      escalatedTo: 'Property Manager — Alex Rivera',
    });

    expect(html).toContain('Water leak in parking level B2');
    expect(html).toContain('critical');
    expect(html).toContain('Property Manager — Alex Rivera');
    // Urgency styling: red/warning color for critical priority
    expect(html).toMatch(/#[dDeE][cC]?[0-9a-fA-F]{4,5}|#[rR][eE][dD]|red|#ef4444|#dc2626|#b91c1c/);
  });
});

// ---------------------------------------------------------------------------
// 9. All templates include header with logo + footer with unsubscribe
// ---------------------------------------------------------------------------

describe('all templates include header and footer', () => {
  const templateCases: Array<{ name: string; vars: Record<string, string> }> = [
    {
      name: 'package_received',
      vars: { residentName: 'A', packageRef: 'B', unitNumber: 'C' },
    },
    {
      name: 'package_reminder',
      vars: { residentName: 'A', packageRef: 'B', unitNumber: 'C' },
    },
    {
      name: 'maintenance_update',
      vars: { requestRef: 'A', status: 'open', updatedBy: 'B' },
    },
    {
      name: 'booking_approved',
      vars: { amenityName: 'A', date: 'B', time: 'C' },
    },
    {
      name: 'booking_declined',
      vars: { amenityName: 'A', reason: 'B' },
    },
    {
      name: 'welcome',
      vars: { firstName: 'A', propertyName: 'B', loginUrl: 'https://example.com' },
    },
    {
      name: 'password_reset',
      vars: { resetUrl: 'https://example.com/reset', expiresIn: '1 hour' },
    },
    {
      name: 'incident_escalation',
      vars: { incidentTitle: 'A', priority: 'high', escalatedTo: 'B' },
    },
  ];

  for (const { name, vars } of templateCases) {
    it(`${name} includes header with Concierge branding`, () => {
      const html = renderTemplate(name, vars);
      expect(html.toLowerCase()).toContain('concierge');
    });

    it(`${name} includes footer with unsubscribe link`, () => {
      const html = renderTemplate(name, vars);
      expect(html.toLowerCase()).toContain('unsubscribe');
    });
  }
});

// ---------------------------------------------------------------------------
// 10. Variable escaping — XSS prevention
// ---------------------------------------------------------------------------

describe('variable escaping (XSS prevention)', () => {
  it('escapes HTML entities in variable values', () => {
    const html = renderTemplate('package_received', {
      residentName: '<script>alert("xss")</script>',
      packageRef: 'PKG-001',
      unitNumber: '100',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes ampersands and quotes', () => {
    const html = renderTemplate('package_received', {
      residentName: 'O\'Brien & "Associates"',
      packageRef: 'PKG-002',
      unitNumber: '200',
    });

    expect(html).toContain('&amp;');
    expect(html).toContain('&#39;');
    expect(html).toContain('&quot;');
  });
});

// ---------------------------------------------------------------------------
// 11. Missing variable throws clear error
// ---------------------------------------------------------------------------

describe('missing variable handling', () => {
  it('throws MissingVariableError when a required variable is missing', () => {
    expect(() =>
      renderTemplate('package_received', {
        residentName: 'Jane',
        // packageRef and unitNumber missing
      }),
    ).toThrow(MissingVariableError);
  });

  it('includes the missing variable name in the error message', () => {
    expect(() =>
      renderTemplate('package_received', {
        residentName: 'Jane',
      }),
    ).toThrow(/packageRef/);
  });

  it('does not produce {{undefined}} in output', () => {
    // Ensure the system doesn't silently pass through undefined
    expect(() =>
      renderTemplate('maintenance_update', {
        requestRef: 'MNT-001',
        // status and updatedBy are missing
      }),
    ).toThrow(MissingVariableError);
  });
});

// ---------------------------------------------------------------------------
// 12. Unknown template throws TemplateNotFoundError
// ---------------------------------------------------------------------------

describe('unknown template handling', () => {
  it('throws TemplateNotFoundError for an unknown template name', () => {
    expect(() => renderTemplate('nonexistent_template', { foo: 'bar' })).toThrow(
      TemplateNotFoundError,
    );
  });

  it('includes the template name in the error message', () => {
    expect(() => renderTemplate('totally_fake', {})).toThrow(/totally_fake/);
  });
});

// ---------------------------------------------------------------------------
// 13. Conditional sections (if/else blocks)
// ---------------------------------------------------------------------------

describe('conditional sections', () => {
  it('renders if-block content when condition variable is truthy', () => {
    const html = renderTemplate('maintenance_update', {
      requestRef: 'MNT-100',
      status: 'completed',
      updatedBy: 'Staff',
      resolutionNotes: 'Replaced faulty valve.',
    });

    expect(html).toContain('Replaced faulty valve.');
  });

  it('omits if-block content when condition variable is falsy', () => {
    const html = renderTemplate('maintenance_update', {
      requestRef: 'MNT-101',
      status: 'in_progress',
      updatedBy: 'Staff',
    });

    // Should not contain resolution-specific text when status is not completed
    expect(html).not.toContain('Resolution');
  });
});

// ---------------------------------------------------------------------------
// 14. Loop support (for notification digests)
// ---------------------------------------------------------------------------

describe('loop support', () => {
  it('renders a list of items using the digest template', () => {
    const html = renderTemplate('notification_digest', {
      recipientName: 'Alex',
      items: [
        { title: 'Package arrived', description: 'PKG-001 at front desk' },
        { title: 'Booking confirmed', description: 'Gym — March 20' },
        { title: 'Maintenance update', description: 'MNT-042 completed' },
      ],
    });

    expect(html).toContain('Alex');
    expect(html).toContain('Package arrived');
    expect(html).toContain('PKG-001 at front desk');
    expect(html).toContain('Booking confirmed');
    expect(html).toContain('Gym — March 20');
    expect(html).toContain('Maintenance update');
    expect(html).toContain('MNT-042 completed');
  });

  it('renders empty state when items array is empty', () => {
    const html = renderTemplate('notification_digest', {
      recipientName: 'Sam',
      items: [],
    });

    expect(html).toContain('Sam');
    expect(html.toLowerCase()).toContain('no new notifications');
  });
});
