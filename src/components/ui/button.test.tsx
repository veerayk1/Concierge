import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  // --- Variant classes ---

  it('applies primary variant styles by default', () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-primary-500');
    expect(button.className).toContain('text-white');
  });

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-white');
    expect(button.className).toContain('text-neutral-700');
    expect(button.className).toContain('border-neutral-200');
  });

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('text-neutral-600');
  });

  it('applies danger variant styles', () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-error-600');
    expect(button.className).toContain('text-white');
  });

  it('applies link variant styles', () => {
    render(<Button variant="link">Link</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('text-primary-500');
    expect(button.className).toContain('underline-offset-4');
  });

  // --- Size classes ---

  it('applies sm size classes', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('h-8');
    expect(button.className).toContain('text-[13px]');
  });

  it('applies md size classes by default', () => {
    render(<Button>Medium</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('h-10');
    expect(button.className).toContain('text-[14px]');
  });

  it('applies lg size classes', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('h-[44px]');
    expect(button.className).toContain('text-[15px]');
  });

  it('applies xl size classes', () => {
    render(<Button size="xl">Extra Large</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('h-12');
    expect(button.className).toContain('text-[16px]');
  });

  // --- Loading state ---

  it('shows loading spinner when loading is true', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-spin');
  });

  it('does not show spinner when loading is false', () => {
    render(<Button>Not Loading</Button>);
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('disables button when loading is true', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  // --- Disabled state ---

  it('disables button when disabled is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('has disabled opacity class', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('disabled:opacity-40');
  });

  // --- fullWidth ---

  it('applies fullWidth class when fullWidth is true', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('w-full');
  });

  it('does not apply w-full by default', () => {
    render(<Button>Normal Width</Button>);
    const button = screen.getByRole('button');
    expect(button.className).not.toContain('w-full');
  });

  // --- Click handler ---

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does NOT call onClick when loading', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} loading>
        Click
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  // --- Focus ring styles ---

  it('has correct focus ring styles', () => {
    render(<Button>Focus</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('focus-visible:ring-primary-100');
    expect(button.className).toContain('focus-visible:ring-4');
    expect(button.className).toContain('focus-visible:outline-none');
  });

  // --- Active scale on primary ---

  it('has active:scale-[0.98] on primary variant', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('active:scale-[0.98]');
  });

  // --- Custom className ---

  it('applies custom className', () => {
    render(<Button className="my-custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('my-custom-class');
  });
});
