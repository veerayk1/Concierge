import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup, RadioGroupItem } from './radio-group';

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable">
      <RadioGroupItem value="default" label="Default" />
      <RadioGroupItem value="comfortable" label="Comfortable" />
      <RadioGroupItem value="compact" label="Compact" />
    </RadioGroup>
  ),
};

export const WithDescriptions: Story = {
  render: () => (
    <RadioGroup defaultValue="standard">
      <RadioGroupItem
        value="express"
        label="Express"
        description="Delivered in 1-2 business days"
      />
      <RadioGroupItem
        value="standard"
        label="Standard"
        description="Delivered in 5-7 business days"
      />
      <RadioGroupItem
        value="economy"
        label="Economy"
        description="Delivered in 10-14 business days"
      />
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="low" orientation="horizontal" className="flex flex-row gap-6">
      <RadioGroupItem value="low" label="Low" />
      <RadioGroupItem value="medium" label="Medium" />
      <RadioGroupItem value="high" label="High" />
    </RadioGroup>
  ),
};

export const WithError: Story = {
  render: () => (
    <RadioGroup error="Please select a priority level">
      <RadioGroupItem value="low" label="Low" />
      <RadioGroupItem value="medium" label="Medium" />
      <RadioGroupItem value="high" label="High" />
    </RadioGroup>
  ),
};

export const WithDisabledItem: Story = {
  render: () => (
    <RadioGroup defaultValue="low">
      <RadioGroupItem value="low" label="Low" />
      <RadioGroupItem value="medium" label="Medium" />
      <RadioGroupItem value="high" label="High" disabled />
    </RadioGroup>
  ),
};
