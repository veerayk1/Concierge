/**
 * Email Template Enhancements — TDD Tests
 *
 * Verifies that all key email templates include:
 * - Property branding (Concierge logo/name)
 * - Resident name personalization
 * - Action links (CTAs)
 * - Responsive HTML structure
 * - Unsubscribe footer
 *
 * Templates tested:
 * 1. Package notification email
 * 2. Maintenance request update
 * 3. Welcome email
 * 4. Announcement distribution
 * 5. Password reset
 */

import { describe, expect, it } from 'vitest';
import { renderTemplate } from '@/server/email-templates';

// ===========================================================================
// 1. Package Notification Email Template
// ===========================================================================

describe('Email Template — Package Notification', () => {
  const vars = {
    residentName: 'Maria Rodriguez',
    packageRef: 'PKG-20260319-042',
    unitNumber: '1502',
  };

  it('1. includes property branding (Concierge)', () => {
    const html = renderTemplate('package_received', vars);
    expect(html.toLowerCase()).toContain('concierge');
  });

  it('2. includes resident name for personalization', () => {
    const html = renderTemplate('package_received', vars);
    expect(html).toContain('Maria Rodriguez');
  });

  it('3. includes package reference number', () => {
    const html = renderTemplate('package_received', vars);
    expect(html).toContain('PKG-20260319-042');
  });

  it('4. includes unit number', () => {
    const html = renderTemplate('package_received', vars);
    expect(html).toContain('1502');
  });

  it('5. includes unsubscribe link in footer', () => {
    const html = renderTemplate('package_received', vars);
    expect(html.toLowerCase()).toContain('unsubscribe');
  });

  it('6. renders valid HTML document structure', () => {
    const html = renderTemplate('package_received', vars);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    expect(html).toContain('<head>');
    expect(html).toContain('<body>');
  });

  it('7. includes responsive viewport meta tag', () => {
    const html = renderTemplate('package_received', vars);
    expect(html).toContain('viewport');
    expect(html).toContain('width=device-width');
  });

  it('8. includes info-card for structured data display', () => {
    const html = renderTemplate('package_received', vars);
    expect(html).toContain('info-card');
  });

  it('9. package reminder variant includes "still waiting" messaging', () => {
    const html = renderTemplate('package_reminder', vars);
    expect(html.toLowerCase()).toContain('still waiting');
    expect(html).toContain('Maria Rodriguez');
  });

  it('10. XSS protection — escapes HTML in resident name', () => {
    const xssVars = {
      ...vars,
      residentName: '<script>alert("xss")</script>',
    };
    const html = renderTemplate('package_received', xssVars);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ===========================================================================
// 2. Maintenance Request Update Template
// ===========================================================================

describe('Email Template — Maintenance Request Update', () => {
  const vars = {
    requestRef: 'MNT-2026-0142',
    status: 'in_progress',
    updatedBy: 'Mike Chen',
  };

  it('11. includes property branding', () => {
    const html = renderTemplate('maintenance_update', vars);
    expect(html.toLowerCase()).toContain('concierge');
  });

  it('12. includes maintenance reference number', () => {
    const html = renderTemplate('maintenance_update', vars);
    expect(html).toContain('MNT-2026-0142');
  });

  it('13. includes status with styling', () => {
    const html = renderTemplate('maintenance_update', vars);
    expect(html).toContain('in_progress');
    expect(html).toContain('status-badge');
  });

  it('14. includes staff name who made the update', () => {
    const html = renderTemplate('maintenance_update', vars);
    expect(html).toContain('Mike Chen');
  });

  it('15. shows resolution notes when status is completed', () => {
    const completedVars = {
      requestRef: 'MNT-2026-0143',
      status: 'completed',
      updatedBy: 'Sarah Park',
      resolutionNotes: 'Replaced faulty thermostat. System operating normally.',
    };
    const html = renderTemplate('maintenance_update', completedVars);
    expect(html).toContain('Replaced faulty thermostat');
    expect(html).toContain('Resolution');
  });

  it('16. does NOT show resolution section when status is not completed', () => {
    const html = renderTemplate('maintenance_update', vars);
    expect(html).not.toContain('Resolution');
  });

  it('17. completed status has green styling class', () => {
    const completedVars = {
      requestRef: 'MNT-2026-0144',
      status: 'completed',
      updatedBy: 'Tech Team',
    };
    const html = renderTemplate('maintenance_update', completedVars);
    expect(html).toContain('status-completed');
  });

  it('18. on_hold status has amber styling class', () => {
    const holdVars = {
      requestRef: 'MNT-2026-0145',
      status: 'on_hold',
      updatedBy: 'Admin',
    };
    const html = renderTemplate('maintenance_update', holdVars);
    expect(html).toContain('status-on_hold');
  });

  it('19. includes unsubscribe footer', () => {
    const html = renderTemplate('maintenance_update', vars);
    expect(html.toLowerCase()).toContain('unsubscribe');
  });
});

// ===========================================================================
// 3. Welcome Email Template
// ===========================================================================

describe('Email Template — Welcome Email', () => {
  const vars = {
    firstName: 'Emily',
    propertyName: 'The Meridian Towers',
    loginUrl: 'https://app.concierge.io/auth/login',
  };

  it('20. includes property branding', () => {
    const html = renderTemplate('welcome', vars);
    expect(html.toLowerCase()).toContain('concierge');
  });

  it('21. includes resident first name', () => {
    const html = renderTemplate('welcome', vars);
    expect(html).toContain('Emily');
  });

  it('22. includes property name', () => {
    const html = renderTemplate('welcome', vars);
    expect(html).toContain('The Meridian Towers');
  });

  it('23. includes login URL as an action link', () => {
    const html = renderTemplate('welcome', vars);
    expect(html).toContain('https://app.concierge.io/auth/login');
    // Should be an actual clickable link/button
    expect(html).toContain('href=');
  });

  it('24. includes a call-to-action button', () => {
    const html = renderTemplate('welcome', vars);
    expect(html).toContain('class="btn"');
    expect(html.toLowerCase()).toContain('sign in');
  });

  it('25. includes "Welcome" in the heading', () => {
    const html = renderTemplate('welcome', vars);
    expect(html.toLowerCase()).toContain('welcome');
  });

  it('26. includes unsubscribe footer', () => {
    const html = renderTemplate('welcome', vars);
    expect(html.toLowerCase()).toContain('unsubscribe');
  });

  it('27. renders valid HTML structure', () => {
    const html = renderTemplate('welcome', vars);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
  });
});

// ===========================================================================
// 4. Announcement Distribution Template
// ===========================================================================

describe('Email Template — Announcement Distribution', () => {
  it('28. announcement template is registered', () => {
    const html = renderTemplate('announcement', {
      title: 'Holiday Schedule Update',
      body: 'The building office will be closed from December 24-26.',
      propertyName: 'Lakeview Residences',
      publishedBy: 'Management Office',
    });
    expect(html).toBeDefined();
    expect(typeof html).toBe('string');
  });

  it('29. includes property branding', () => {
    const html = renderTemplate('announcement', {
      title: 'Elevator Maintenance',
      body: 'The west elevator will be out of service on March 25.',
      propertyName: 'Lakeview Residences',
      publishedBy: 'Building Operations',
    });
    expect(html.toLowerCase()).toContain('concierge');
  });

  it('30. includes announcement title', () => {
    const html = renderTemplate('announcement', {
      title: 'Fire Drill — March 28',
      body: 'A fire drill will be conducted on March 28 at 10:00 AM.',
      propertyName: 'Lakeview Residences',
      publishedBy: 'Fire Safety',
    });
    expect(html).toContain('Fire Drill');
  });

  it('31. includes announcement body content', () => {
    const html = renderTemplate('announcement', {
      title: 'Pool Opening',
      body: 'The rooftop pool will reopen for the season on May 1. New rules are posted.',
      propertyName: 'Lakeview Residences',
      publishedBy: 'Amenities Team',
    });
    expect(html).toContain('rooftop pool will reopen');
  });

  it('32. includes property name', () => {
    const html = renderTemplate('announcement', {
      title: 'Test',
      body: 'Test announcement body content here.',
      propertyName: 'Harbor View Condos',
      publishedBy: 'Admin',
    });
    expect(html).toContain('Harbor View Condos');
  });

  it('33. includes published by attribution', () => {
    const html = renderTemplate('announcement', {
      title: 'Test',
      body: 'Test announcement body content here.',
      propertyName: 'Harbor View Condos',
      publishedBy: 'Property Management Office',
    });
    expect(html).toContain('Property Management Office');
  });

  it('34. includes unsubscribe footer', () => {
    const html = renderTemplate('announcement', {
      title: 'Test',
      body: 'Test content for footer check.',
      propertyName: 'Test Property',
      publishedBy: 'Admin',
    });
    expect(html.toLowerCase()).toContain('unsubscribe');
  });

  it('35. XSS protection — escapes HTML in title and body', () => {
    const html = renderTemplate('announcement', {
      title: '<script>alert("xss")</script>Malicious',
      body: '<script>document.cookie</script>Important notice.',
      propertyName: 'Test',
      publishedBy: 'Admin',
    });
    // Script tags must be escaped, not rendered as executable HTML
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;');
  });
});

// ===========================================================================
// 5. Password Reset Template
// ===========================================================================

describe('Email Template — Password Reset', () => {
  const vars = {
    resetUrl: 'https://app.concierge.io/auth/reset?token=abc123xyz789',
    expiresIn: '1 hour',
  };

  it('36. includes property branding', () => {
    const html = renderTemplate('password_reset', vars);
    expect(html.toLowerCase()).toContain('concierge');
  });

  it('37. includes reset URL as action link', () => {
    const html = renderTemplate('password_reset', vars);
    expect(html).toContain('https://app.concierge.io/auth/reset?token=abc123xyz789');
    expect(html).toContain('href=');
  });

  it('38. includes reset button CTA', () => {
    const html = renderTemplate('password_reset', vars);
    expect(html).toContain('class="btn"');
    expect(html.toLowerCase()).toContain('reset password');
  });

  it('39. includes expiry information', () => {
    const html = renderTemplate('password_reset', vars);
    expect(html).toContain('1 hour');
  });

  it('40. includes security warning about not sharing', () => {
    const html = renderTemplate('password_reset', vars);
    expect(html.toLowerCase()).toMatch(/didn.t request|ignore this email|do not share/);
  });

  it('41. includes unsubscribe footer', () => {
    const html = renderTemplate('password_reset', vars);
    expect(html.toLowerCase()).toContain('unsubscribe');
  });

  it('42. renders valid HTML document structure', () => {
    const html = renderTemplate('password_reset', vars);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });
});

// ===========================================================================
// Cross-Template Consistency
// ===========================================================================

describe('Email Templates — Cross-Template Consistency', () => {
  const templateCases = [
    {
      name: 'package_received',
      vars: { residentName: 'Test', packageRef: 'PKG-001', unitNumber: '101' },
    },
    {
      name: 'maintenance_update',
      vars: { requestRef: 'MNT-001', status: 'open', updatedBy: 'Staff' },
    },
    {
      name: 'welcome',
      vars: { firstName: 'Test', propertyName: 'Test Property', loginUrl: 'https://example.com' },
    },
    {
      name: 'announcement',
      vars: { title: 'Test', body: 'Test body', propertyName: 'Test', publishedBy: 'Admin' },
    },
    {
      name: 'password_reset',
      vars: { resetUrl: 'https://example.com/reset', expiresIn: '1 hour' },
    },
  ];

  for (const { name, vars } of templateCases) {
    it(`43-${name}: includes Concierge branding in header`, () => {
      const html = renderTemplate(name, vars);
      expect(html).toContain('email-header');
      expect(html).toContain('email-logo');
      expect(html.toLowerCase()).toContain('concierge');
    });

    it(`44-${name}: includes footer with unsubscribe`, () => {
      const html = renderTemplate(name, vars);
      expect(html).toContain('email-footer');
      expect(html.toLowerCase()).toContain('unsubscribe');
    });

    it(`45-${name}: uses responsive email container`, () => {
      const html = renderTemplate(name, vars);
      expect(html).toContain('email-wrapper');
      expect(html).toContain('email-container');
      expect(html).toContain('max-width');
    });

    it(`46-${name}: has proper HTML email boilerplate`, () => {
      const html = renderTemplate(name, vars);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('utf-8');
      expect(html).toContain('viewport');
    });
  }
});
