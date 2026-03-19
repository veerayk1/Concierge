import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, type Column } from '../data-table';

interface TestRow {
  id: string;
  name: string;
  email: string;
  age: number;
}

const testData: TestRow[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', age: 30 },
  { id: '2', name: 'Bob', email: 'bob@example.com', age: 25 },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', age: 35 },
];

const testColumns: Column<TestRow>[] = [
  { id: 'name', header: 'Name', accessorKey: 'name', sortable: true },
  { id: 'email', header: 'Email', accessorKey: 'email' },
  { id: 'age', header: 'Age', accessorKey: 'age', sortable: true },
];

describe('DataTable', () => {
  it('renders table with columns and data', () => {
    render(<DataTable columns={testColumns} data={testData} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<DataTable columns={testColumns} data={testData} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('renders rows with data', () => {
    render(<DataTable columns={testColumns} data={testData} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
  });

  it('renders correct number of rows', () => {
    render(<DataTable columns={testColumns} data={testData} />);
    const tbody = screen.getByRole('table').querySelector('tbody');
    const rows = within(tbody!).getAllByRole('row');
    expect(rows).toHaveLength(3);
  });

  it('handles empty data with empty state message', () => {
    render(<DataTable columns={testColumns} data={[]} />);
    expect(screen.getByText('No data to display')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows custom empty message', () => {
    render(<DataTable columns={testColumns} data={[]} emptyMessage="No users found" />);
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('shows empty icon when provided', () => {
    render(
      <DataTable
        columns={testColumns}
        data={[]}
        emptyIcon={<span data-testid="empty-icon">icon</span>}
      />,
    );
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('sortable columns show sort button', () => {
    render(<DataTable columns={testColumns} data={testData} />);
    // Name and Age are sortable, Email is not
    const nameHeader = screen.getByText('Name');
    expect(nameHeader.closest('button')).toBeInTheDocument();

    const emailHeader = screen.getByText('Email');
    expect(emailHeader.closest('button')).toBeNull();
  });

  it('sorts data ascending on first click', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={testColumns} data={testData} />);

    const nameButton = screen.getByRole('button', { name: /name/i });
    await user.click(nameButton);

    const tbody = screen.getByRole('table').querySelector('tbody');
    const rows = within(tbody!).getAllByRole('row');
    expect(rows[0]).toHaveTextContent('Alice');
    expect(rows[1]).toHaveTextContent('Bob');
    expect(rows[2]).toHaveTextContent('Charlie');
  });

  it('sorts data descending on second click', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={testColumns} data={testData} />);

    const nameButton = screen.getByRole('button', { name: /name/i });
    await user.click(nameButton); // asc
    await user.click(nameButton); // desc

    const tbody = screen.getByRole('table').querySelector('tbody');
    const rows = within(tbody!).getAllByRole('row');
    expect(rows[0]).toHaveTextContent('Charlie');
    expect(rows[1]).toHaveTextContent('Bob');
    expect(rows[2]).toHaveTextContent('Alice');
  });

  it('clears sort on third click', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={testColumns} data={testData} />);

    const nameButton = screen.getByRole('button', { name: /name/i });
    await user.click(nameButton); // asc
    await user.click(nameButton); // desc
    await user.click(nameButton); // clear

    const tbody = screen.getByRole('table').querySelector('tbody');
    const rows = within(tbody!).getAllByRole('row');
    // Back to original order
    expect(rows[0]).toHaveTextContent('Alice');
    expect(rows[1]).toHaveTextContent('Bob');
    expect(rows[2]).toHaveTextContent('Charlie');
  });

  it('row click handler called with correct row data', async () => {
    const user = userEvent.setup();
    const handleRowClick = vi.fn();
    render(<DataTable columns={testColumns} data={testData} onRowClick={handleRowClick} />);

    const tbody = screen.getByRole('table').querySelector('tbody');
    const rows = within(tbody!).getAllByRole('row');
    await user.click(rows[1]!);

    expect(handleRowClick).toHaveBeenCalledTimes(1);
    expect(handleRowClick).toHaveBeenCalledWith(testData[1]);
  });

  it('applies cursor-pointer class when onRowClick is provided', () => {
    render(<DataTable columns={testColumns} data={testData} onRowClick={() => {}} />);
    const tbody = screen.getByRole('table').querySelector('tbody');
    const row = within(tbody!).getAllByRole('row')[0];
    expect(row!.className).toContain('cursor-pointer');
  });

  it('custom cell renderers work', () => {
    const columnsWithCustomCell: Column<TestRow>[] = [
      {
        id: 'name',
        header: 'Name',
        cell: (row) => <strong data-testid="custom-cell">{row.name.toUpperCase()}</strong>,
      },
    ];
    render(<DataTable columns={columnsWithCustomCell} data={testData} />);
    const cells = screen.getAllByTestId('custom-cell');
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveTextContent('ALICE');
  });

  it('merges custom className on wrapper', () => {
    const { container } = render(
      <DataTable columns={testColumns} data={testData} className="my-table" />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('my-table');
  });

  it('applies compact styles when compact is true', () => {
    render(<DataTable columns={testColumns} data={testData} compact />);
    const th = screen.getByRole('table').querySelector('th');
    expect(th?.className).toContain('px-4');
    expect(th?.className).toContain('py-2.5');
  });

  it('sorts numeric columns correctly', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={testColumns} data={testData} />);

    const ageButton = screen.getByRole('button', { name: /age/i });
    await user.click(ageButton); // asc

    const tbody = screen.getByRole('table').querySelector('tbody');
    const rows = within(tbody!).getAllByRole('row');
    expect(rows[0]).toHaveTextContent('25');
    expect(rows[1]).toHaveTextContent('30');
    expect(rows[2]).toHaveTextContent('35');
  });
});
