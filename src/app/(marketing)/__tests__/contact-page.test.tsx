import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ContactPage from '../contact/page';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock fetch for the contact form POST
const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

describe('Contact Page', () => {
  it('renders contact form with required fields', () => {
    render(<ContactPage />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('validates email field with invalid input', async () => {
    const user = userEvent.setup();
    render(<ContactPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send message/i });

    // Fill in name and message but leave email invalid
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(emailInput, 'not-an-email');
    await user.type(screen.getByLabelText(/message/i), 'Hello, I have a question.');
    await user.click(submitButton);

    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  it('validates that message field is required', async () => {
    const user = userEvent.setup();
    render(<ContactPage />);

    const submitButton = screen.getByRole('button', { name: /send message/i });

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    // Leave message empty
    await user.click(submitButton);

    expect(screen.getByText(/message is required/i)).toBeInTheDocument();
  });

  it('shows success message on valid submission', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    const user = userEvent.setup();
    render(<ContactPage />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    // Subject is required by the form — select a valid option
    await user.selectOptions(screen.getByLabelText(/subject/i), 'general');
    await user.type(screen.getByLabelText(/message/i), 'Hello, I have a question about Concierge.');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(screen.getByText(/thank you/i)).toBeInTheDocument();
  });
});
