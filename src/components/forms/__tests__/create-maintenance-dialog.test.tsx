import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CreateMaintenanceDialog } from '../create-maintenance-dialog';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('lucide-react', () => ({
  Wrench: () => null,
  Check: () => null,
  Minus: () => null,
  X: () => null,
}));

// Mock Radix UI Dialog to avoid jsdom hang
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
    open !== false ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

// Mock Radix UI Checkbox to avoid jsdom hang
vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ id, onCheckedChange, label, description, ...props }: Record<string, unknown>) => (
    <div>
      <input
        type="checkbox"
        id={id as string}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          (onCheckedChange as (v: boolean) => void)?.(e.target.checked)
        }
        {...props}
      />
      {label && <label htmlFor={id as string}>{label as string}</label>}
      {description && <span>{description as string}</span>}
    </div>
  ),
}));

const DEFAULT_PROPS = {
  open: true,
  onOpenChange: vi.fn(),
  propertyId: '00000000-0000-4000-b000-000000000001',
  onSuccess: vi.fn(),
};

function renderDialog(props: Partial<typeof DEFAULT_PROPS> = {}) {
  return render(<CreateMaintenanceDialog {...DEFAULT_PROPS} {...props} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe.skip('CreateMaintenanceDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  // 1
  it('renders dialog when open=true', () => {
    renderDialog();
    expect(screen.getByText(/New Maintenance Request/)).toBeInTheDocument();
  });

  // 2
  it('does not render when open=false', () => {
    renderDialog({ open: false });
    expect(screen.queryByText(/New Maintenance Request/)).not.toBeInTheDocument();
  });

  // 3
  it('shows dialog description', () => {
    renderDialog();
    expect(screen.getByText('Submit a new maintenance request for a unit.')).toBeInTheDocument();
  });

  // 4
  it('shows unit select field', () => {
    renderDialog();
    expect(screen.getByText('Select unit...')).toBeInTheDocument();
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getByText('1501')).toBeInTheDocument();
  });

  // 5
  it('shows category select with all maintenance categories', () => {
    renderDialog();
    expect(screen.getByText('Select category...')).toBeInTheDocument();
    const categories = [
      'Plumbing',
      'Electrical',
      'HVAC',
      'Appliance',
      'General',
      'Doors & Windows',
      'Flooring',
      'Painting',
      'Pest Control',
      'Other',
    ];
    for (const cat of categories) {
      expect(screen.getByText(cat)).toBeInTheDocument();
    }
  });

  // 6
  it('shows description textarea with placeholder', () => {
    renderDialog();
    expect(
      screen.getByPlaceholderText('Describe the issue in detail (minimum 10 characters)...'),
    ).toBeInTheDocument();
  });

  // 7
  it('shows four priority options', () => {
    renderDialog();
    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  // 8
  it('shows permission to enter checkbox', () => {
    renderDialog();
    expect(screen.getByText('Permission to Enter')).toBeInTheDocument();
    expect(
      screen.getByText('Staff can enter the unit without the resident being present'),
    ).toBeInTheDocument();
  });

  // 9
  it('shows contact phone input', () => {
    renderDialog();
    expect(screen.getByPlaceholderText('Best number to reach resident')).toBeInTheDocument();
  });

  // 10
  it('shows submit and cancel buttons', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  // 11
  it('calls onOpenChange(false) when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // 12
  it('does not call fetch when form is invalid (no unit selected)', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /submit request/i }));

    // Form validation should prevent fetch from being called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // 13
  it('allows selecting priority by clicking buttons', async () => {
    const user = userEvent.setup();
    renderDialog();

    const urgentBtn = screen.getByText('urgent');
    await user.click(urgentBtn);

    // After clicking, urgent should have ring-2 styling (active state)
    expect(urgentBtn.className).toContain('ring-2');
  });

  // 14
  it('has required field markers for unit and description', () => {
    renderDialog();
    const asterisks = screen.getAllByText('*');
    expect(asterisks.length).toBeGreaterThanOrEqual(2);
  });

  // 15
  it('description textarea has maxLength of 4000', () => {
    renderDialog();
    const textarea = screen.getByPlaceholderText(
      'Describe the issue in detail (minimum 10 characters)...',
    );
    expect(textarea).toHaveAttribute('maxLength', '4000');
  });

  // 16
  it('shows category label', () => {
    renderDialog();
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  // 17
  it('shows priority label', () => {
    renderDialog();
    expect(screen.getByText('Priority')).toBeInTheDocument();
  });
});
