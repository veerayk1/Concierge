import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog';

function renderDialog({
  open = true,
  onOpenChange,
  title = 'Dialog Title',
  description = 'Dialog description text',
  children,
  className,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
} = {}) {
  return render(
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>,
  );
}

describe('Dialog', () => {
  it('renders content when open=true', () => {
    renderDialog({ open: true });
    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
  });

  it('does not render content when open=false', () => {
    renderDialog({ open: false });
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
  });

  it('shows title and description', () => {
    renderDialog({ title: 'Confirm Action', description: 'Are you sure?' });
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders children inside the dialog', () => {
    renderDialog({ children: <button>Save</button> });
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('fires onOpenChange when clicking the close button', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();
    renderDialog({ onOpenChange: handleOpenChange });
    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('supports custom className on content', () => {
    renderDialog({ className: 'my-dialog-class' });
    const content = screen.getByRole('dialog');
    expect(content.className).toContain('my-dialog-class');
  });
});
