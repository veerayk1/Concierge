import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: { label: 'Airplane mode' },
};

export const Checked: Story = {
  args: { label: 'Email notifications', defaultChecked: true },
};

export const WithDescription: Story = {
  args: {
    label: 'Two-factor authentication',
    description: 'Add an extra layer of security to your account.',
  },
};

export const Small: Story = {
  args: { label: 'Compact toggle', size: 'sm' },
};

export const Disabled: Story = {
  args: { label: 'Disabled', disabled: true },
};

export const DisabledChecked: Story = {
  args: { label: 'Disabled checked', disabled: true, defaultChecked: true },
};
