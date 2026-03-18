import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './status-badge';

const meta: Meta<typeof StatusBadge> = {
  title: 'UI/StatusBadge',
  component: StatusBadge,
  argTypes: {
    status: {
      control: 'select',
      options: ['success', 'warning', 'error', 'info', 'neutral'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    dot: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Success: Story = {
  args: { status: 'success', children: 'Active' },
};

export const Warning: Story = {
  args: { status: 'warning', children: 'Pending Review' },
};

export const Error: Story = {
  args: { status: 'error', children: 'Failed' },
};

export const Info: Story = {
  args: { status: 'info', children: 'In Progress' },
};

export const Neutral: Story = {
  args: { status: 'neutral', children: 'Draft' },
};

export const WithoutDot: Story = {
  args: { status: 'success', children: 'Completed', dot: false },
};

export const Small: Story = {
  args: { status: 'info', children: 'New', size: 'sm' },
};

export const Large: Story = {
  args: { status: 'warning', children: 'Expiring Soon', size: 'lg' },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="success">Active</StatusBadge>
      <StatusBadge status="warning">Pending</StatusBadge>
      <StatusBadge status="error">Expired</StatusBadge>
      <StatusBadge status="info">In Progress</StatusBadge>
      <StatusBadge status="neutral">Draft</StatusBadge>
    </div>
  ),
};
