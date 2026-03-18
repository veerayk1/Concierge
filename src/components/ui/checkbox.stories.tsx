import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  argTypes: {
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: { label: 'Accept terms and conditions' },
};

export const Checked: Story = {
  args: { label: 'Email notifications', defaultChecked: true },
};

export const WithDescription: Story = {
  args: {
    label: 'Marketing emails',
    description: 'Receive emails about new products and features.',
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Select all',
    checked: 'indeterminate',
  },
};

export const WithError: Story = {
  args: {
    label: 'I agree to the Terms of Service',
    error: 'You must accept the terms to continue.',
  },
};

export const Disabled: Story = {
  args: { label: 'Disabled checkbox', disabled: true },
};

export const DisabledChecked: Story = {
  args: { label: 'Disabled checked', disabled: true, defaultChecked: true },
};
