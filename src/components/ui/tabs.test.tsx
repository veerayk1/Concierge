import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

function renderTabs({ variant = 'underline' }: { variant?: 'underline' | 'pill' } = {}) {
  return render(
    <Tabs defaultValue="tab1">
      <TabsList variant={variant}>
        <TabsTrigger value="tab1" variant={variant}>
          Tab 1
        </TabsTrigger>
        <TabsTrigger value="tab2" variant={variant}>
          Tab 2
        </TabsTrigger>
        <TabsTrigger value="tab3" variant={variant} disabled>
          Tab 3
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
      <TabsContent value="tab3">Content 3</TabsContent>
    </Tabs>,
  );
}

describe('Tabs', () => {
  it('renders all tab triggers', () => {
    renderTabs();
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('shows the first tab content by default', () => {
    renderTabs();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('switches content when a tab is clicked', async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByText('Tab 2'));
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('marks the active tab with aria-selected', () => {
    renderTabs();
    const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
    expect(tab1).toHaveAttribute('aria-selected', 'true');

    const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
    expect(tab2).toHaveAttribute('aria-selected', 'false');
  });

  it('renders disabled tab correctly', () => {
    renderTabs();
    const tab3 = screen.getByRole('tab', { name: 'Tab 3' });
    expect(tab3).toBeDisabled();
  });

  it('renders underline variant with border-b', () => {
    renderTabs({ variant: 'underline' });
    const list = screen.getByRole('tablist');
    expect(list.className).toContain('border-b');
  });

  it('renders pill variant with rounded-lg background', () => {
    renderTabs({ variant: 'pill' });
    const list = screen.getByRole('tablist');
    expect(list.className).toContain('rounded-lg');
    expect(list.className).toContain('bg-neutral-100');
  });

  it('stores variant as data attribute', () => {
    renderTabs({ variant: 'pill' });
    const list = screen.getByRole('tablist');
    expect(list).toHaveAttribute('data-variant', 'pill');
  });

  it('navigates tabs with keyboard', async () => {
    const user = userEvent.setup();
    renderTabs();

    // Focus first tab
    await user.tab();
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveFocus();

    // Arrow right to second tab
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();
  });
});
