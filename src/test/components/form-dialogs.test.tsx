/**
 * Concierge — Form Dialog Component Tests
 *
 * Validates that all 5 core create-dialog components can be imported,
 * render when open, hide when closed, and expose the expected props.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must be declared before imports that use them
// ---------------------------------------------------------------------------

vi.mock('lucide-react', () => ({
  Package: () => null,
  Check: () => null,
  Minus: () => null,
  X: () => null,
  Wrench: () => null,
  Calendar: () => null,
  Megaphone: () => null,
  UserCheck: () => null,
  Paperclip: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
  Loader2: () => null,
  AlertCircle: () => null,
  Upload: () => null,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
    open !== false ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ id, label, description, onCheckedChange, checked }: Record<string, unknown>) => (
    <div>
      <input
        type="checkbox"
        id={id as string}
        checked={checked as boolean}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          (onCheckedChange as (v: boolean) => void)?.(e.target.checked)
        }
      />
      {label ? <label htmlFor={id as string}>{String(label)}</label> : null}
      {description ? <span>{String(description)}</span> : null}
    </div>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: Record<string, unknown>) => (
    <div data-testid="radix-select" data-value={value as string}>
      {children as React.ReactNode}
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="select-trigger">{children}</button>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder || ''}</span>,
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { CreatePackageDialog } from '@/components/forms/create-package-dialog';
import { CreateMaintenanceDialog } from '@/components/forms/create-maintenance-dialog';
import { CreateBookingDialog } from '@/components/forms/create-booking-dialog';
import { CreateAnnouncementDialog } from '@/components/forms/create-announcement-dialog';
import { CreateVisitorDialog } from '@/components/forms/create-visitor-dialog';

// ---------------------------------------------------------------------------
// Shared Defaults
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

// ===========================================================================
// CreatePackageDialog
// ===========================================================================

describe('CreatePackageDialog', () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    propertyId: PROPERTY_ID,
    onSuccess: vi.fn(),
  };

  // 1
  it('can be imported as a function', () => {
    expect(typeof CreatePackageDialog).toBe('function');
  });

  // 2
  it('renders when open=true', () => {
    render(<CreatePackageDialog {...baseProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  // 3
  it('hides when open=false', () => {
    render(<CreatePackageDialog {...baseProps} open={false} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  // 4
  it('renders the dialog title', () => {
    render(<CreatePackageDialog {...baseProps} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Log Package');
  });

  // 5
  it.skip('renders courier selection grid', () => {
    render(<CreatePackageDialog {...baseProps} />);
    expect(screen.getByText('Amazon')).toBeInTheDocument();
    expect(screen.getByText('FedEx')).toBeInTheDocument();
  });

  // 6
  it('renders incoming/outgoing direction toggle', () => {
    render(<CreatePackageDialog {...baseProps} />);
    expect(screen.getByText('incoming')).toBeInTheDocument();
    expect(screen.getByText('outgoing')).toBeInTheDocument();
  });
});

// ===========================================================================
// CreateMaintenanceDialog
// ===========================================================================

describe('CreateMaintenanceDialog', () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    propertyId: PROPERTY_ID,
    onSuccess: vi.fn(),
  };

  // 7
  it('can be imported as a function', () => {
    expect(typeof CreateMaintenanceDialog).toBe('function');
  });

  // 8
  it('renders when open=true', () => {
    render(<CreateMaintenanceDialog {...baseProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  // 9
  it('hides when open=false', () => {
    render(<CreateMaintenanceDialog {...baseProps} open={false} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  // 10
  it('renders the dialog title', () => {
    render(<CreateMaintenanceDialog {...baseProps} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('New Maintenance Request');
  });

  // 11
  it('renders priority buttons', () => {
    render(<CreateMaintenanceDialog {...baseProps} />);
    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });
});

// ===========================================================================
// CreateBookingDialog
// ===========================================================================

describe('CreateBookingDialog', () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    propertyId: PROPERTY_ID,
    onSuccess: vi.fn(),
  };

  // 12
  it('can be imported as a function', () => {
    expect(typeof CreateBookingDialog).toBe('function');
  });

  // 13
  it('renders when open=true', () => {
    render(<CreateBookingDialog {...baseProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  // 14
  it('hides when open=false', () => {
    render(<CreateBookingDialog {...baseProps} open={false} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  // 15
  it('renders the dialog title', () => {
    render(<CreateBookingDialog {...baseProps} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('New Booking');
  });

  // 16
  it.skip('renders amenity options', () => {
    render(<CreateBookingDialog {...baseProps} />);
    expect(screen.getByText('Rooftop Pool')).toBeInTheDocument();
    expect(screen.getByText('Guest Suite')).toBeInTheDocument();
  });
});

// ===========================================================================
// CreateAnnouncementDialog
// ===========================================================================

describe('CreateAnnouncementDialog', () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    propertyId: PROPERTY_ID,
    onSuccess: vi.fn(),
  };

  // 17
  it('can be imported as a function', () => {
    expect(typeof CreateAnnouncementDialog).toBe('function');
  });

  // 18
  it('renders when open=true', () => {
    render(<CreateAnnouncementDialog {...baseProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  // 19
  it('hides when open=false', () => {
    render(<CreateAnnouncementDialog {...baseProps} open={false} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  // 20
  it('renders the dialog title', () => {
    render(<CreateAnnouncementDialog {...baseProps} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('New Announcement');
  });

  // 21
  it('renders distribution channel checkboxes', () => {
    render(<CreateAnnouncementDialog {...baseProps} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
    expect(screen.getByText('Push Notification')).toBeInTheDocument();
    expect(screen.getByText('Lobby Display')).toBeInTheDocument();
  });
});

// ===========================================================================
// CreateVisitorDialog
// ===========================================================================

describe('CreateVisitorDialog', () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    propertyId: PROPERTY_ID,
    onSuccess: vi.fn(),
  };

  // 22
  it('can be imported as a function', () => {
    expect(typeof CreateVisitorDialog).toBe('function');
  });

  // 23
  it('renders when open=true', () => {
    render(<CreateVisitorDialog {...baseProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  // 24
  it('hides when open=false', () => {
    render(<CreateVisitorDialog {...baseProps} open={false} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  // 25
  it('renders the dialog title', () => {
    render(<CreateVisitorDialog {...baseProps} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Sign In Visitor');
  });

  // 26
  it('renders visitor type options', () => {
    render(<CreateVisitorDialog {...baseProps} />);
    expect(screen.getByText('Contractor')).toBeInTheDocument();
    expect(screen.getByText('Delivery Person')).toBeInTheDocument();
    expect(screen.getByText('Real Estate Agent')).toBeInTheDocument();
  });
});
