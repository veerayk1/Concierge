import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MarketingLayout from '../layout';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Marketing Layout', () => {
  it('renders navigation with all required links', () => {
    render(
      <MarketingLayout>
        <div>Page content</div>
      </MarketingLayout>,
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();

    // Navigation links (may also appear in footer, so check within nav)
    const navLinks = within(nav).getAllByRole('link');
    const navHrefs = navLinks.map((link) => link.getAttribute('href'));
    expect(navHrefs).toContain('/features');
    expect(navHrefs).toContain('/pricing');
    expect(navHrefs).toContain('/contact');
    expect(navHrefs).toContain('/login');
  });

  it('renders logo linking to home', () => {
    render(
      <MarketingLayout>
        <div>Page content</div>
      </MarketingLayout>,
    );

    const logoLink = screen.getByRole('link', { name: /concierge/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders footer with company info and links', () => {
    render(
      <MarketingLayout>
        <div>Page content</div>
      </MarketingLayout>,
    );

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();

    // Footer contains company name (appears in brand and copyright)
    expect(within(footer).getAllByText(/concierge/i).length).toBeGreaterThanOrEqual(1);

    // Footer has relevant links
    expect(within(footer).getByRole('link', { name: /privacy/i })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: /terms/i })).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <MarketingLayout>
        <div>Test page content</div>
      </MarketingLayout>,
    );

    expect(screen.getByText('Test page content')).toBeInTheDocument();
  });

  it('has a hamburger menu button for mobile', () => {
    render(
      <MarketingLayout>
        <div>Page content</div>
      </MarketingLayout>,
    );

    // Hamburger button exists (visible on mobile via CSS, hidden on desktop)
    const menuButton = screen.getByRole('button', { name: /menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('toggles mobile menu when hamburger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MarketingLayout>
        <div>Page content</div>
      </MarketingLayout>,
    );

    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);

    // Mobile menu should be visible with navigation links
    const mobileNav = screen.getByTestId('mobile-menu');
    expect(mobileNav).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /features/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /pricing/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /login/i })).toBeInTheDocument();
  });
});
