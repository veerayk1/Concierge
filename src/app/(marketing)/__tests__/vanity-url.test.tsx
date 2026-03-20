import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PropertyLoginForm from '../../[property-slug]/PropertyLoginForm';

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

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockProperty = {
  name: 'Maple Ridge Condos',
  primaryColor: '#1e40af',
  unitCount: 245,
};

describe('Vanity URL Login (/{property-slug})', () => {
  it('renders branded login for property slug', () => {
    render(<PropertyLoginForm property={mockProperty} slug="maple-ridge-condos" />);

    expect(
      screen.getByRole('heading', { name: /sign in to maple ridge condos/i }),
    ).toBeInTheDocument();
  });

  it('shows email and password fields', () => {
    render(<PropertyLoginForm property={mockProperty} slug="maple-ridge-condos" />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows remember this property checkbox', () => {
    render(<PropertyLoginForm property={mockProperty} slug="maple-ridge-condos" />);

    expect(screen.getByLabelText(/remember this property/i)).toBeInTheDocument();
  });

  it('has a link to the generic login page', () => {
    render(<PropertyLoginForm property={mockProperty} slug="maple-ridge-condos" />);

    const loginLink = screen.getByRole('link', { name: /different property/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('has a forgot password link', () => {
    render(<PropertyLoginForm property={mockProperty} slug="maple-ridge-condos" />);

    const forgotLink = screen.getByRole('link', { name: /forgot password/i });
    expect(forgotLink).toHaveAttribute('href', '/forgot-password');
  });

  it('displays the property initial when no logo is provided', () => {
    render(<PropertyLoginForm property={mockProperty} slug="maple-ridge-condos" />);

    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('uses property accent color on the submit button', () => {
    render(<PropertyLoginForm property={mockProperty} slug="maple-ridge-condos" />);

    const button = screen.getByRole('button', { name: /sign in/i });
    expect(button).toHaveStyle({ backgroundColor: '#1e40af' });
  });
});
