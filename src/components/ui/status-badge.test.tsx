import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('renders children text', () => {
    render(<StatusBadge>Active</StatusBadge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with a dot indicator by default', () => {
    const { container } = render(<StatusBadge status="success">Active</StatusBadge>);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
    expect(dot?.className).toContain('rounded-full');
  });

  it('hides the dot when dot={false}', () => {
    const { container } = render(
      <StatusBadge status="success" dot={false}>
        Active
      </StatusBadge>,
    );
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).not.toBeInTheDocument();
  });

  it('applies success variant styles', () => {
    const { container } = render(<StatusBadge status="success">Active</StatusBadge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-success-50');
    expect(badge.className).toContain('text-success-700');
  });

  it('applies warning variant styles', () => {
    const { container } = render(<StatusBadge status="warning">Pending</StatusBadge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-warning-50');
  });

  it('applies error variant styles', () => {
    const { container } = render(<StatusBadge status="error">Failed</StatusBadge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-error-50');
  });

  it('applies info variant styles', () => {
    const { container } = render(<StatusBadge status="info">In Progress</StatusBadge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-info-50');
  });

  it('applies neutral variant styles by default', () => {
    const { container } = render(<StatusBadge>Draft</StatusBadge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-neutral-100');
  });

  it('renders sm size variant', () => {
    const { container } = render(<StatusBadge size="sm">Small</StatusBadge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('text-[11px]');
  });

  it('renders lg size variant', () => {
    const { container } = render(<StatusBadge size="lg">Large</StatusBadge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('text-[13px]');
  });

  it('applies custom className', () => {
    const { container } = render(<StatusBadge className="my-custom">Custom</StatusBadge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('my-custom');
  });

  it('renders all status variants without errors', () => {
    const statuses = ['success', 'warning', 'error', 'info', 'neutral'] as const;
    for (const status of statuses) {
      const { unmount } = render(<StatusBadge status={status}>{status}</StatusBadge>);
      expect(screen.getByText(status)).toBeInTheDocument();
      unmount();
    }
  });
});
