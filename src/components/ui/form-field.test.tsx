import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormField } from './form-field';

describe('FormField', () => {
  it('renders label text', () => {
    render(
      <FormField label="Email address">
        <input type="email" />
      </FormField>,
    );
    expect(screen.getByText('Email address')).toBeInTheDocument();
  });

  it('renders required indicator', () => {
    render(
      <FormField label="Name" required>
        <input />
      </FormField>,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders help text', () => {
    render(
      <FormField label="Password" helpText="Must be at least 8 characters">
        <input type="password" />
      </FormField>,
    );
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });

  it('renders error message and hides help text', () => {
    render(
      <FormField label="Email" error="Invalid email" helpText="We will not share your email">
        <input type="email" />
      </FormField>,
    );
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(screen.queryByText('We will not share your email')).not.toBeInTheDocument();
  });

  it('error message has role="alert"', () => {
    render(
      <FormField label="Email" error="Required field">
        <input type="email" />
      </FormField>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Required field');
  });

  it('renders children input elements', () => {
    render(
      <FormField label="Username">
        <input data-testid="username-input" />
      </FormField>,
    );
    expect(screen.getByTestId('username-input')).toBeInTheDocument();
  });

  it('applies disabled styling', () => {
    const { container } = render(
      <FormField label="Disabled field" disabled>
        <input disabled />
      </FormField>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('opacity-50');
  });
});
