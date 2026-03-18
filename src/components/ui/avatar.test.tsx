import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './avatar';

describe('Avatar', () => {
  it('renders an image when src is provided', () => {
    render(<Avatar src="/photo.jpg" name="John Doe" />);
    const img = screen.getByAltText('John Doe');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/photo.jpg');
  });

  it('renders initials when no src is provided', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders single initial for single name', () => {
    render(<Avatar name="John" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('uses fallback prop over name-derived initials', () => {
    render(<Avatar name="John Doe" fallback="X" />);
    expect(screen.getByText('X')).toBeInTheDocument();
  });

  it('renders status dot with correct aria-label', () => {
    render(<Avatar name="John Doe" status="online" />);
    expect(screen.getByLabelText('online')).toBeInTheDocument();
  });

  it('renders all size variants without errors', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    for (const size of sizes) {
      const { unmount } = render(<Avatar name="Test" size={size} />);
      expect(screen.getByText('T')).toBeInTheDocument();
      unmount();
    }
  });

  it('renders all status variants', () => {
    const statuses = ['online', 'offline', 'away', 'busy'] as const;
    for (const status of statuses) {
      const { unmount } = render(<Avatar name="Test" status={status} />);
      expect(screen.getByLabelText(status)).toBeInTheDocument();
      unmount();
    }
  });
});
