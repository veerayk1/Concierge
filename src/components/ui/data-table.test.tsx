/**
 * DataTable Component Tests
 *
 * The DataTable is used across 8+ modules (packages, events, maintenance,
 * units, residents, parking, incidents, users). A bug here affects
 * every operational screen in the platform.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type Column } from './data-table';

interface TestRow {
  id: string;
  name: string;
  unit: string;
  status: string;
  count: number;
}

const columns: Column<TestRow>[] = [
  { id: 'name', header: 'Name', accessorKey: 'name', sortable: true },
  { id: 'unit', header: 'Unit', accessorKey: 'unit', sortable: true },
  { id: 'status', header: 'Status', accessorKey: 'status' },
  { id: 'count', header: 'Count', accessorKey: 'count', sortable: true },
  {
    id: 'custom',
    header: 'Custom',
    cell: (row) => <span data-testid={`custom-${row.id}`}>Custom: {row.name}</span>,
  },
];

const data: TestRow[] = [
  { id: '1', name: 'Alice', unit: '101', status: 'active', count: 5 },
  { id: '2', name: 'Bob', unit: '305', status: 'inactive', count: 2 },
  { id: '3', name: 'Charlie', unit: '802', status: 'active', count: 8 },
];

describe('DataTable — Rendering', () => {
  it('renders all column headers', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Unit')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Count')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('renders all data rows', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders custom cell renderers', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByTestId('custom-1')).toHaveTextContent('Custom: Alice');
    expect(screen.getByTestId('custom-2')).toHaveTextContent('Custom: Bob');
  });

  it('uses accessorKey for default cell rendering', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getByText('305')).toBeInTheDocument();
  });
});

describe('DataTable — Empty State', () => {
  it('shows empty message when data is empty', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No records found" />);
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('shows custom empty icon when provided', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="Nothing here"
        emptyIcon={<span data-testid="empty-icon">Icon</span>}
      />,
    );
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('does NOT render table headers when empty', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Empty" />);
    // Empty state replaces the table entirely
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
  });
});

describe('DataTable — Sorting', () => {
  it('shows sort button only on sortable columns', () => {
    render(<DataTable columns={columns} data={data} />);
    // Name is sortable — should have a button
    const nameHeader = screen.getByText('Name');
    expect(nameHeader.closest('button')).toBeTruthy();
    // Status is NOT sortable — should NOT have a button
    const statusHeader = screen.getByText('Status');
    expect(statusHeader.closest('button')).toBeNull();
  });

  it('sorts string data ascending on first click', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} />);

    await user.click(screen.getByText('Name'));

    // After ascending sort: Alice, Bob, Charlie
    const rows = screen.getAllByRole('row');
    // First row is header, data starts at index 1
    expect(within(rows[1]!).getByText('Alice')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Bob')).toBeInTheDocument();
    expect(within(rows[3]!).getByText('Charlie')).toBeInTheDocument();
  });

  it('sorts descending on second click', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} />);

    await user.click(screen.getByText('Name'));
    await user.click(screen.getByText('Name'));

    const rows = screen.getAllByRole('row');
    expect(within(rows[1]!).getByText('Charlie')).toBeInTheDocument();
    expect(within(rows[3]!).getByText('Alice')).toBeInTheDocument();
  });

  it('sorts numeric data correctly (not lexicographic)', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} />);

    await user.click(screen.getByText('Count'));

    const rows = screen.getAllByRole('row');
    // Ascending: 2, 5, 8
    expect(within(rows[1]!).getByText('2')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('5')).toBeInTheDocument();
    expect(within(rows[3]!).getByText('8')).toBeInTheDocument();
  });
});

describe('DataTable — Row Interaction', () => {
  it('calls onRowClick when a row is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onClick} />);

    const rows = screen.getAllByRole('row');
    await user.click(rows[1]!); // First data row

    expect(onClick).toHaveBeenCalledWith(data[0]);
  });

  it('adds hover cursor when onRowClick is provided', () => {
    render(<DataTable columns={columns} data={data} onRowClick={vi.fn()} />);
    const rows = screen.getAllByRole('row');
    // Data rows should have cursor-pointer class
    expect(rows[1]!.className).toContain('cursor-pointer');
  });

  it('does NOT add hover cursor when onRowClick is not provided', () => {
    render(<DataTable columns={columns} data={data} />);
    const rows = screen.getAllByRole('row');
    expect(rows[1]!.className).not.toContain('cursor-pointer');
  });
});
