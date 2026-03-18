import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './switch';

describe('Switch', () => {
  it('renders unchecked by default', () => {
    render(<Switch label="Dark mode" />);
    const sw = screen.getByRole('switch', { name: 'Dark mode' });
    expect(sw).not.toBeChecked();
  });

  it('renders checked when defaultChecked is true', () => {
    render(<Switch label="Notifications" defaultChecked />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('toggles on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Feature" onCheckedChange={onChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders description text', () => {
    render(<Switch label="Emails" description="Receive email notifications" />);
    expect(screen.getByText('Receive email notifications')).toBeInTheDocument();
  });

  it('renders in disabled state', () => {
    render(<Switch label="Disabled" disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('renders without a label', () => {
    render(<Switch aria-label="Toggle feature" />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders sm size variant', () => {
    render(<Switch label="Small" size="sm" />);
    const sw = screen.getByRole('switch');
    expect(sw.className).toContain('h-5');
  });
});
