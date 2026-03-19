import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  it('renders with text content', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge.className).toContain('bg-neutral-100');
    expect(badge.className).toContain('text-neutral-600');
  });

  it('applies success variant styles', () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText('Success');
    expect(badge.className).toContain('bg-success-50');
    expect(badge.className).toContain('text-success-700');
  });

  it('applies warning variant styles', () => {
    render(<Badge variant="warning">Warning</Badge>);
    const badge = screen.getByText('Warning');
    expect(badge.className).toContain('bg-warning-50');
    expect(badge.className).toContain('text-warning-700');
  });

  it('applies error variant styles', () => {
    render(<Badge variant="error">Error</Badge>);
    const badge = screen.getByText('Error');
    expect(badge.className).toContain('bg-error-50');
    expect(badge.className).toContain('text-error-700');
  });

  it('applies info variant styles', () => {
    render(<Badge variant="info">Info</Badge>);
    const badge = screen.getByText('Info');
    expect(badge.className).toContain('bg-info-50');
    expect(badge.className).toContain('text-info-700');
  });

  it('applies primary variant styles', () => {
    render(<Badge variant="primary">Primary</Badge>);
    const badge = screen.getByText('Primary');
    expect(badge.className).toContain('bg-primary-50');
    expect(badge.className).toContain('text-primary-700');
  });

  it('shows dot indicator when dot prop is true', () => {
    const { container } = render(<Badge dot>With Dot</Badge>);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
    expect(dot?.className).toContain('rounded-full');
    expect(dot?.className).toContain('bg-current');
  });

  it('does not show dot indicator by default', () => {
    const { container } = render(<Badge>No Dot</Badge>);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).not.toBeInTheDocument();
  });

  it('uses custom dotColor when provided', () => {
    const { container } = render(
      <Badge dot dotColor="bg-red-500">
        Custom Dot
      </Badge>,
    );
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot?.className).toContain('bg-red-500');
    expect(dot?.className).not.toContain('bg-current');
  });

  it('applies sm size styles', () => {
    render(<Badge size="sm">Small</Badge>);
    const badge = screen.getByText('Small');
    expect(badge.className).toContain('text-[10px]');
  });

  it('applies md size styles by default', () => {
    render(<Badge>Medium</Badge>);
    const badge = screen.getByText('Medium');
    expect(badge.className).toContain('text-[11px]');
  });

  it('applies lg size styles', () => {
    render(<Badge size="lg">Large</Badge>);
    const badge = screen.getByText('Large');
    expect(badge.className).toContain('text-[12px]');
  });

  it('merges custom className', () => {
    render(<Badge className="extra-class">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge.className).toContain('extra-class');
  });
});
