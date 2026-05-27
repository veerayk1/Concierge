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

    // We match against module-title keywords. getAllByText because the same
    // SEO phrase often shows up in both the module h3 and the FAQ block.
    for (const re of [
      /package management software/i,
      /visitor management system/i,
      /maintenance request software/i,
      /amenity booking software/i,
      /security command center/i,
      /board governance software/i,
    ]) {
      expect(screen.getAllByText(re).length).toBeGreaterThan(0);
    }
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
