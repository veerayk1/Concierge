import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CommandPalette } from './command-palette';

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderPalette(props?: Partial<React.ComponentProps<typeof CommandPalette>>) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    ...props,
  };
  return {
    ...render(<CommandPalette {...defaultProps} />),
    onOpenChange: defaultProps.onOpenChange,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CommandPalette', () => {
  beforeEach(() => {
    mockPush.mockClear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when open=false', () => {
    renderPalette({ open: false });
    expect(
      screen.queryByPlaceholderText('Search anything or type a command...'),
    ).not.toBeInTheDocument();
  });

  it('shows search input when open=true', () => {
    renderPalette({ open: true });
    expect(screen.getByPlaceholderText('Search anything or type a command...')).toBeInTheDocument();
  });

  it('shows quick actions when query is empty', () => {
    renderPalette();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Log Package')).toBeInTheDocument();
    expect(screen.getByText('Log Event')).toBeInTheDocument();
    expect(screen.getByText('New Request')).toBeInTheDocument();
    expect(screen.getByText('New Announcement')).toBeInTheDocument();
    expect(screen.getByText('Book Amenity')).toBeInTheDocument();
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderPalette();
    const input = screen.getByPlaceholderText('Search anything or type a command...');
    await user.type(input, '{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes when clicking backdrop', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = render(<CommandPalette open onOpenChange={onOpenChange} />);
    // The backdrop is the first child div with bg-black/40
    const backdrop = container.querySelector('.bg-black\\/40');
    expect(backdrop).toBeInTheDocument();
    await user.click(backdrop!);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows loading state during search', async () => {
    const user = userEvent.setup();
    // Create a fetch that never resolves to keep loading state visible
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    renderPalette();
    const input = screen.getByPlaceholderText('Search anything or type a command...');
    await user.type(input, 'test query');
    await waitFor(
      () => {
        expect(screen.getByText('Searching...')).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('displays search results from API', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              users: [{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' }],
              units: [],
              packages: [],
              events: [],
              announcements: [],
            },
          }),
      }),
    );

    renderPalette();
    const input = screen.getByPlaceholderText('Search anything or type a command...');
    await user.type(input, 'John');
    await waitFor(
      () => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('navigates with Enter on quick action', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderPalette();
    const input = screen.getByPlaceholderText('Search anything or type a command...');
    // First quick action is "Log Package" at index 0
    await user.type(input, '{Enter}');
    expect(mockPush).toHaveBeenCalledWith('/packages');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keyboard navigation moves selected index', async () => {
    const user = userEvent.setup();
    renderPalette();
    const input = screen.getByPlaceholderText('Search anything or type a command...');

    // Initially first item is highlighted (Log Package)
    const items = screen.getAllByText(
      /Log Package|Log Event|New Request|New Announcement|Book Amenity/,
    );
    const firstButton = items[0]!.closest('button');
    expect(firstButton?.className).toContain('bg-primary-50');

    // Press ArrowDown to move to next item
    await user.type(input, '{ArrowDown}');
    const secondButton = items[1]!.closest('button');
    expect(secondButton?.className).toContain('bg-primary-50');
  });

  it('navigates and closes on clicking a quick action', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderPalette();
    await user.click(screen.getByText('Log Package'));
    expect(mockPush).toHaveBeenCalledWith('/packages');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
