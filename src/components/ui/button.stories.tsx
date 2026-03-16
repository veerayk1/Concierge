import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: 'Primary Button', variant: 'primary' },
};

export const Secondary: Story = {
  args: { children: 'Secondary Button', variant: 'secondary' },
};

export const Ghost: Story = {
  args: { children: 'Ghost Button', variant: 'ghost' },
};

export const Danger: Story = {
  args: { children: 'Delete', variant: 'danger' },
};

export const Loading: Story = {
  args: { children: 'Saving...', variant: 'primary', loading: true },
};

export const Small: Story = {
  args: { children: 'Small', variant: 'primary', size: 'sm' },
};

export const Large: Story = {
  args: { children: 'Large', variant: 'primary', size: 'lg' },
};

export const Disabled: Story = {
  args: { children: 'Disabled', variant: 'primary', disabled: true },
};
