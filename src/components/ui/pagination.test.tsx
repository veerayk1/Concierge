import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('renders page buttons', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('marks current page with aria-current', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('3')).toHaveAttribute('aria-current', 'page');
  });

  it('calls onPageChange when a page is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onChange} />);

    await user.click(screen.getByText('3'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('disables prev button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Next page')).toBeDisabled();
  });

  it('navigates to previous page', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onChange} />);

    await user.click(screen.getByLabelText('Previous page'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('navigates to next page', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onChange} />);

    await user.click(screen.getByLabelText('Next page'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('shows ellipsis for many pages', () => {
    render(<Pagination currentPage={5} totalPages={20} onPageChange={vi.fn()} />);
    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });

  it('shows total count when provided', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} totalCount={123} />);
    expect(screen.getByText('123 items')).toBeInTheDocument();
  });

  it('shows singular "item" for count of 1', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
        totalCount={1}
        showPageSize
      />,
    );
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('renders page size selector when showPageSize is true', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={vi.fn()}
        showPageSize
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Rows per page:')).toBeInTheDocument();
  });

  it('returns null when totalPages is 1 and showPageSize is false', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
