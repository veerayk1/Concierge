import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip, TooltipProvider } from './tooltip';
import { Button } from './button';

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="flex min-h-[200px] items-center justify-center">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
  argTypes: {
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    delayDuration: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    children: <Button variant="secondary">Hover me</Button>,
  },
};

export const Top: Story = {
  args: {
    content: 'Tooltip on top',
    side: 'top',
    children: <Button variant="secondary">Top</Button>,
  },
};

export const Right: Story = {
  args: {
    content: 'Tooltip on right',
    side: 'right',
    children: <Button variant="secondary">Right</Button>,
  },
};

export const Bottom: Story = {
  args: {
    content: 'Tooltip on bottom',
    side: 'bottom',
    children: <Button variant="secondary">Bottom</Button>,
  },
};

export const Left: Story = {
  args: {
    content: 'Tooltip on left',
    side: 'left',
    children: <Button variant="secondary">Left</Button>,
  },
};

export const LongContent: Story = {
  args: {
    content:
      'This tooltip has longer content that provides more detailed information about the element.',
    children: <Button variant="secondary">Long tooltip</Button>,
  },
};
