import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    status: { control: 'select', options: [undefined, 'online', 'offline', 'away', 'busy'] },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?u=1',
    name: 'Jane Smith',
    size: 'lg',
  },
};

export const WithInitials: Story = {
  args: { name: 'John Doe', size: 'lg' },
};

export const SingleName: Story = {
  args: { name: 'Admin', size: 'md' },
};

export const WithStatus: Story = {
  args: { name: 'Jane Smith', size: 'lg', status: 'online' },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="John Doe" size="xs" />
      <Avatar name="John Doe" size="sm" />
      <Avatar name="John Doe" size="md" />
      <Avatar name="John Doe" size="lg" />
      <Avatar name="John Doe" size="xl" />
    </div>
  ),
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="Online" size="lg" status="online" />
      <Avatar name="Away" size="lg" status="away" />
      <Avatar name="Busy" size="lg" status="busy" />
      <Avatar name="Offline" size="lg" status="offline" />
    </div>
  ),
};
