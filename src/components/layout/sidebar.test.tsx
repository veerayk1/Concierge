/**
 * Concierge — Sidebar Component Tests
 *
 * Verifies the sidebar renders correct items for each role,
 * handles collapse/expand, and maintains accessibility.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from './sidebar';
import type { Role } from '@/types';

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderSidebar(role: Role, props?: Partial<React.ComponentProps<typeof Sidebar>>) {
  const defaultProps = {
    role,
    collapsed: false,
    onCollapsedChange: vi.fn(),
    ...props,
  };
  return render(<Sidebar {...defaultProps} />);
}

// ---------------------------------------------------------------------------
// Role-based rendering
// ---------------------------------------------------------------------------

describe('Sidebar role-based rendering', () => {
  it('renders Dashboard for all staff roles', () => {
    const staffRoles: Role[] = [
      'super_admin',
      'property_admin',
      'property_manager',
      'security_supervisor',
      'security_guard',
      'front_desk',
      'maintenance_staff',
      'superintendent',
    ];

    for (const role of staffRoles) {
      const { unmount } = renderSidebar(role);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      unmount();
    }
  });

  it('renders Dashboard for all resident roles', () => {
    const residentRoles: Role[] = [
      'resident_owner',
      'resident_tenant',
      'family_member',
      'offsite_owner',
    ];

    for (const role of residentRoles) {
      const { unmount } = renderSidebar(role);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      unmount();
    }
  });

  it('shows SYSTEM group only for super_admin', () => {
    renderSidebar('super_admin');
    expect(screen.getByText('SYSTEM')).toBeInTheDocument();
    expect(screen.getByText('Multi-Property Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Platform Health')).toBeInTheDocument();
  });

  it('hides SYSTEM group for property_admin', () => {
    renderSidebar('property_admin');
    expect(screen.queryByText('SYSTEM')).not.toBeInTheDocument();
    expect(screen.queryByText('Multi-Property Dashboard')).not.toBeInTheDocument();
  });

  it('shows Security Console for security_guard', () => {
    renderSidebar('security_guard');
    expect(screen.getByText('Security Console')).toBeInTheDocument();
  });

  it('hides Security Console for maintenance_staff', () => {
    renderSidebar('maintenance_staff');
    expect(screen.queryByText('Security Console')).not.toBeInTheDocument();
  });

  it('shows My Packages for resident_owner', () => {
    renderSidebar('resident_owner');
    expect(screen.getByText('My Packages')).toBeInTheDocument();
    expect(screen.getByText('My Requests')).toBeInTheDocument();
    expect(screen.getByText('Amenity Booking')).toBeInTheDocument();
  });

  it('hides My Requests for family_member', () => {
    renderSidebar('family_member');
    expect(screen.getByText('My Packages')).toBeInTheDocument();
    expect(screen.queryByText('My Requests')).not.toBeInTheDocument();
  });

  it('shows My Account for residents', () => {
    const residentRoles: Role[] = [
      'resident_owner',
      'resident_tenant',
      'family_member',
      'offsite_owner',
    ];
    for (const role of residentRoles) {
      const { unmount } = renderSidebar(role);
      expect(screen.getByText('My Account')).toBeInTheDocument();
      unmount();
    }
  });

  it('shows Settings only for admin roles', () => {
    renderSidebar('super_admin');
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('hides Settings for property_manager', () => {
    renderSidebar('property_manager');
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('shows User Management only for admin roles', () => {
    renderSidebar('property_admin');
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('hides User Management for property_manager', () => {
    renderSidebar('property_manager');
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
  });

  it('shows Board Member navigation correctly', () => {
    renderSidebar('board_member');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Amenities')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Building Analytics')).toBeInTheDocument();
    expect(screen.queryByText('Security Console')).not.toBeInTheDocument();
    expect(screen.queryByText('Packages')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Collapse/Expand
// ---------------------------------------------------------------------------

describe('Sidebar collapse behavior', () => {
  it('shows labels when expanded', () => {
    renderSidebar('super_admin', { collapsed: false });
    expect(screen.getByText('Dashboard')).toBeVisible();
    expect(screen.getByText('Concierge')).toBeVisible();
  });

  it('hides labels when collapsed', () => {
    renderSidebar('super_admin', { collapsed: true });
    // Group labels should be hidden
    expect(screen.queryByText('SYSTEM')).not.toBeInTheDocument();
    expect(screen.queryByText('OVERVIEW')).not.toBeInTheDocument();
  });

  it('shows icon logo when collapsed (text hidden)', () => {
    renderSidebar('super_admin', { collapsed: true });
    // When collapsed, the "Concierge" text is hidden, only the icon logo remains
    expect(screen.queryByText('Concierge')).not.toBeInTheDocument();
  });

  it('calls onCollapsedChange when toggle is clicked', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    renderSidebar('super_admin', { collapsed: false, onCollapsedChange });

    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    await user.click(toggle);
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
  });

  it('shows expand label when collapsed', () => {
    renderSidebar('super_admin', { collapsed: true });
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Active state
// ---------------------------------------------------------------------------

describe('Sidebar active state', () => {
  it('marks the active item with aria-current="page"', () => {
    renderSidebar('super_admin');
    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark non-active items with aria-current', () => {
    renderSidebar('super_admin');
    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    expect(settingsLink).not.toHaveAttribute('aria-current');
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('Sidebar accessibility', () => {
  it('has nav landmark with aria-label', () => {
    renderSidebar('super_admin');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav).toBeInTheDocument();
  });

  it('renders items as links', () => {
    renderSidebar('super_admin');
    const links = screen.getAllByRole('link');
    // At minimum: logo link + all nav items
    expect(links.length).toBeGreaterThan(5);
  });
});

// ---------------------------------------------------------------------------
// Badge counts
// ---------------------------------------------------------------------------

describe('Sidebar badge counts', () => {
  it('shows badge count when provided', () => {
    renderSidebar('super_admin', {
      badgeCounts: { unreleased_packages: 5 },
    });
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows 99+ for counts over 99', () => {
    renderSidebar('super_admin', {
      badgeCounts: { unreleased_packages: 150 },
    });
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('does not show badge for zero count', () => {
    renderSidebar('super_admin', {
      badgeCounts: { unreleased_packages: 0 },
    });
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
