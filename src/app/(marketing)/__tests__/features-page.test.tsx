import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FeaturesPage from '../features/page';

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

describe('Features Page', () => {
  it('renders the SEO-tuned page heading', () => {
    render(<FeaturesPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /all-in-one property management/i }),
    ).toBeInTheDocument();
  });

  it('mentions every major module on the page', () => {
    render(<FeaturesPage />);

    // We match against the *module-titles* (the new SEO-rich h3s),
    // since module names mid-paragraph can be re-worded freely.
    expect(screen.getByText(/package management software/i)).toBeInTheDocument();
    expect(screen.getByText(/visitor management system/i)).toBeInTheDocument();
    expect(screen.getByText(/maintenance request software/i)).toBeInTheDocument();
    expect(screen.getByText(/amenity booking software/i)).toBeInTheDocument();
    expect(screen.getByText(/security command center/i)).toBeInTheDocument();
    expect(screen.getByText(/board governance software/i)).toBeInTheDocument();
  });

  it('has FAQ section for SEO rich results', () => {
    render(<FeaturesPage />);
    expect(screen.getByText(/common questions/i)).toBeInTheDocument();
    // Schema.org FAQ JSON-LD is rendered as a non-visible script tag.
    expect(document.querySelector('script[type="application/ld+json"]')).toBeTruthy();
  });

  it('has CTA to request a demo', () => {
    render(<FeaturesPage />);

    const ctas = screen.getAllByRole('link', { name: /request a demo/i });
    expect(ctas.length).toBeGreaterThan(0);
    expect(ctas[0]).toHaveAttribute('href', '/contact');
  });
});
