import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from './form-field';
import { Input } from './input';

const meta: Meta<typeof FormField> = {
  title: 'UI/FormField',
  component: FormField,
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  render: () => (
    <FormField label="Email address">
      <Input type="email" placeholder="you@example.com" />
    </FormField>
  ),
};

export const Required: Story = {
  render: () => (
    <FormField label="Full name" required>
      <Input placeholder="John Doe" />
    </FormField>
  ),
};

export const WithHelpText: Story = {
  render: () => (
    <FormField label="Password" helpText="Must be at least 8 characters with a number and symbol.">
      <Input type="password" placeholder="Enter password" />
    </FormField>
  ),
};

export const WithError: Story = {
  render: () => (
    <FormField label="Email" required error="Please enter a valid email address.">
      <Input type="email" placeholder="you@example.com" />
    </FormField>
  ),
};

export const Disabled: Story = {
  render: () => (
    <FormField label="Read-only field" disabled>
      <Input value="Cannot be changed" disabled />
    </FormField>
  ),
};
