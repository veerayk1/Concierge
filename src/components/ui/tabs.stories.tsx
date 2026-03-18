import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Underline: Story = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList variant="underline">
        <TabsTrigger value="overview" variant="underline">
          Overview
        </TabsTrigger>
        <TabsTrigger value="activity" variant="underline">
          Activity
        </TabsTrigger>
        <TabsTrigger value="settings" variant="underline">
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview content goes here.</TabsContent>
      <TabsContent value="activity">Activity feed content goes here.</TabsContent>
      <TabsContent value="settings">Settings panel goes here.</TabsContent>
    </Tabs>
  ),
};

export const Pill: Story = {
  render: () => (
    <Tabs defaultValue="all">
      <TabsList variant="pill">
        <TabsTrigger value="all" variant="pill">
          All
        </TabsTrigger>
        <TabsTrigger value="active" variant="pill">
          Active
        </TabsTrigger>
        <TabsTrigger value="closed" variant="pill">
          Closed
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all">Showing all items.</TabsContent>
      <TabsContent value="active">Showing active items only.</TabsContent>
      <TabsContent value="closed">Showing closed items only.</TabsContent>
    </Tabs>
  ),
};

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="general">
      <TabsList variant="underline">
        <TabsTrigger value="general" variant="underline">
          General
        </TabsTrigger>
        <TabsTrigger value="advanced" variant="underline">
          Advanced
        </TabsTrigger>
        <TabsTrigger value="billing" variant="underline" disabled>
          Billing (Coming Soon)
        </TabsTrigger>
      </TabsList>
      <TabsContent value="general">General settings.</TabsContent>
      <TabsContent value="advanced">Advanced configuration.</TabsContent>
      <TabsContent value="billing">Billing information.</TabsContent>
    </Tabs>
  ),
};
