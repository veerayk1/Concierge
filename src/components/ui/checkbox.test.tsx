import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import { Checkbox } from './checkbox';

// Radix Checkbox uses pointer capture APIs that jsdom doesn't support
beforeAll(() => {
  HTMLElement.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
});

describe('Checkbox', () => {
  it('renders unchecked by default', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('toggles on click', async () => {
    const user = userEvent.setup();
    render(<Checkbox defaultChecked={false} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('shows checked state when defaultChecked is true', () => {
    render(<Checkbox defaultChecked />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('disabled prevents toggle', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox disabled onCheckedChange={onChange} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    await user.click(checkbox);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('fires onCheckedChange callback', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox onCheckedChange={handleChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('supports label text', () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<Checkbox label="Newsletter" description="Receive weekly updates" />);
    expect(screen.getByText('Receive weekly updates')).toBeInTheDocument();
  });

  it('renders error message with alert role', () => {
    render(<Checkbox label="Agree" error="You must agree" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('You must agree');
  });

  it('applies error border styling', () => {
    render(<Checkbox error="Required" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toContain('border-error-400');
  });
});
