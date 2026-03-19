import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('applies error styling when error prop is set', () => {
    render(<Input error="Required field" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-error-300');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders error message text', () => {
    render(<Input error="Required field" label="Email" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required field');
  });

  it('handles disabled state', () => {
    render(<Input disabled placeholder="Disabled" />);
    const input = screen.getByPlaceholderText('Disabled');
    expect(input).toBeDisabled();
  });

  it('shows value when controlled', () => {
    render(<Input value="hello@test.com" onChange={() => {}} />);
    expect(screen.getByDisplayValue('hello@test.com')).toBeInTheDocument();
  });

  it('fires onChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    await user.type(screen.getByRole('textbox'), 'a');
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders password type that hides text', () => {
    render(<Input type="password" />);
    const input = document.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="ref test" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.placeholder).toBe('ref test');
  });

  it('renders label when provided', () => {
    render(<Input label="Email Address" />);
    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('renders helper text when provided and no error', () => {
    render(<Input label="Name" helperText="Enter your full name" />);
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  it('shows required asterisk when required', () => {
    render(<Input label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Input className="my-custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('my-custom-class');
  });
});
