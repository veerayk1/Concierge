import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageShell } from '../page-shell';

describe('PageShell', () => {
  it('renders title as h1', () => {
    render(<PageShell title="Dashboard">Content</PageShell>);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Dashboard');
  });

  it('renders description when provided', () => {
    render(
      <PageShell title="Users" description="Manage all users in the system">
        Content
      </PageShell>,
    );
    expect(screen.getByText('Manage all users in the system')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<PageShell title="Users">Content</PageShell>);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(0);
  });

  it('renders action buttons when provided', () => {
    render(
      <PageShell title="Packages" actions={<button>Add Package</button>}>
        Content
      </PageShell>,
    );
    expect(screen.getByRole('button', { name: 'Add Package' })).toBeInTheDocument();
  });

  it('does not render actions container when actions are not provided', () => {
    const { container } = render(<PageShell title="Test">Content</PageShell>);
    // The header div should only contain the title column, no actions wrapper
    const headerDiv = container.querySelector('h1')?.parentElement?.parentElement;
    // No actions div — only the title column exists
    const actionsDivs = headerDiv?.querySelectorAll('[class*="shrink-0"]');
    expect(actionsDivs?.length ?? 0).toBe(0);
  });

  it('renders children content', () => {
    render(
      <PageShell title="Events">
        <div data-testid="child-content">Event list here</div>
      </PageShell>,
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Event list here')).toBeInTheDocument();
  });

  it('renders multiple action buttons', () => {
    render(
      <PageShell
        title="Units"
        actions={
          <>
            <button>Export</button>
            <button>Add Unit</button>
          </>
        }
      >
        Content
      </PageShell>,
    );
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Unit' })).toBeInTheDocument();
  });

  it('renders all props together', () => {
    render(
      <PageShell
        title="Maintenance"
        description="Track and manage maintenance requests"
        actions={<button>New Request</button>}
      >
        <p>Request list</p>
      </PageShell>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Maintenance');
    expect(screen.getByText('Track and manage maintenance requests')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Request' })).toBeInTheDocument();
    expect(screen.getByText('Request list')).toBeInTheDocument();
  });
});
