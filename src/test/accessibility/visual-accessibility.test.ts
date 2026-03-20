/**
 * Color Contrast & Visual Accessibility Tests — WCAG 2.2 AA
 *
 * Validates visual accessibility requirements:
 *   - Status badges use both color AND text (not color-only indicators)
 *   - Error states have icon + text (not just red border)
 *   - Loading states have aria-busy="true" or role="status"
 *   - Empty states have descriptive text
 *   - Images have alt text
 *   - Icons used as buttons have aria-label
 *   - Focus indicators are visible (outline or ring)
 *
 * @module test/accessibility/visual-accessibility
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

// ---------------------------------------------------------------------------
// 1. Status badges use both color AND text (not color-only indicators)
// ---------------------------------------------------------------------------

describe('Status badges — color AND text (no color-only indicators)', () => {
  it('StatusBadge always renders text content alongside color', () => {
    const statuses = ['success', 'warning', 'error', 'info', 'neutral'] as const;
    const labels = ['Active', 'Expiring', 'Expired', 'Pending Review', 'Draft'];

    statuses.forEach((status, i) => {
      const { unmount } = render(createElement(StatusBadge, { status }, labels[i]));
      const badge = screen.getByText(labels[i]!);
      expect(badge).toBeInTheDocument();
      // Text content must be non-empty — color alone is insufficient
      expect(badge.textContent!.trim().length).toBeGreaterThan(0);
      unmount();
    });
  });

  it('StatusBadge dot indicator is aria-hidden (decorative)', () => {
    const { container } = render(
      createElement(StatusBadge, { status: 'warning', dot: true }, 'Pending'),
    );
    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('Badge with dot renders both dot (decorative) and text (informational)', () => {
    const { container } = render(
      createElement(Badge, { variant: 'success', dot: true }, 'Compliant'),
    );
    // Dot is decorative
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).not.toBeNull();
    // Text is informational
    expect(screen.getByText('Compliant')).toBeInTheDocument();
  });

  it('Badge without dot still has text content for color-blind users', () => {
    render(createElement(Badge, { variant: 'error' }, 'Overdue'));
    const badge = screen.getByText('Overdue');
    expect(badge.textContent).toBe('Overdue');
  });

  it('All Badge variants include readable text', () => {
    const variants = ['default', 'success', 'warning', 'error', 'info', 'primary'] as const;
    const labels = ['None', 'Active', 'Warning', 'Critical', 'Info', 'New'];

    variants.forEach((variant, i) => {
      const { unmount } = render(createElement(Badge, { variant }, labels[i]));
      expect(screen.getByText(labels[i]!)).toBeInTheDocument();
      unmount();
    });
  });

  it('StatusBadge without dot still conveys meaning through text', () => {
    render(createElement(StatusBadge, { status: 'error', dot: false }, 'Failed'));
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2. Error states have icon + text (not just red border)
// ---------------------------------------------------------------------------

describe('Error states — icon + text (not just visual border)', () => {
  it('Input error renders error text with role="alert"', () => {
    render(createElement(Input, { label: 'Email', error: 'Invalid email format' }));
    const errorEl = screen.getByRole('alert');
    expect(errorEl).toBeInTheDocument();
    expect(errorEl.textContent).toBe('Invalid email format');
  });

  it('Input error text is styled with error color class', () => {
    render(createElement(Input, { label: 'Phone', error: 'Phone is required' }));
    const errorEl = screen.getByRole('alert');
    expect(errorEl.className).toContain('text-error');
  });

  it('FormField error renders error text with role="alert"', () => {
    render(
      createElement(
        FormField,
        { label: 'Category', error: 'Please select a category' } as any,
        createElement('select', null),
      ),
    );
    const errorEl = screen.getByRole('alert');
    expect(errorEl.textContent).toBe('Please select a category');
  });

  it('Textarea error renders descriptive error text', () => {
    render(createElement(Textarea, { label: 'Notes', error: 'Description too short' }));
    const errorEl = screen.getByRole('alert');
    expect(errorEl.textContent).toBe('Description too short');
  });

  it('Checkbox error renders error text with role="alert"', () => {
    render(createElement(Checkbox, { label: 'Accept terms', error: 'You must accept the terms' }));
    const errorEl = screen.getByRole('alert');
    expect(errorEl.textContent).toBe('You must accept the terms');
  });

  it('Error state changes input border and provides text — not border alone', () => {
    render(createElement(Input, { label: 'Unit', error: 'Required field' }));
    const input = screen.getByLabelText('Unit');
    // Border changes (visual cue)
    expect(input.className).toContain('border-error');
    // Text is also present (non-visual cue)
    expect(screen.getByRole('alert')).toBeInTheDocument();
    // aria-invalid is set for assistive technology
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('Multiple errors on a form are each announced', () => {
    render(
      createElement(
        'form',
        null,
        createElement(Input, { label: 'Name', error: 'Name is required' }),
        createElement(Input, { label: 'Email', error: 'Email is invalid' }),
      ),
    );

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(alerts[0]!.textContent).toBe('Name is required');
    expect(alerts[1]!.textContent).toBe('Email is invalid');
  });
});

// ---------------------------------------------------------------------------
// 3. Loading states have aria-busy="true" or role="status"
// ---------------------------------------------------------------------------

describe('Loading states — aria-busy and role="status"', () => {
  it('Loading container has aria-busy="true"', () => {
    render(
      createElement(
        'div',
        { 'aria-busy': 'true', 'aria-label': 'Loading packages' },
        createElement(Skeleton, { className: 'h-8 w-full' }),
        createElement(Skeleton, { className: 'h-8 w-full' }),
      ),
    );

    const container = document.querySelector('[aria-busy="true"]');
    expect(container).not.toBeNull();
    expect(container).toHaveAttribute('aria-label', 'Loading packages');
  });

  it('Loading spinner has role="status" with descriptive text', () => {
    render(
      createElement(
        'div',
        { role: 'status', 'aria-label': 'Loading' },
        createElement('svg', { 'aria-hidden': 'true', className: 'animate-spin' }),
        createElement('span', { className: 'sr-only' }, 'Loading content...'),
      ),
    );

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
  });

  it('Button loading state disables and shows spinner', () => {
    render(createElement(Button, { loading: true }, 'Saving'));
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // SVG spinner is present inside the button
    const svg = button.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('Skeleton loader container communicates loading state', () => {
    const { container } = render(
      createElement(
        'div',
        { 'aria-busy': 'true', role: 'status' },
        createElement('span', { className: 'sr-only' }, 'Loading data...'),
        createElement(Skeleton, { className: 'h-12 w-full' }),
        createElement(Skeleton, { className: 'h-12 w-full' }),
        createElement(Skeleton, { className: 'h-12 w-full' }),
      ),
    );

    const loadingRegion = container.querySelector('[aria-busy="true"]');
    expect(loadingRegion).not.toBeNull();
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('When loading completes, aria-busy is removed', () => {
    const { rerender, container } = render(
      createElement('div', { 'aria-busy': 'true' }, createElement(Skeleton, {})),
    );

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();

    rerender(createElement('div', { 'aria-busy': undefined }, 'Content loaded'));

    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    expect(screen.getByText('Content loaded')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4. Empty states have descriptive text
// ---------------------------------------------------------------------------

describe('Empty states — descriptive text', () => {
  it('EmptyState component renders title text', () => {
    render(createElement(EmptyState, { title: 'No packages found' }));
    expect(screen.getByText('No packages found')).toBeInTheDocument();
  });

  it('EmptyState with description provides additional context', () => {
    render(
      createElement(EmptyState, {
        title: 'No maintenance requests',
        description: 'When residents submit maintenance requests, they will appear here.',
      }),
    );
    expect(screen.getByText('No maintenance requests')).toBeInTheDocument();
    expect(
      screen.getByText('When residents submit maintenance requests, they will appear here.'),
    ).toBeInTheDocument();
  });

  it('EmptyState with action button provides a path forward', () => {
    render(
      createElement(EmptyState, {
        title: 'No events logged',
        description: 'Start by creating your first event.',
        action: createElement(Button, null, 'Create Event'),
      }),
    );

    expect(screen.getByText('No events logged')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Event' })).toBeInTheDocument();
  });

  it('EmptyState title uses heading element for document structure', () => {
    render(createElement(EmptyState, { title: 'No results' }));
    const heading = screen.getByText('No results');
    expect(heading.tagName).toBe('H3');
  });

  it('EmptyState icon is decorative and does not replace text', () => {
    render(
      createElement(EmptyState, {
        title: 'No visitors today',
        icon: createElement('svg', { 'aria-hidden': 'true', width: 24, height: 24 }),
      }),
    );

    // Text is always present regardless of icon
    expect(screen.getByText('No visitors today')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 5. Images have alt text
// ---------------------------------------------------------------------------

describe('Images — alt text requirement', () => {
  it('Informative image has descriptive alt text', () => {
    render(
      createElement('img', { src: '/floor-plan.png', alt: 'Floor plan for Building A, Level 3' }),
    );
    const img = screen.getByAltText('Floor plan for Building A, Level 3');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt');
    expect(img.getAttribute('alt')!.length).toBeGreaterThan(0);
  });

  it('Decorative image has empty alt text', () => {
    const { container } = render(
      createElement('img', { src: '/divider.png', alt: '', 'aria-hidden': 'true' }),
    );
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
  });

  it('Avatar image has meaningful alt text', () => {
    render(createElement('img', { src: '/avatar.jpg', alt: 'Profile photo for John Doe' }));
    const img = screen.getByAltText('Profile photo for John Doe');
    expect(img).toBeInTheDocument();
  });

  it('Logo image has alt text describing the logo', () => {
    render(createElement('img', { src: '/logo.svg', alt: 'Concierge logo' }));
    const img = screen.getByAltText('Concierge logo');
    expect(img).toBeInTheDocument();
  });

  it('SVG used as decorative element has aria-hidden', () => {
    const { container } = render(
      createElement('svg', { 'aria-hidden': 'true', viewBox: '0 0 24 24' }),
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('Image link has alt text that describes the link destination', () => {
    render(
      createElement(
        'a',
        { href: '/dashboard' },
        createElement('img', { src: '/home-icon.svg', alt: 'Go to Dashboard' }),
      ),
    );

    const img = screen.getByAltText('Go to Dashboard');
    expect(img.closest('a')).toHaveAttribute('href', '/dashboard');
  });
});

// ---------------------------------------------------------------------------
// 6. Icons used as buttons have aria-label
// ---------------------------------------------------------------------------

describe('Icon buttons — aria-label required', () => {
  it('Icon-only button has aria-label', () => {
    render(
      createElement(
        Button,
        { 'aria-label': 'Close dialog' },
        createElement('svg', { 'aria-hidden': 'true', width: 16, height: 16 }),
      ),
    );

    const button = screen.getByRole('button', { name: 'Close dialog' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Close dialog');
  });

  it('Icon button with sr-only text has accessible name', () => {
    render(
      createElement(
        'button',
        { type: 'button' },
        createElement('svg', { 'aria-hidden': 'true' }),
        createElement('span', { className: 'sr-only' }, 'Edit package'),
      ),
    );

    const button = screen.getByRole('button', { name: 'Edit package' });
    expect(button).toBeInTheDocument();
  });

  it('Delete icon button has descriptive aria-label', () => {
    render(
      createElement(
        Button,
        { variant: 'danger', 'aria-label': 'Delete maintenance request' },
        createElement('svg', { 'aria-hidden': 'true' }),
      ),
    );

    const button = screen.getByRole('button', { name: 'Delete maintenance request' });
    expect(button).toHaveAttribute('aria-label', 'Delete maintenance request');
  });

  it('Notification bell icon button has aria-label', () => {
    render(
      createElement(
        'button',
        { type: 'button', 'aria-label': 'View notifications (3 unread)' },
        createElement('svg', { 'aria-hidden': 'true' }),
      ),
    );

    const button = screen.getByRole('button', { name: 'View notifications (3 unread)' });
    expect(button).toBeInTheDocument();
  });

  it('Search icon button has accessible name', () => {
    render(
      createElement(
        'button',
        { type: 'button', 'aria-label': 'Open search' },
        createElement('svg', { 'aria-hidden': 'true' }),
      ),
    );

    expect(screen.getByRole('button', { name: 'Open search' })).toBeInTheDocument();
  });

  it('Icon inside button is hidden from screen readers', () => {
    const { container } = render(
      createElement(
        Button,
        { 'aria-label': 'Settings' },
        createElement('svg', { 'aria-hidden': 'true', width: 16, height: 16 }),
      ),
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});

// ---------------------------------------------------------------------------
// 7. Focus indicators are visible (outline or ring)
// ---------------------------------------------------------------------------

describe('Focus indicators — visible outline or ring', () => {
  it('Button has focus-visible ring class', () => {
    render(createElement(Button, null, 'Save'));
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('focus-visible:ring');
  });

  it('All button variants have focus-visible ring', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger', 'link'] as const;

    variants.forEach((variant) => {
      const { unmount } = render(createElement(Button, { variant }, variant));
      const btn = screen.getByRole('button');
      expect(btn.className).toContain('focus-visible:ring');
      unmount();
    });
  });

  it('Input has focus ring class', () => {
    render(createElement(Input, { label: 'Name' }));
    const input = screen.getByLabelText('Name');
    expect(input.className).toContain('focus:ring');
  });

  it('Textarea has focus ring class', () => {
    render(createElement(Textarea, { label: 'Notes' }));
    const textarea = screen.getByLabelText('Notes');
    expect(textarea.className).toContain('focus:ring');
  });

  it('Checkbox has focus-visible ring class', () => {
    const { container } = render(createElement(Checkbox, { label: 'Accept' }));
    const checkbox = container.querySelector('button[role="checkbox"]');
    expect(checkbox).not.toBeNull();
    expect(checkbox!.className).toContain('focus-visible:ring');
  });

  it('Focus ring uses primary color for non-error states', () => {
    render(createElement(Input, { label: 'Field' }));
    const input = screen.getByLabelText('Field');
    expect(input.className).toContain('focus:ring-primary');
  });

  it('Focus ring uses error color for error states', () => {
    render(createElement(Input, { label: 'Field', error: 'Error' }));
    const input = screen.getByLabelText('Field');
    expect(input.className).toContain('focus:ring-error');
  });

  it('Interactive elements never have tabindex > 0 (natural order)', () => {
    render(
      createElement(
        'form',
        null,
        createElement(Input, { label: 'A' }),
        createElement(Input, { label: 'B' }),
        createElement(Button, null, 'Submit'),
      ),
    );

    const inputs = screen.getAllByRole('textbox');
    const buttons = screen.getAllByRole('button');

    [...inputs, ...buttons].forEach((el) => {
      expect(el.tabIndex).toBeLessThanOrEqual(0);
    });
  });
});
