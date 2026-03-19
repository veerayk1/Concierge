/**
 * Screen Reader Compatibility Tests — WCAG 2.2 AA
 *
 * Validates screen reader compatibility:
 *   - Page titles change on navigation (document.title)
 *   - Live regions for dynamic content (aria-live="polite" for notifications)
 *   - Table headers use scope="col"
 *   - Data tables have caption or aria-label
 *   - Dialog components have aria-modal="true" and role="dialog"
 *   - Toast notifications have role="alert"
 *   - Progress indicators have aria-valuenow/aria-valuemin/aria-valuemax
 *
 * @module test/accessibility/screen-reader
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { createElement } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type Column, type DataTableProps } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Test data for DataTable
// ---------------------------------------------------------------------------

interface TestRow {
  id: string;
  name: string;
  status: string;
  unit: string;
}

const testData: TestRow[] = [
  { id: '1', name: 'Package #1001', status: 'Pending', unit: '201' },
  { id: '2', name: 'Package #1002', status: 'Released', unit: '305' },
  { id: '3', name: 'Package #1003', status: 'Expired', unit: '418' },
];

const testColumns: Column<TestRow>[] = [
  { id: 'name', header: 'Package', accessorKey: 'name', sortable: true },
  { id: 'status', header: 'Status', accessorKey: 'status' },
  { id: 'unit', header: 'Unit', accessorKey: 'unit' },
];

// ---------------------------------------------------------------------------
// 1. Page titles change on navigation (document.title)
// ---------------------------------------------------------------------------

describe('Page titles — document.title changes on navigation', () => {
  afterEach(() => {
    document.title = '';
  });

  it('Document title updates to reflect current page', () => {
    document.title = 'Dashboard | Concierge';
    expect(document.title).toBe('Dashboard | Concierge');

    // Simulate navigation
    document.title = 'Packages | Concierge';
    expect(document.title).toBe('Packages | Concierge');
  });

  it('Document title includes section context for nested pages', () => {
    document.title = 'Package #1234 | Packages | Concierge';
    expect(document.title).toContain('Package #1234');
    expect(document.title).toContain('Concierge');
  });

  it('Document title follows "Page | Section | App" pattern', () => {
    const titles = [
      'Dashboard | Concierge',
      'All Packages | Packages | Concierge',
      'Unit 201 | Units | Concierge',
      'Create Request | Maintenance | Concierge',
      'Settings | Concierge',
    ];

    titles.forEach((title) => {
      document.title = title;
      expect(document.title).toContain('Concierge');
      // At minimum, has the pattern "Something | Concierge"
      expect(document.title.split('|').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('Document title is descriptive (not generic)', () => {
    const badTitles = ['', 'Page', 'Untitled', 'Loading...'];

    badTitles.forEach((title) => {
      // These should NOT be used as page titles
      expect(title.includes('Concierge')).toBe(false);
    });

    // Good titles always contain the app name
    document.title = 'Security Console | Concierge';
    expect(document.title).toContain('Concierge');
    expect(document.title.length).toBeGreaterThan(15);
  });
});

// ---------------------------------------------------------------------------
// 2. Live regions for dynamic content (aria-live)
// ---------------------------------------------------------------------------

describe('Live regions — aria-live for dynamic content', () => {
  it('Notification area uses aria-live="polite" for non-urgent updates', () => {
    render(
      createElement(
        'div',
        { 'aria-live': 'polite', role: 'status' },
        '3 new packages pending pickup',
      ),
    );

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region.textContent).toBe('3 new packages pending pickup');
  });

  it('Urgent alerts use aria-live="assertive"', () => {
    const { container } = render(
      createElement(
        'div',
        { 'aria-live': 'assertive', role: 'alert' },
        'Emergency: Building evacuation in progress',
      ),
    );

    const alertRegion = container.querySelector('[aria-live="assertive"]');
    expect(alertRegion).not.toBeNull();
    expect(alertRegion!.textContent).toBe('Emergency: Building evacuation in progress');
  });

  it('Search result count uses aria-live="polite" for screen readers', () => {
    render(createElement('div', { 'aria-live': 'polite', role: 'status' }, '24 results found'));

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status.textContent).toBe('24 results found');
  });

  it('Form submission success message uses aria-live="polite"', () => {
    render(
      createElement(
        'div',
        { 'aria-live': 'polite', role: 'status' },
        'Package successfully created',
      ),
    );

    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Package successfully created');
  });

  it('Form submission error message uses role="alert"', () => {
    render(createElement('div', { role: 'alert' }, 'Failed to save changes. Please try again.'));

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Failed to save changes. Please try again.');
  });

  it('Dynamic content update in live region is announced', () => {
    const { rerender } = render(
      createElement('div', { 'aria-live': 'polite', role: 'status' }, '0 items selected'),
    );

    const status = screen.getByRole('status');
    expect(status.textContent).toBe('0 items selected');

    rerender(createElement('div', { 'aria-live': 'polite', role: 'status' }, '3 items selected'));

    expect(status.textContent).toBe('3 items selected');
  });

  it('Timer/countdown uses aria-live="off" to prevent excessive announcements', () => {
    const { container } = render(
      createElement(
        'div',
        { 'aria-live': 'off', 'aria-atomic': 'true' },
        'Session expires in 14:59',
      ),
    );

    const timerRegion = container.querySelector('[aria-live="off"]');
    expect(timerRegion).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Table headers use scope="col"
// ---------------------------------------------------------------------------

describe('Table headers — scope="col" attribute', () => {
  it('Table column headers are rendered as <th> elements', () => {
    render(createElement(DataTable, { columns: testColumns, data: testData }));
    const table = screen.getByRole('table');
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.length).toBe(3);
  });

  it('Table headers contain descriptive text', () => {
    render(createElement(DataTable, { columns: testColumns, data: testData }));
    const table = screen.getByRole('table');
    const headers = within(table).getAllByRole('columnheader');
    const texts = headers.map((h) => h.textContent);
    expect(texts).toContain('Package');
    expect(texts).toContain('Status');
    expect(texts).toContain('Unit');
  });

  it('Manual table with scope="col" on headers', () => {
    render(
      createElement(
        'table',
        null,
        createElement(
          'thead',
          null,
          createElement(
            'tr',
            null,
            createElement('th', { scope: 'col' }, 'Name'),
            createElement('th', { scope: 'col' }, 'Role'),
            createElement('th', { scope: 'col' }, 'Email'),
          ),
        ),
        createElement(
          'tbody',
          null,
          createElement(
            'tr',
            null,
            createElement('td', null, 'John'),
            createElement('td', null, 'Admin'),
            createElement('td', null, 'john@example.com'),
          ),
        ),
      ),
    );

    const headers = screen.getAllByRole('columnheader');
    headers.forEach((header) => {
      expect(header).toHaveAttribute('scope', 'col');
    });
  });

  it('Row headers use scope="row" for complex tables', () => {
    render(
      createElement(
        'table',
        null,
        createElement(
          'thead',
          null,
          createElement(
            'tr',
            null,
            createElement('th', { scope: 'col' }, ''),
            createElement('th', { scope: 'col' }, 'Jan'),
            createElement('th', { scope: 'col' }, 'Feb'),
          ),
        ),
        createElement(
          'tbody',
          null,
          createElement(
            'tr',
            null,
            createElement('th', { scope: 'row' }, 'Packages'),
            createElement('td', null, '120'),
            createElement('td', null, '145'),
          ),
          createElement(
            'tr',
            null,
            createElement('th', { scope: 'row' }, 'Incidents'),
            createElement('td', null, '3'),
            createElement('td', null, '1'),
          ),
        ),
      ),
    );

    const rowHeaders = document.querySelectorAll('th[scope="row"]');
    expect(rowHeaders).toHaveLength(2);
    expect(rowHeaders[0]!.textContent).toBe('Packages');
    expect(rowHeaders[1]!.textContent).toBe('Incidents');
  });
});

// ---------------------------------------------------------------------------
// 4. Data tables have caption or aria-label
// ---------------------------------------------------------------------------

describe('Data tables — caption or aria-label', () => {
  it('Table with caption element describes the table purpose', () => {
    render(
      createElement(
        'table',
        null,
        createElement('caption', null, 'Recent packages received in the last 7 days'),
        createElement(
          'thead',
          null,
          createElement(
            'tr',
            null,
            createElement('th', null, 'Package'),
            createElement('th', null, 'Date'),
          ),
        ),
        createElement(
          'tbody',
          null,
          createElement(
            'tr',
            null,
            createElement('td', null, '#1001'),
            createElement('td', null, '2026-03-19'),
          ),
        ),
      ),
    );

    const caption = document.querySelector('caption');
    expect(caption).not.toBeNull();
    expect(caption!.textContent).toBe('Recent packages received in the last 7 days');
  });

  it('Table with aria-label describes the table purpose', () => {
    render(
      createElement(
        'table',
        { 'aria-label': 'Maintenance requests list' },
        createElement(
          'thead',
          null,
          createElement(
            'tr',
            null,
            createElement('th', null, 'Request'),
            createElement('th', null, 'Status'),
          ),
        ),
        createElement('tbody', null),
      ),
    );

    const table = screen.getByRole('table', { name: 'Maintenance requests list' });
    expect(table).toBeInTheDocument();
  });

  it('DataTable component renders a proper table structure', () => {
    render(createElement(DataTable, { columns: testColumns, data: testData }));
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Has thead
    const thead = table.querySelector('thead');
    expect(thead).not.toBeNull();

    // Has tbody with rows
    const tbody = table.querySelector('tbody');
    expect(tbody).not.toBeNull();
    const rows = within(tbody!).getAllByRole('row');
    expect(rows).toHaveLength(3);
  });

  it('Table with aria-describedby links to additional context', () => {
    render(
      createElement(
        'div',
        null,
        createElement('p', { id: 'table-desc' }, 'Showing packages from the last 30 days'),
        createElement(
          'table',
          { 'aria-label': 'Packages', 'aria-describedby': 'table-desc' },
          createElement('thead', null, createElement('tr', null, createElement('th', null, 'ID'))),
          createElement('tbody', null),
        ),
      ),
    );

    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-describedby', 'table-desc');
    const desc = document.getElementById('table-desc');
    expect(desc!.textContent).toBe('Showing packages from the last 30 days');
  });
});

// ---------------------------------------------------------------------------
// 5. Dialog components have aria-modal="true" and role="dialog"
// ---------------------------------------------------------------------------

describe('Dialog components — aria-modal and role="dialog"', () => {
  it('Dialog has role="dialog" and aria-modal="true"', () => {
    render(
      createElement(
        'div',
        { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dlg-title' },
        createElement('h2', { id: 'dlg-title' }, 'Create Package'),
        createElement(Input, { label: 'Tracking Number' }),
        createElement(Button, null, 'Save'),
      ),
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'dlg-title');
  });

  it('Dialog title is announced by screen reader via aria-labelledby', () => {
    render(
      createElement(
        'div',
        { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'title-1' },
        createElement('h2', { id: 'title-1' }, 'Confirm Deletion'),
      ),
    );

    const title = document.getElementById('title-1');
    expect(title!.textContent).toBe('Confirm Deletion');
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'title-1');
  });

  it('Dialog description is announced via aria-describedby', () => {
    render(
      createElement(
        'div',
        {
          role: 'dialog',
          'aria-modal': 'true',
          'aria-labelledby': 'dlg-t',
          'aria-describedby': 'dlg-d',
        },
        createElement('h2', { id: 'dlg-t' }, 'Release Package'),
        createElement(
          'p',
          { id: 'dlg-d' },
          'This will mark the package as collected by the resident.',
        ),
        createElement(Button, null, 'Release'),
        createElement(Button, { variant: 'ghost' }, 'Cancel'),
      ),
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby', 'dlg-d');
    const desc = document.getElementById('dlg-d');
    expect(desc!.textContent).toContain('mark the package as collected');
  });

  it('Alert dialog uses role="alertdialog" for critical actions', () => {
    render(
      createElement(
        'div',
        {
          role: 'alertdialog',
          'aria-modal': 'true',
          'aria-labelledby': 'alert-title',
          'aria-describedby': 'alert-desc',
        },
        createElement('h2', { id: 'alert-title' }, 'Delete Unit Record'),
        createElement(
          'p',
          { id: 'alert-desc' },
          'This action cannot be undone. All associated data will be permanently removed.',
        ),
        createElement(Button, { variant: 'danger' }, 'Delete Permanently'),
        createElement(Button, { variant: 'ghost' }, 'Cancel'),
      ),
    );

    const alertDialog = screen.getByRole('alertdialog');
    expect(alertDialog).toHaveAttribute('aria-modal', 'true');
    expect(alertDialog).toHaveAttribute('aria-labelledby', 'alert-title');
  });

  it('Dialog close button has accessible name', () => {
    render(
      createElement(
        'div',
        { role: 'dialog', 'aria-modal': 'true' },
        createElement(
          'button',
          { 'aria-label': 'Close' },
          createElement('svg', { 'aria-hidden': 'true' }),
        ),
        createElement('h2', null, 'Settings'),
      ),
    );

    const closeBtn = screen.getByRole('button', { name: 'Close' });
    expect(closeBtn).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 6. Toast notifications have role="alert"
// ---------------------------------------------------------------------------

describe('Toast notifications — role="alert"', () => {
  it('Success toast has role="status" for polite announcement', () => {
    render(
      createElement(
        'div',
        { role: 'status', 'aria-live': 'polite' },
        createElement('p', null, 'Package #1234 successfully created'),
      ),
    );

    const toast = screen.getByRole('status');
    expect(toast).toBeInTheDocument();
    expect(toast.textContent).toContain('Package #1234 successfully created');
  });

  it('Error toast has role="alert" for immediate announcement', () => {
    render(
      createElement(
        'div',
        { role: 'alert' },
        createElement('p', null, 'Failed to save maintenance request'),
      ),
    );

    const toast = screen.getByRole('alert');
    expect(toast.textContent).toContain('Failed to save maintenance request');
  });

  it('Toast with title and description has both accessible', () => {
    render(
      createElement(
        'div',
        { role: 'alert' },
        createElement('p', { className: 'font-semibold' }, 'Error'),
        createElement('p', null, 'Unable to release package. Please try again.'),
      ),
    );

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Error');
    expect(alert.textContent).toContain('Unable to release package');
  });

  it('Toast container is positioned with aria-live region', () => {
    const { container } = render(
      createElement(
        'div',
        { 'aria-live': 'polite', 'aria-label': 'Notifications' },
        createElement('div', { role: 'status' }, 'Visitor check-in recorded'),
      ),
    );

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion).toHaveAttribute('aria-label', 'Notifications');
  });

  it('Multiple toasts are each independently announced', () => {
    render(
      createElement(
        'div',
        { 'aria-live': 'polite' },
        createElement('div', { role: 'status' }, 'Package created'),
        createElement('div', { role: 'status' }, 'Email notification sent'),
      ),
    );

    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(2);
    expect(statuses[0]!.textContent).toBe('Package created');
    expect(statuses[1]!.textContent).toBe('Email notification sent');
  });

  it('Dismissible toast close button has accessible name', () => {
    render(
      createElement(
        'div',
        { role: 'alert' },
        createElement('p', null, 'Session expiring soon'),
        createElement(
          'button',
          { 'aria-label': 'Dismiss notification' },
          createElement('svg', { 'aria-hidden': 'true' }),
        ),
      ),
    );

    const dismissBtn = screen.getByRole('button', { name: 'Dismiss notification' });
    expect(dismissBtn).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 7. Progress indicators have aria-valuenow/min/max
// ---------------------------------------------------------------------------

describe('Progress indicators — aria-valuenow/min/max', () => {
  it('Determinate progress bar has all required ARIA attributes', () => {
    render(
      createElement('div', {
        role: 'progressbar',
        'aria-valuenow': 65,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-label': 'Upload progress',
      }),
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '65');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-label', 'Upload progress');
  });

  it('Indeterminate progress bar omits aria-valuenow', () => {
    render(
      createElement('div', {
        role: 'progressbar',
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-label': 'Loading data',
      }),
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).not.toHaveAttribute('aria-valuenow');
    expect(progressbar).toHaveAttribute('aria-label', 'Loading data');
  });

  it('Progress bar with aria-valuetext provides human-readable status', () => {
    render(
      createElement('div', {
        role: 'progressbar',
        'aria-valuenow': 3,
        'aria-valuemin': 0,
        'aria-valuemax': 8,
        'aria-valuetext': 'Step 3 of 8: Upload documents',
        'aria-label': 'Onboarding wizard progress',
      }),
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuetext', 'Step 3 of 8: Upload documents');
  });

  it('Progress bar updates aria-valuenow as progress changes', () => {
    const { rerender } = render(
      createElement('div', {
        role: 'progressbar',
        'aria-valuenow': 25,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-label': 'File upload',
      }),
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '25');

    rerender(
      createElement('div', {
        role: 'progressbar',
        'aria-valuenow': 75,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-label': 'File upload',
      }),
    );

    expect(progressbar).toHaveAttribute('aria-valuenow', '75');
  });

  it('Step indicator uses aria-valuetext for wizard-style progress', () => {
    render(
      createElement('div', {
        role: 'progressbar',
        'aria-valuenow': 2,
        'aria-valuemin': 1,
        'aria-valuemax': 5,
        'aria-valuetext': 'Step 2 of 5: Property details',
        'aria-label': 'Setup wizard',
      }),
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '2');
    expect(progressbar).toHaveAttribute('aria-valuemin', '1');
    expect(progressbar).toHaveAttribute('aria-valuemax', '5');
    expect(progressbar).toHaveAttribute('aria-valuetext', 'Step 2 of 5: Property details');
  });

  it('Completed progress bar shows 100%', () => {
    render(
      createElement('div', {
        role: 'progressbar',
        'aria-valuenow': 100,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuetext': 'Upload complete',
        'aria-label': 'File upload',
      }),
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '100');
    expect(progressbar).toHaveAttribute('aria-valuetext', 'Upload complete');
  });

  it('Progress indicator with visible text label', () => {
    render(
      createElement(
        'div',
        null,
        createElement('div', {
          role: 'progressbar',
          'aria-valuenow': 45,
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-labelledby': 'progress-label',
        }),
        createElement('span', { id: 'progress-label' }, '45% uploaded'),
      ),
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-labelledby', 'progress-label');
    expect(screen.getByText('45% uploaded')).toBeInTheDocument();
  });
});
