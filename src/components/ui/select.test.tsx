import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

function renderSelect({
  placeholder = 'Pick one',
  onValueChange,
  defaultValue,
  error,
  disabled,
  size,
}: {
  placeholder?: string;
  onValueChange?: (v: string) => void;
  defaultValue?: string;
  error?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
} = {}) {
  return render(
    <Select onValueChange={onValueChange} defaultValue={defaultValue}>
      <SelectTrigger error={error} disabled={disabled} size={size}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry" disabled>
          Cherry
        </SelectItem>
      </SelectContent>
    </Select>,
  );
}

describe('Select', () => {
  it('renders with placeholder text', () => {
    renderSelect();
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('opens dropdown and selects an item', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSelect({ onValueChange: onChange });

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Apple'));
    expect(onChange).toHaveBeenCalledWith('apple');
  });

  it('renders with a default value', () => {
    renderSelect({ defaultValue: 'banana' });
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('renders in disabled state', () => {
    renderSelect({ disabled: true });
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('applies error styling', () => {
    renderSelect({ error: true });
    const trigger = screen.getByRole('combobox');
    expect(trigger.className).toContain('border-error');
  });

  it('applies size variant classes', () => {
    renderSelect({ size: 'sm' });
    const trigger = screen.getByRole('combobox');
    expect(trigger.className).toContain('h-8');
  });

  it('applies lg size variant', () => {
    renderSelect({ size: 'lg' });
    const trigger = screen.getByRole('combobox');
    expect(trigger.className).toContain('h-12');
  });
});
