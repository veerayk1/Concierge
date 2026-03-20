/**
 * Design System Showcase Tests
 *
 * Comprehensive rendering tests for all core UI component variants.
 * Serves as a visual regression safety net — every variant, size,
 * and state combination is rendered and verified.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AlertCircle, Package, Plus, Search, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable, type Column } from '@/components/ui/data-table';

// ===========================================================================
// BUTTON
// ===========================================================================

describe('Button — Design System Showcase', () => {
  // --- Variants ---

  describe('variants', () => {
    it('renders primary variant (default)', () => {
      render(<Button>Primary</Button>);
      const btn = screen.getByRole('button', { name: 'Primary' });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toContain('bg-primary-500');
      expect(btn.className).toContain('text-white');
    });

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const btn = screen.getByRole('button', { name: 'Secondary' });
      expect(btn.className).toContain('bg-white');
      expect(btn.className).toContain('text-neutral-700');
      expect(btn.className).toContain('border');
    });

    it('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const btn = screen.getByRole('button', { name: 'Ghost' });
      expect(btn.className).toContain('text-neutral-600');
    });

    it('renders danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      const btn = screen.getByRole('button', { name: 'Danger' });
      expect(btn.className).toContain('bg-error-600');
      expect(btn.className).toContain('text-white');
    });

    it('renders link variant', () => {
      render(<Button variant="link">Link</Button>);
      const btn = screen.getByRole('button', { name: 'Link' });
      expect(btn.className).toContain('text-primary-500');
      expect(btn.className).toContain('underline-offset-4');
    });
  });

  // --- Sizes ---

  describe('sizes', () => {
    it('renders sm size', () => {
      render(<Button size="sm">Small</Button>);
      const btn = screen.getByRole('button', { name: 'Small' });
      expect(btn.className).toContain('h-8');
      expect(btn.className).toContain('px-3');
    });

    it('renders md size (default)', () => {
      render(<Button size="md">Medium</Button>);
      const btn = screen.getByRole('button', { name: 'Medium' });
      expect(btn.className).toContain('h-10');
      expect(btn.className).toContain('px-4');
    });

    it('renders lg size', () => {
      render(<Button size="lg">Large</Button>);
      const btn = screen.getByRole('button', { name: 'Large' });
      expect(btn.className).toContain('h-[44px]');
      expect(btn.className).toContain('px-5');
    });

    it('renders xl size', () => {
      render(<Button size="xl">Extra Large</Button>);
      const btn = screen.getByRole('button', { name: 'Extra Large' });
      expect(btn.className).toContain('h-12');
      expect(btn.className).toContain('px-6');
    });
  });

  // --- States ---

  describe('states', () => {
    it('renders loading state with spinner and disables the button', () => {
      render(<Button loading>Saving</Button>);
      const btn = screen.getByRole('button', { name: 'Saving' });
      expect(btn).toBeDisabled();
      // Spinner SVG should be present
      const svg = btn.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.classList.contains('animate-spin')).toBe(true);
    });

    it('renders disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const btn = screen.getByRole('button', { name: 'Disabled' });
      expect(btn).toBeDisabled();
      expect(btn.className).toContain('disabled:opacity-40');
    });

    it('does not fire onClick when disabled', async () => {
      const handler = vi.fn();
      render(
        <Button disabled onClick={handler}>
          No click
        </Button>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'No click' }));
      expect(handler).not.toHaveBeenCalled();
    });

    it('does not fire onClick when loading', async () => {
      const handler = vi.fn();
      render(
        <Button loading onClick={handler}>
          Loading
        </Button>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Loading' }));
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // --- With icon ---

  describe('with icon', () => {
    it('renders button with a leading icon', () => {
      render(
        <Button>
          <Plus data-testid="icon-plus" className="h-4 w-4" />
          Add Item
        </Button>,
      );
      expect(screen.getByTestId('icon-plus')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Item/i })).toBeInTheDocument();
    });

    it('renders button with a trailing icon', () => {
      render(
        <Button>
          Delete
          <Trash2 data-testid="icon-trash" className="h-4 w-4" />
        </Button>,
      );
      expect(screen.getByTestId('icon-trash')).toBeInTheDocument();
    });
  });

  // --- Full width ---

  describe('full width', () => {
    it('applies w-full class when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button', { name: 'Full Width' }).className).toContain('w-full');
    });
  });

  // --- Variant + size matrix ---

  describe('variant x size matrix', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger', 'link'] as const;
    const sizes = ['sm', 'md', 'lg', 'xl'] as const;

    variants.forEach((variant) => {
      sizes.forEach((size) => {
        it(`renders ${variant} / ${size} without crashing`, () => {
          const { container } = render(
            <Button variant={variant} size={size}>
              {variant}-{size}
            </Button>,
          );
          expect(container.querySelector('button')).toBeInTheDocument();
        });
      });
    });
  });
});

// ===========================================================================
// BADGE
// ===========================================================================

describe('Badge — Design System Showcase', () => {
  // --- Variants ---

  describe('variants', () => {
    it('renders default variant', () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge.className).toContain('bg-neutral-100');
      expect(badge.className).toContain('text-neutral-600');
    });

    it('renders primary variant', () => {
      render(<Badge variant="primary">Primary</Badge>);
      const badge = screen.getByText('Primary');
      expect(badge.className).toContain('bg-primary-50');
      expect(badge.className).toContain('text-primary-700');
    });

    it('renders success variant', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge.className).toContain('bg-success-50');
      expect(badge.className).toContain('text-success-700');
    });

    it('renders warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge.className).toContain('bg-warning-50');
      expect(badge.className).toContain('text-warning-700');
    });

    it('renders error variant', () => {
      render(<Badge variant="error">Error</Badge>);
      const badge = screen.getByText('Error');
      expect(badge.className).toContain('bg-error-50');
      expect(badge.className).toContain('text-error-700');
    });

    it('renders info variant', () => {
      render(<Badge variant="info">Info</Badge>);
      const badge = screen.getByText('Info');
      expect(badge.className).toContain('bg-info-50');
      expect(badge.className).toContain('text-info-700');
    });
  });

  // --- Sizes ---

  describe('sizes', () => {
    it('renders sm size', () => {
      render(<Badge size="sm">Tiny</Badge>);
      const badge = screen.getByText('Tiny');
      expect(badge.className).toContain('text-[10px]');
      expect(badge.className).toContain('px-1.5');
    });

    it('renders md size (default)', () => {
      render(<Badge size="md">Medium</Badge>);
      const badge = screen.getByText('Medium');
      expect(badge.className).toContain('text-[11px]');
      expect(badge.className).toContain('px-2');
    });

    it('renders lg size', () => {
      render(<Badge size="lg">Large</Badge>);
      const badge = screen.getByText('Large');
      expect(badge.className).toContain('text-[12px]');
      expect(badge.className).toContain('px-2.5');
    });
  });

  // --- Dot indicator ---

  describe('dot indicator', () => {
    it('renders dot when dot prop is true', () => {
      const { container } = render(<Badge dot>With Dot</Badge>);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
      expect(dot?.className).toContain('rounded-full');
    });

    it('does not render dot by default', () => {
      const { container } = render(<Badge>No Dot</Badge>);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toBeNull();
    });

    it('applies custom dot color', () => {
      const { container } = render(
        <Badge dot dotColor="bg-purple-500">
          Custom Dot
        </Badge>,
      );
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot?.className).toContain('bg-purple-500');
    });
  });
});

// ===========================================================================
// CARD
// ===========================================================================

describe('Card — Design System Showcase', () => {
  // --- Padding variants ---

  describe('padding variants', () => {
    it('renders with default (md) padding', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstElementChild!;
      expect(card.className).toContain('p-6');
    });

    it('renders with no padding', () => {
      const { container } = render(<Card padding="none">No Pad</Card>);
      const card = container.firstElementChild!;
      expect(card.className).not.toContain('p-4');
      expect(card.className).not.toContain('p-6');
      expect(card.className).not.toContain('p-8');
    });

    it('renders with sm padding', () => {
      const { container } = render(<Card padding="sm">Small Pad</Card>);
      const card = container.firstElementChild!;
      expect(card.className).toContain('p-4');
    });

    it('renders with lg padding', () => {
      const { container } = render(<Card padding="lg">Large Pad</Card>);
      const card = container.firstElementChild!;
      expect(card.className).toContain('p-8');
    });
  });

  // --- Hoverable ---

  describe('hoverable', () => {
    it('adds hover styles when hoverable is true', () => {
      const { container } = render(<Card hoverable>Hoverable</Card>);
      const card = container.firstElementChild!;
      expect(card.className).toContain('hover:shadow-md');
      expect(card.className).toContain('transition-all');
    });

    it('does not add hover styles by default', () => {
      const { container } = render(<Card>Static</Card>);
      const card = container.firstElementChild!;
      expect(card.className).not.toContain('hover:shadow-md');
    });
  });

  // --- Composition: header, content, footer ---

  describe('composition', () => {
    it('renders a full card with header, title, description, and content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardDescription>A brief description of the card.</CardDescription>
          <CardContent>
            <p>Main content goes here.</p>
          </CardContent>
        </Card>,
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('A brief description of the card.')).toBeInTheDocument();
      expect(screen.getByText('Main content goes here.')).toBeInTheDocument();
    });

    it('renders CardHeader with flex layout', () => {
      const { container } = render(
        <Card>
          <CardHeader data-testid="header">
            <CardTitle>Title</CardTitle>
            <Button size="sm">Action</Button>
          </CardHeader>
        </Card>,
      );
      const header = screen.getByTestId('header');
      expect(header.className).toContain('flex');
      expect(header.className).toContain('items-center');
      expect(header.className).toContain('justify-between');
    });

    it('renders CardTitle as an h3 element', () => {
      render(
        <Card>
          <CardTitle>My Title</CardTitle>
        </Card>,
      );
      const title = screen.getByText('My Title');
      expect(title.tagName).toBe('H3');
      expect(title.className).toContain('font-semibold');
    });

    it('renders CardDescription as a p element', () => {
      render(
        <Card>
          <CardDescription>Subtitle text</CardDescription>
        </Card>,
      );
      const desc = screen.getByText('Subtitle text');
      expect(desc.tagName).toBe('P');
      expect(desc.className).toContain('text-neutral-500');
    });

    it('renders CardContent with neutral text color', () => {
      render(
        <Card>
          <CardContent data-testid="content">Body text</CardContent>
        </Card>,
      );
      const content = screen.getByTestId('content');
      expect(content.className).toContain('text-neutral-600');
    });
  });

  // --- Base styles ---

  describe('base styles', () => {
    it('always has rounded border and white background', () => {
      const { container } = render(<Card>Check</Card>);
      const card = container.firstElementChild!;
      expect(card.className).toContain('rounded-2xl');
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('border');
    });
  });
});

// ===========================================================================
// INPUT
// ===========================================================================

describe('Input — Design System Showcase', () => {
  // --- Default ---

  describe('default rendering', () => {
    it('renders a basic input', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('applies correct base styles', () => {
      render(<Input placeholder="styled" />);
      const input = screen.getByPlaceholderText('styled');
      expect(input.className).toContain('rounded-xl');
      expect(input.className).toContain('border');
      expect(input.className).toContain('h-[44px]');
    });
  });

  // --- With label ---

  describe('with label', () => {
    it('renders a label associated with the input', () => {
      render(<Input label="Email" />);
      const input = screen.getByLabelText('Email');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('derives id from label text', () => {
      render(<Input label="First Name" />);
      const input = screen.getByLabelText('First Name');
      expect(input.id).toBe('first-name');
    });
  });

  // --- With error ---

  describe('with error', () => {
    it('displays error message', () => {
      render(<Input label="Email" error="Email is required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
    });

    it('sets aria-invalid to true', () => {
      render(<Input label="Email" error="Required" />);
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    });

    it('applies error border styles', () => {
      render(<Input label="Email" error="Bad" />);
      const input = screen.getByLabelText('Email');
      expect(input.className).toContain('border-error-300');
    });

    it('links error to input via aria-describedby', () => {
      render(<Input label="Email" error="Too short" />);
      const input = screen.getByLabelText('Email');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      const errorEl = document.getElementById(describedBy!);
      expect(errorEl).toHaveTextContent('Too short');
    });
  });

  // --- With helper text ---

  describe('with helper text', () => {
    it('displays helper text', () => {
      render(<Input label="Password" helperText="Must be at least 8 characters" />);
      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });

    it('links helper text via aria-describedby', () => {
      render(<Input label="Password" helperText="8+ chars" />);
      const input = screen.getByLabelText('Password');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy!)).toHaveTextContent('8+ chars');
    });

    it('error takes precedence over helper text', () => {
      render(<Input label="Name" helperText="Optional" error="Required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Required');
      expect(screen.queryByText('Optional')).toBeNull();
    });
  });

  // --- Disabled ---

  describe('disabled state', () => {
    it('renders a disabled input', () => {
      render(<Input label="Locked" disabled />);
      expect(screen.getByLabelText('Locked')).toBeDisabled();
    });

    it('applies disabled styles', () => {
      render(<Input label="Locked" disabled />);
      const input = screen.getByLabelText('Locked');
      expect(input.className).toContain('disabled:cursor-not-allowed');
      expect(input.className).toContain('disabled:bg-neutral-50');
    });
  });

  // --- Required ---

  describe('required state', () => {
    it('shows asterisk in label when required', () => {
      const { container } = render(<Input label="Name" required />);
      const asterisk = container.querySelector('[aria-hidden="true"]');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk?.textContent).toBe('*');
    });

    it('sets the required attribute on the input', () => {
      render(<Input label="Name" required />);
      expect(screen.getByLabelText(/Name/)).toBeRequired();
    });
  });

  // --- Type variations ---

  describe('type variations', () => {
    it('renders password type', () => {
      render(<Input label="Password" type="password" />);
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });

    it('renders email type', () => {
      render(<Input label="Email" type="email" />);
      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    });
  });
});

// ===========================================================================
// EMPTY STATE
// ===========================================================================

describe('EmptyState — Design System Showcase', () => {
  it('renders title only', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(
      <EmptyState
        title="No packages"
        description="Packages will appear here once they are logged."
      />,
    );
    expect(screen.getByText('No packages')).toBeInTheDocument();
    expect(screen.getByText('Packages will appear here once they are logged.')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(<EmptyState icon={<Package data-testid="empty-icon" />} title="No deliveries" />);
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('renders with action button', () => {
    render(<EmptyState title="No results" action={<Button>Create New</Button>} />);
    expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
  });

  it('renders full empty state with icon, title, description, and action', () => {
    render(
      <EmptyState
        icon={<Search data-testid="search-icon" />}
        title="No search results"
        description="Try adjusting your search or filters."
        action={<Button variant="secondary">Clear Filters</Button>}
      />,
    );
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    expect(screen.getByText('No search results')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filters.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear Filters' })).toBeInTheDocument();
  });

  it('applies dashed border styling', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain('border-dashed');
    expect(wrapper.className).toContain('rounded-2xl');
  });

  it('accepts custom className', () => {
    const { container } = render(<EmptyState title="Custom" className="my-custom-class" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain('my-custom-class');
  });
});

// ===========================================================================
// STATUS BADGE
// ===========================================================================

describe('StatusBadge — Design System Showcase', () => {
  // --- All status types ---

  describe('status types', () => {
    it('renders success status', () => {
      render(<StatusBadge status="success">Active</StatusBadge>);
      const badge = screen.getByText('Active');
      expect(badge.className).toContain('bg-success-50');
      expect(badge.className).toContain('text-success-700');
    });

    it('renders warning status', () => {
      render(<StatusBadge status="warning">Pending</StatusBadge>);
      const badge = screen.getByText('Pending');
      expect(badge.className).toContain('bg-warning-50');
      expect(badge.className).toContain('text-warning-700');
    });

    it('renders error status', () => {
      render(<StatusBadge status="error">Expired</StatusBadge>);
      const badge = screen.getByText('Expired');
      expect(badge.className).toContain('bg-error-50');
      expect(badge.className).toContain('text-error-700');
    });

    it('renders info status', () => {
      render(<StatusBadge status="info">In Progress</StatusBadge>);
      const badge = screen.getByText('In Progress');
      expect(badge.className).toContain('bg-info-50');
      expect(badge.className).toContain('text-info-700');
    });

    it('renders neutral status (default)', () => {
      render(<StatusBadge>Draft</StatusBadge>);
      const badge = screen.getByText('Draft');
      expect(badge.className).toContain('bg-neutral-100');
      expect(badge.className).toContain('text-neutral-600');
    });
  });

  // --- Sizes ---

  describe('sizes', () => {
    it('renders sm size', () => {
      render(
        <StatusBadge size="sm" status="success">
          Small
        </StatusBadge>,
      );
      const badge = screen.getByText('Small');
      expect(badge.className).toContain('text-[11px]');
    });

    it('renders md size (default)', () => {
      render(
        <StatusBadge size="md" status="success">
          Medium
        </StatusBadge>,
      );
      const badge = screen.getByText('Medium');
      expect(badge.className).toContain('text-[12px]');
    });

    it('renders lg size', () => {
      render(
        <StatusBadge size="lg" status="success">
          Large
        </StatusBadge>,
      );
      const badge = screen.getByText('Large');
      expect(badge.className).toContain('text-[13px]');
    });
  });

  // --- Dot indicator ---

  describe('dot indicator', () => {
    it('shows dot by default', () => {
      const { container } = render(<StatusBadge status="success">Active</StatusBadge>);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
      expect(dot?.className).toContain('bg-success-500');
    });

    it('hides dot when dot=false', () => {
      const { container } = render(
        <StatusBadge status="success" dot={false}>
          No Dot
        </StatusBadge>,
      );
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toBeNull();
    });

    it('dot color matches status', () => {
      const { container: c1 } = render(<StatusBadge status="error">Err</StatusBadge>);
      expect(c1.querySelector('[aria-hidden="true"]')?.className).toContain('bg-error-500');

      const { container: c2 } = render(<StatusBadge status="warning">Warn</StatusBadge>);
      expect(c2.querySelector('[aria-hidden="true"]')?.className).toContain('bg-warning-500');

      const { container: c3 } = render(<StatusBadge status="info">Info</StatusBadge>);
      expect(c3.querySelector('[aria-hidden="true"]')?.className).toContain('bg-info-500');

      const { container: c4 } = render(<StatusBadge status="neutral">Neutral</StatusBadge>);
      expect(c4.querySelector('[aria-hidden="true"]')?.className).toContain('bg-neutral-400');
    });
  });

  // --- Status + size matrix ---

  describe('status x size matrix', () => {
    const statuses = ['success', 'warning', 'error', 'info', 'neutral'] as const;
    const sizes = ['sm', 'md', 'lg'] as const;

    statuses.forEach((status) => {
      sizes.forEach((size) => {
        it(`renders ${status} / ${size} without crashing`, () => {
          const { container } = render(
            <StatusBadge status={status} size={size}>
              {status}-{size}
            </StatusBadge>,
          );
          expect(container.querySelector('span')).toBeInTheDocument();
        });
      });
    });
  });
});

// ===========================================================================
// DATA TABLE
// ===========================================================================

describe('DataTable — Design System Showcase', () => {
  // --- Test data ---

  interface TestRow {
    id: string;
    name: string;
    unit: string;
    status: string;
    amount: number;
  }

  const sampleData: TestRow[] = [
    { id: '1', name: 'Alice Johnson', unit: '101', status: 'Active', amount: 250 },
    { id: '2', name: 'Bob Smith', unit: '205', status: 'Pending', amount: 180 },
    { id: '3', name: 'Carol White', unit: '312', status: 'Inactive', amount: 0 },
  ];

  const columns: Column<TestRow>[] = [
    { id: 'name', header: 'Name', accessorKey: 'name', sortable: true },
    { id: 'unit', header: 'Unit', accessorKey: 'unit' },
    { id: 'status', header: 'Status', accessorKey: 'status', sortable: true },
    {
      id: 'amount',
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (row) => `$${row.amount.toFixed(2)}`,
    },
  ];

  // --- With data ---

  describe('with data', () => {
    it('renders all rows', () => {
      render(<DataTable columns={columns} data={sampleData} />);
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Carol White')).toBeInTheDocument();
    });

    it('renders all column headers', () => {
      render(<DataTable columns={columns} data={sampleData} />);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Unit')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    it('renders custom cell content', () => {
      render(<DataTable columns={columns} data={sampleData} />);
      expect(screen.getByText('$250.00')).toBeInTheDocument();
      expect(screen.getByText('$180.00')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('renders table within a styled container', () => {
      const { container } = render(<DataTable columns={columns} data={sampleData} />);
      const wrapper = container.firstElementChild!;
      expect(wrapper.className).toContain('rounded-2xl');
      expect(wrapper.className).toContain('border');
      expect(wrapper.className).toContain('bg-white');
    });
  });

  // --- Empty state ---

  describe('empty state', () => {
    it('shows default empty message when data is empty', () => {
      render(<DataTable columns={columns} data={[]} />);
      expect(screen.getByText('No data to display')).toBeInTheDocument();
    });

    it('shows custom empty message', () => {
      render(<DataTable columns={columns} data={[]} emptyMessage="No residents found" />);
      expect(screen.getByText('No residents found')).toBeInTheDocument();
    });

    it('shows empty icon when provided', () => {
      render(
        <DataTable
          columns={columns}
          data={[]}
          emptyIcon={<AlertCircle data-testid="empty-table-icon" />}
          emptyMessage="Nothing here"
        />,
      );
      expect(screen.getByTestId('empty-table-icon')).toBeInTheDocument();
    });

    it('does not render table element when empty', () => {
      const { container } = render(<DataTable columns={columns} data={[]} />);
      expect(container.querySelector('table')).toBeNull();
    });
  });

  // --- Sortable columns ---

  describe('sortable columns', () => {
    it('renders sort button for sortable columns', () => {
      render(<DataTable columns={columns} data={sampleData} />);
      // "Name" column is sortable, should have a button
      const nameHeader = screen.getByText('Name');
      expect(nameHeader.closest('button')).toBeInTheDocument();
    });

    it('does not render sort button for non-sortable columns', () => {
      render(<DataTable columns={columns} data={sampleData} />);
      // "Unit" column is not sortable
      const unitHeader = screen.getByText('Unit');
      expect(unitHeader.closest('button')).toBeNull();
    });

    it('sorts ascending on first click', async () => {
      render(<DataTable columns={columns} data={sampleData} />);
      const nameButton = screen.getByText('Name').closest('button')!;
      await userEvent.click(nameButton);

      const rows = screen.getAllByRole('row');
      // row[0] is header; data rows follow
      const firstDataRow = rows[1]!;
      expect(within(firstDataRow).getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('sorts descending on second click', async () => {
      render(<DataTable columns={columns} data={sampleData} />);
      const nameButton = screen.getByText('Name').closest('button')!;
      await userEvent.click(nameButton); // asc
      await userEvent.click(nameButton); // desc

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1]!;
      expect(within(firstDataRow).getByText('Carol White')).toBeInTheDocument();
    });

    it('clears sort on third click', async () => {
      render(<DataTable columns={columns} data={sampleData} />);
      const nameButton = screen.getByText('Name').closest('button')!;
      await userEvent.click(nameButton); // asc
      await userEvent.click(nameButton); // desc
      await userEvent.click(nameButton); // clear — back to original order

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1]!;
      expect(within(firstDataRow).getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('sorts numeric columns correctly', async () => {
      render(<DataTable columns={columns} data={sampleData} />);
      const amountButton = screen.getByText('Amount').closest('button')!;
      await userEvent.click(amountButton); // asc

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1]!;
      expect(within(firstDataRow).getByText('$0.00')).toBeInTheDocument();
    });
  });

  // --- Clickable rows ---

  describe('clickable rows', () => {
    it('calls onRowClick when a row is clicked', async () => {
      const handler = vi.fn();
      render(<DataTable columns={columns} data={sampleData} onRowClick={handler} />);

      const rows = screen.getAllByRole('row');
      await userEvent.click(rows[1]!); // first data row

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1', name: 'Alice Johnson' }),
      );
    });

    it('applies cursor-pointer class when onRowClick is set', () => {
      const handler = vi.fn();
      render(<DataTable columns={columns} data={sampleData} onRowClick={handler} />);

      const rows = screen.getAllByRole('row');
      expect(rows[1]!.className).toContain('cursor-pointer');
    });

    it('does not apply cursor-pointer when onRowClick is not set', () => {
      render(<DataTable columns={columns} data={sampleData} />);
      const rows = screen.getAllByRole('row');
      expect(rows[1]!.className).not.toContain('cursor-pointer');
    });
  });

  // --- Compact mode ---

  describe('compact mode', () => {
    it('applies compact padding when compact=true', () => {
      render(<DataTable columns={columns} data={sampleData} compact />);
      const cells = screen.getAllByRole('cell');
      expect(cells[0]!.className).toContain('px-4');
      expect(cells[0]!.className).toContain('py-2.5');
    });

    it('applies default padding when compact=false', () => {
      render(<DataTable columns={columns} data={sampleData} />);
      const cells = screen.getAllByRole('cell');
      expect(cells[0]!.className).toContain('px-5');
      expect(cells[0]!.className).toContain('py-3.5');
    });
  });
});
