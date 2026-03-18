import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RadioGroup, RadioGroupItem } from './radio-group';

describe('RadioGroup', () => {
  it('renders radio options with labels', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="a" label="Option A" />
        <RadioGroupItem value="b" label="Option B" />
      </RadioGroup>,
    );
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('calls onValueChange when option is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RadioGroup onValueChange={onChange}>
        <RadioGroupItem value="a" label="Option A" />
        <RadioGroupItem value="b" label="Option B" />
      </RadioGroup>,
    );

    await user.click(screen.getByText('Option A'));
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('renders with a default value selected', () => {
    render(
      <RadioGroup defaultValue="b">
        <RadioGroupItem value="a" label="Option A" />
        <RadioGroupItem value="b" label="Option B" />
      </RadioGroup>,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios[1]).toBeChecked();
  });

  it('renders description text', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="a" label="Fast" description="Arrives in 1-2 days" />
      </RadioGroup>,
    );
    expect(screen.getByText('Arrives in 1-2 days')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(
      <RadioGroup error="Please select an option">
        <RadioGroupItem value="a" label="Option A" />
      </RadioGroup>,
    );
    expect(screen.getByText('Please select an option')).toBeInTheDocument();
  });

  it('renders disabled items', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="a" label="Disabled" disabled />
      </RadioGroup>,
    );
    expect(screen.getByRole('radio')).toBeDisabled();
  });
});
