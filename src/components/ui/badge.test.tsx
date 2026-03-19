import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  // --- Variant classes ---

  it('applies default variant styles by default', () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-neutral-100');
    expect(badge.className).toContain('text-neutral-600');
    expect(badge.className).toContain('border-neutral-200/60');
  });

  it('applies success variant styles', () => {
    const { container } = render(<Badge variant="success">OK</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-success-50');
    expect(badge.className).toContain('text-success-700');
    expect(badge.className).toContain('border-success-200/60');
  });

  it('applies warning variant styles', () => {
    const { container } = render(<Badge variant="warning">Warn</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-warning-50');
    expect(badge.className).toContain('text-warning-700');
  });

  it('applies error variant styles', () => {
    const { container } = render(<Badge variant="error">Error</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-error-50');
    expect(badge.className).toContain('text-error-700');
  });

  it('applies info variant styles', () => {
    const { container } = render(<Badge variant="info">Info</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-info-50');
    expect(badge.className).toContain('text-info-700');
  });

  it('applies primary variant styles', () => {
    const { container } = render(<Badge variant="primary">Primary</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-primary-50');
    expect(badge.className).toContain('text-primary-700');
  });

  // --- Size classes ---

  it('applies sm size classes', () => {
    const { container } = render(<Badge size="sm">Small</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('text-[10px]');
    expect(badge.className).toContain('px-1.5');
  });

  it('applies md size classes by default', () => {
    const { container } = render(<Badge>Medium</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('text-[11px]');
    expect(badge.className).toContain('px-2');
  });

  it('applies lg size classes', () => {
    const { container } = render(<Badge size="lg">Large</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('text-[12px]');
    expect(badge.className).toContain('px-2.5');
  });

  // --- Dot indicator ---

  it('renders dot indicator when dot prop is true', () => {
    const { container } = render(<Badge dot>Dotted</Badge>);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
    expect(dot?.className).toContain('rounded-full');
    expect(dot?.className).toContain('bg-current');
  });

  it('does not render dot indicator by default', () => {
    const { container } = render(<Badge>No Dot</Badge>);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).not.toBeInTheDocument();
  });

  it('renders custom dotColor instead of bg-current', () => {
    const { container } = render(
      <Badge dot dotColor="bg-red-500">
        Custom Dot
      </Badge>,
    );
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
    expect(dot?.className).toContain('bg-red-500');
    expect(dot?.className).not.toContain('bg-current');
  });

  // --- Custom className ---

  it('applies custom className', () => {
    const { container } = render(<Badge className="my-custom-class">Custom</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('my-custom-class');
  });

  // --- All variant+size combinations ---

  it('renders all variant and size combinations without errors', () => {
    const variants = ['default', 'success', 'warning', 'error', 'info', 'primary'] as const;
    const sizes = ['sm', 'md', 'lg'] as const;

    for (const variant of variants) {
      for (const size of sizes) {
        const label = `${variant}-${size}`;
        const { unmount } = render(
          <Badge variant={variant} size={size}>
            {label}
          </Badge>,
        );
        expect(screen.getByText(label)).toBeInTheDocument();
        unmount();
      }
    }
  });
});
