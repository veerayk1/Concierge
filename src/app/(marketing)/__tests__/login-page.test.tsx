import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import LoginPage from '../login/page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

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

describe('Login Page', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders generic login form', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('has a property code field for routing to correct portal', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/property code/i)).toBeInTheDocument();
  });

  it('shows link to go back to the marketing site', () => {
    render(<LoginPage />);

    const homeLink = screen.getByRole('link', { name: /back to home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
