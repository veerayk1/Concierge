import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('renders unchecked by default', () => {
    render(<Checkbox label="Accept terms" />);
    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });
    expect(checkbox).not.toBeChecked();
  });

  it('renders checked when defaultChecked is true', () => {
    render(<Checkbox label="Accept terms" defaultChecked />);
    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });
    expect(checkbox).toBeChecked();
  });

  it('calls onCheckedChange when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Accept" onCheckedChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders with description text', () => {
    render(<Checkbox label="Newsletter" description="Get weekly updates" />);
    expect(screen.getByText('Get weekly updates')).toBeInTheDocument();
  });

  it('renders error message and sets aria-invalid', () => {
    render(<Checkbox label="Terms" error="You must accept" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('You must accept')).toBeInTheDocument();
  });

  it('renders in disabled state', () => {
    render(<Checkbox label="Disabled" disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('renders without a label', () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});
