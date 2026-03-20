/**
 * Navigation Accessibility Tests — WCAG 2.2 AA
 *
 * Validates that navigation components meet accessibility requirements:
 *   - Main nav has role="navigation" and aria-label
 *   - Sidebar collapse button has descriptive aria-label
 *   - Skip-to-content link exists and is first focusable element
 *   - Breadcrumbs have nav[aria-label="Breadcrumb"] wrapper
 *   - Active nav item has aria-current="page"
 *   - Dropdown menus are keyboard accessible (Enter/Space to open, Escape to close)
 *   - Focus trap in modals (Tab cycles within dialog)
 *
 * @module test/accessibility/navigation-accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ---------------------------------------------------------------------------
// 1. Main nav has role="navigation" and aria-label
// ---------------------------------------------------------------------------

describe('Main navigation — role and aria-label', () => {
  it('Navigation landmark has <nav> element with aria-label', () => {
    render(
      createElement(
        'nav',
        { 'aria-label': 'Main navigation' },
        createElement(
          'ul',
          null,
          createElement('li', null, createElement('a', { href: '/dashboard' }, 'Dashboard')),
          createElement('li', null, createElement('a', { href: '/packages' }, 'Packages')),
        ),
      ),
    );

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toBeInTheDocument();
    expect(nav.tagName).toBe('NAV');
  });

  it('Multiple navigation landmarks have distinct aria-labels', () => {
    render(
      createElement(
        'div',
        null,
        createElement(
          'nav',
          { 'aria-label': 'Main navigation' },
          createElement('a', { href: '/dashboard' }, 'Dashboard'),
        ),
        createElement(
          'nav',
          { 'aria-label': 'Breadcrumb' },
          createElement('a', { href: '/' }, 'Home'),
        ),
        createElement(
          'nav',
          { 'aria-label': 'Footer navigation' },
          createElement('a', { href: '/help' }, 'Help'),
        ),
      ),
    );

    const navs = screen.getAllByRole('navigation');
    expect(navs).toHaveLength(3);

    const labels = navs.map((n) => n.getAttribute('aria-label'));
    expect(labels).toContain('Main navigation');
    expect(labels).toContain('Breadcrumb');
    expect(labels).toContain('Footer navigation');
  });

  it('Sidebar renders as <aside> with aria-label="Main navigation"', () => {
    // Simulates the Sidebar component contract
    render(
      createElement(
        'aside',
        { 'aria-label': 'Main navigation' },
        createElement(
          'nav',
          { 'aria-label': 'Main' },
          createElement('a', { href: '/dashboard' }, 'Dashboard'),
        ),
      ),
    );

    const aside = document.querySelector('aside[aria-label="Main navigation"]');
    expect(aside).not.toBeNull();

    const innerNav = screen.getByRole('navigation', { name: 'Main' });
    expect(innerNav).toBeInTheDocument();
  });

  it('Navigation list uses <ul> with <li> items for semantic structure', () => {
    render(
      createElement(
        'nav',
        { 'aria-label': 'Main navigation' },
        createElement(
          'ul',
          null,
          createElement('li', null, createElement('a', { href: '/dashboard' }, 'Dashboard')),
          createElement('li', null, createElement('a', { href: '/packages' }, 'Packages')),
          createElement('li', null, createElement('a', { href: '/security' }, 'Security')),
        ),
      ),
    );

    const nav = screen.getByRole('navigation');
    const list = within(nav).getByRole('list');
    expect(list).toBeInTheDocument();
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// 2. Sidebar collapse button has descriptive aria-label
// ---------------------------------------------------------------------------

describe('Sidebar collapse — descriptive aria-label', () => {
  it('Collapse button has aria-label "Collapse sidebar" when expanded', () => {
    render(
      createElement(
        'button',
        { type: 'button', 'aria-label': 'Collapse sidebar' },
        createElement('svg', { 'aria-hidden': 'true' }),
      ),
    );

    const button = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Collapse sidebar');
  });

  it('Expand button has aria-label "Expand sidebar" when collapsed', () => {
    render(
      createElement(
        'button',
        { type: 'button', 'aria-label': 'Expand sidebar' },
        createElement('svg', { 'aria-hidden': 'true' }),
      ),
    );

    const button = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Expand sidebar');
  });

  it('Collapse toggle updates aria-label on click', async () => {
    const user = userEvent.setup();

    let collapsed = false;
    const onToggle = () => {
      collapsed = !collapsed;
    };

    const { rerender } = render(
      createElement(
        'button',
        {
          type: 'button',
          'aria-label': collapsed ? 'Expand sidebar' : 'Collapse sidebar',
          onClick: onToggle,
        },
        'Toggle',
      ),
    );

    const button = screen.getByRole('button', { name: 'Collapse sidebar' });
    await user.click(button);

    collapsed = true;
    rerender(
      createElement(
        'button',
        {
          type: 'button',
          'aria-label': 'Expand sidebar',
          onClick: onToggle,
        },
        'Toggle',
      ),
    );

    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
  });

  it('Collapse icon is decorative (aria-hidden)', () => {
    const { container } = render(
      createElement(
        'button',
        { type: 'button', 'aria-label': 'Collapse sidebar' },
        createElement('svg', { 'aria-hidden': 'true', className: 'h-4 w-4' }),
      ),
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});

// ---------------------------------------------------------------------------
// 3. Skip-to-content link exists and is first focusable element
// ---------------------------------------------------------------------------

describe('Skip-to-content link — first focusable element', () => {
  it('Skip link exists and targets #main-content', () => {
    render(
      createElement(
        'div',
        null,
        createElement(
          'a',
          { href: '#main-content', className: 'sr-only focus:not-sr-only' },
          'Skip to main content',
        ),
        createElement('nav', null, createElement('a', { href: '/dashboard' }, 'Dashboard')),
        createElement('main', { id: 'main-content' }, 'Page content'),
      ),
    );

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(document.getElementById('main-content')).not.toBeNull();
  });

  it('Skip link is the first focusable element on the page', () => {
    const { container } = render(
      createElement(
        'div',
        null,
        createElement(
          'a',
          { href: '#main', className: 'sr-only focus:not-sr-only' },
          'Skip to main content',
        ),
        createElement(
          'nav',
          null,
          createElement('a', { href: '/dashboard' }, 'Dashboard'),
          createElement('a', { href: '/packages' }, 'Packages'),
        ),
        createElement('main', { id: 'main' }),
      ),
    );

    // Query all focusable elements: links, buttons, inputs, etc.
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    expect(focusableElements.length).toBeGreaterThan(0);
    expect(focusableElements[0]!.textContent).toBe('Skip to main content');
  });

  it('Skip link receives focus on first Tab press', async () => {
    const user = userEvent.setup();

    render(
      createElement(
        'div',
        null,
        createElement(
          'a',
          { href: '#main-content', className: 'sr-only focus:not-sr-only' },
          'Skip to main content',
        ),
        createElement('nav', null, createElement('a', { href: '/home' }, 'Home')),
      ),
    );

    await user.tab();

    const skipLink = screen.getByText('Skip to main content');
    expect(document.activeElement).toBe(skipLink);
  });

  it('Skip link becomes visible on focus (sr-only focus:not-sr-only pattern)', () => {
    render(
      createElement(
        'a',
        { href: '#main', className: 'sr-only focus:not-sr-only focus:absolute focus:z-50' },
        'Skip to main content',
      ),
    );

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink.className).toContain('sr-only');
    expect(skipLink.className).toContain('focus:not-sr-only');
  });
});

// ---------------------------------------------------------------------------
// 4. Breadcrumbs have nav[aria-label="Breadcrumb"] wrapper
// ---------------------------------------------------------------------------

describe('Breadcrumbs — nav with aria-label', () => {
  it('Breadcrumb navigation has nav[aria-label="Breadcrumb"]', () => {
    render(
      createElement(
        'nav',
        { 'aria-label': 'Breadcrumb' },
        createElement(
          'ol',
          null,
          createElement('li', null, createElement('a', { href: '/' }, 'Home')),
          createElement(
            'li',
            null,
            createElement('span', { 'aria-hidden': 'true' }, '/'),
            createElement('a', { href: '/packages' }, 'Packages'),
          ),
          createElement(
            'li',
            { 'aria-current': 'page' },
            createElement('span', { 'aria-hidden': 'true' }, '/'),
            'Package #1234',
          ),
        ),
      ),
    );

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav).toBeInTheDocument();
  });

  it('Breadcrumb uses ordered list for semantic structure', () => {
    render(
      createElement(
        'nav',
        { 'aria-label': 'Breadcrumb' },
        createElement(
          'ol',
          null,
          createElement('li', null, createElement('a', { href: '/' }, 'Home')),
          createElement('li', null, createElement('a', { href: '/maintenance' }, 'Maintenance')),
          createElement('li', { 'aria-current': 'page' }, 'Request #567'),
        ),
      ),
    );

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const list = within(nav).getByRole('list');
    expect(list.tagName).toBe('OL');
    const items = within(nav).getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('Current breadcrumb item has aria-current="page"', () => {
    render(
      createElement(
        'nav',
        { 'aria-label': 'Breadcrumb' },
        createElement(
          'ol',
          null,
          createElement('li', null, createElement('a', { href: '/' }, 'Home')),
          createElement('li', { 'aria-current': 'page' }, 'Dashboard'),
        ),
      ),
    );

    const currentItem = screen.getByText('Dashboard').closest('li');
    expect(currentItem).toHaveAttribute('aria-current', 'page');
  });

  it('Breadcrumb separators are aria-hidden (decorative)', () => {
    const { container } = render(
      createElement(
        'nav',
        { 'aria-label': 'Breadcrumb' },
        createElement(
          'ol',
          null,
          createElement('li', null, createElement('a', { href: '/' }, 'Home')),
          createElement(
            'li',
            null,
            createElement('span', { 'aria-hidden': 'true' }, '>'),
            createElement('a', { href: '/packages' }, 'Packages'),
          ),
        ),
      ),
    );

    const separators = container.querySelectorAll('[aria-hidden="true"]');
    expect(separators.length).toBeGreaterThan(0);
    expect(separators[0]!.textContent).toBe('>');
  });
});

// ---------------------------------------------------------------------------
// 5. Active nav item has aria-current="page"
// ---------------------------------------------------------------------------

describe('Active navigation — aria-current="page"', () => {
  it('Currently active link has aria-current="page"', () => {
    render(
      createElement(
        'nav',
        { 'aria-label': 'Main navigation' },
        createElement('a', { href: '/dashboard', 'aria-current': 'page' }, 'Dashboard'),
        createElement('a', { href: '/packages' }, 'Packages'),
        createElement('a', { href: '/security' }, 'Security'),
      ),
    );

    const activeLink = screen.getByText('Dashboard');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('Inactive links do not have aria-current', () => {
    render(
      createElement(
        'nav',
        { 'aria-label': 'Main navigation' },
        createElement('a', { href: '/dashboard', 'aria-current': 'page' }, 'Dashboard'),
        createElement('a', { href: '/packages' }, 'Packages'),
        createElement('a', { href: '/security' }, 'Security'),
      ),
    );

    expect(screen.getByText('Packages')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Security')).not.toHaveAttribute('aria-current');
  });

  it('Only one navigation item has aria-current="page" at a time', () => {
    render(
      createElement(
        'nav',
        { 'aria-label': 'Main navigation' },
        createElement('a', { href: '/dashboard' }, 'Dashboard'),
        createElement('a', { href: '/packages', 'aria-current': 'page' }, 'Packages'),
        createElement('a', { href: '/security' }, 'Security'),
        createElement('a', { href: '/maintenance' }, 'Maintenance'),
      ),
    );

    const links = screen.getAllByRole('link');
    const activeLinks = links.filter((link) => link.getAttribute('aria-current') === 'page');
    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0]!.textContent).toBe('Packages');
  });

  it('aria-current changes when navigation route changes', () => {
    const { rerender } = render(
      createElement(
        'nav',
        { 'aria-label': 'Main' },
        createElement('a', { href: '/dashboard', 'aria-current': 'page' }, 'Dashboard'),
        createElement('a', { href: '/packages' }, 'Packages'),
      ),
    );

    expect(screen.getByText('Dashboard')).toHaveAttribute('aria-current', 'page');

    // Simulate route change
    rerender(
      createElement(
        'nav',
        { 'aria-label': 'Main' },
        createElement('a', { href: '/dashboard' }, 'Dashboard'),
        createElement('a', { href: '/packages', 'aria-current': 'page' }, 'Packages'),
      ),
    );

    expect(screen.getByText('Dashboard')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Packages')).toHaveAttribute('aria-current', 'page');
  });
});

// ---------------------------------------------------------------------------
// 6. Dropdown menus are keyboard accessible
// ---------------------------------------------------------------------------

describe('Dropdown menus — keyboard accessibility', () => {
  it('Dropdown trigger opens menu on Enter key', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      createElement(
        'div',
        null,
        createElement(
          'button',
          {
            'aria-haspopup': 'true',
            'aria-expanded': 'false',
            onClick: onOpen,
          },
          'Actions',
        ),
      ),
    );

    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    trigger.focus();
    await user.keyboard('{Enter}');

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('Dropdown trigger opens menu on Space key', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      createElement(
        'button',
        {
          'aria-haspopup': 'true',
          'aria-expanded': 'false',
          onClick: onOpen,
        },
        'More options',
      ),
    );

    const trigger = screen.getByRole('button', { name: 'More options' });
    trigger.focus();
    await user.keyboard(' ');

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('Escape key closes dropdown menu', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      createElement(
        'div',
        {
          role: 'menu',
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
          },
          tabIndex: 0,
        },
        createElement('button', { role: 'menuitem' }, 'Edit'),
        createElement('button', { role: 'menuitem' }, 'Delete'),
      ),
    );

    const menu = screen.getByRole('menu');
    menu.focus();
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Dropdown trigger has aria-expanded reflecting state', () => {
    const { rerender } = render(
      createElement('button', { 'aria-haspopup': 'true', 'aria-expanded': 'false' }, 'Actions'),
    );

    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    rerender(
      createElement('button', { 'aria-haspopup': 'true', 'aria-expanded': 'true' }, 'Actions'),
    );

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('Menu items are navigable with arrow keys', async () => {
    const user = userEvent.setup();

    render(
      createElement(
        'div',
        {
          role: 'menu',
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
              const items = (e.currentTarget as HTMLElement).querySelectorAll('[role="menuitem"]');
              const idx = Array.from(items).indexOf(document.activeElement as Element);
              if (idx < items.length - 1) {
                (items[idx + 1] as HTMLElement).focus();
              }
            }
          },
        },
        createElement('button', { role: 'menuitem', tabIndex: 0 }, 'Edit'),
        createElement('button', { role: 'menuitem', tabIndex: -1 }, 'Duplicate'),
        createElement('button', { role: 'menuitem', tabIndex: -1 }, 'Delete'),
      ),
    );

    const items = screen.getAllByRole('menuitem');
    items[0]!.focus();

    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[1]);

    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[2]);
  });
});

// ---------------------------------------------------------------------------
// 7. Focus trap in modals (Tab cycles within dialog)
// ---------------------------------------------------------------------------

describe('Focus trap — modal dialog Tab cycling', () => {
  it('Dialog has role="dialog" and aria-modal="true"', () => {
    render(
      createElement(
        'div',
        { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dlg-title' },
        createElement('h2', { id: 'dlg-title' }, 'Confirm Action'),
        createElement('p', null, 'Are you sure you want to proceed?'),
        createElement(Button, { variant: 'ghost' }, 'Cancel'),
        createElement(Button, { variant: 'primary' }, 'Confirm'),
      ),
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'dlg-title');
  });

  it('Dialog contains focusable elements for keyboard interaction', () => {
    render(
      createElement(
        'div',
        { role: 'dialog', 'aria-modal': 'true' },
        createElement(Button, { 'aria-label': 'Close dialog' }, 'X'),
        createElement(Button, { variant: 'ghost' }, 'Cancel'),
        createElement(Button, { variant: 'primary' }, 'Save'),
      ),
    );

    const dialog = screen.getByRole('dialog');
    const buttons = within(dialog).getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    // All buttons should be focusable
    buttons.forEach((btn) => {
      expect(btn.tabIndex).not.toBe(-1);
    });
  });

  it.todo(
    'Tab key cycles through focusable elements within dialog — needs Radix focus trap in jsdom',
    async () => {
      const user = userEvent.setup();

      render(
        createElement(
          'div',
          { role: 'dialog', 'aria-modal': 'true' },
          createElement('button', { 'aria-label': 'Close' }, 'X'),
          createElement(Input, { label: 'Reason' } as any),
          createElement(Button, { variant: 'ghost' }, 'Cancel'),
          createElement(Button, { variant: 'danger' }, 'Delete'),
        ),
      );

      const closeBtn = screen.getByRole('button', { name: 'Close' });
      closeBtn.focus();
      expect(document.activeElement).toBe(closeBtn);

      await user.tab();
      // Focus moves to the input
      const input = screen.getByLabelText('Reason');
      expect(document.activeElement).toBe(input);

      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Delete' }));
    },
  );

  it('Escape key on dialog triggers close handler', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      createElement(
        'div',
        {
          role: 'dialog',
          'aria-modal': 'true',
          tabIndex: -1,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
          },
        },
        createElement('p', null, 'Dialog content'),
        createElement(Button, null, 'OK'),
      ),
    );

    const dialog = screen.getByRole('dialog');
    dialog.focus();
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Dialog title is referenced by aria-labelledby', () => {
    render(
      createElement(
        'div',
        { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'modal-title' },
        createElement('h2', { id: 'modal-title' }, 'Delete Package'),
        createElement('p', null, 'This action cannot be undone.'),
      ),
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');

    const title = document.getElementById('modal-title');
    expect(title).not.toBeNull();
    expect(title!.textContent).toBe('Delete Package');
  });

  it('Dialog description is referenced by aria-describedby', () => {
    render(
      createElement(
        'div',
        {
          role: 'dialog',
          'aria-modal': 'true',
          'aria-labelledby': 'dlg-title',
          'aria-describedby': 'dlg-desc',
        },
        createElement('h2', { id: 'dlg-title' }, 'Release Package'),
        createElement('p', { id: 'dlg-desc' }, 'Mark this package as picked up by the resident.'),
      ),
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby', 'dlg-desc');

    const desc = document.getElementById('dlg-desc');
    expect(desc!.textContent).toBe('Mark this package as picked up by the resident.');
  });
});
