import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../empty-state';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders title as h3 element', () => {
    render(<EmptyState title="No items" />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('No items');
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="Try adding some items" />);
    expect(screen.getByText('Try adding some items')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(0);
  });

  it('renders icon when provided', () => {
    render(<EmptyState title="Empty" icon={<span data-testid="test-icon">icon</span>} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('does not render icon container when icon is not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const iconContainer = container.querySelector('.mb-4');
    expect(iconContainer).not.toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    render(<EmptyState title="No items" action={<button>Add Item</button>} />);
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
  });

  it('does not render action container when action is not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const actionContainer = container.querySelector('.mt-6');
    expect(actionContainer).not.toBeInTheDocument();
  });

  it('merges custom className', () => {
    const { container } = render(<EmptyState title="Empty" className="custom-empty" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('custom-empty');
  });

  it('renders all props together', () => {
    render(
      <EmptyState
        title="No results"
        description="Your search did not match any items"
        icon={<span data-testid="search-icon">search</span>}
        action={<button>Clear filters</button>}
      />,
    );
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Your search did not match any items')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });
});
