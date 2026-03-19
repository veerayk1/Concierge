import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content here</Card>);
    expect(screen.getByText('Card content here')).toBeInTheDocument();
  });

  it('applies default md padding', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('p-6');
  });

  it('applies none padding variant', () => {
    const { container } = render(<Card padding="none">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('p-4');
    expect(card.className).not.toContain('p-6');
    expect(card.className).not.toContain('p-8');
  });

  it('applies sm padding variant', () => {
    const { container } = render(<Card padding="sm">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('p-4');
  });

  it('applies lg padding variant', () => {
    const { container } = render(<Card padding="lg">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('p-8');
  });

  it('applies hoverable styles when hoverable is true', () => {
    const { container } = render(<Card hoverable>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('hover:shadow-md');
  });

  it('merges custom className', () => {
    const { container } = render(<Card className="custom-card">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-card');
  });

  it('forwards ref', () => {
    const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
    render(<Card ref={ref}>Content</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('applies flex layout classes', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    const header = container.firstChild as HTMLElement;
    expect(header.className).toContain('flex');
    expect(header.className).toContain('items-center');
    expect(header.className).toContain('justify-between');
  });
});

describe('CardTitle', () => {
  it('renders as an h3 element', () => {
    render(<CardTitle>Title</CardTitle>);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Title');
  });

  it('applies font-semibold class', () => {
    render(<CardTitle>Title</CardTitle>);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading.className).toContain('font-semibold');
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Body content</CardContent>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('applies text color class', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('text-neutral-600');
  });
});

describe('CardDescription', () => {
  it('renders as a paragraph element', () => {
    render(<CardDescription>Description text</CardDescription>);
    const p = screen.getByText('Description text');
    expect(p.tagName).toBe('P');
  });

  it('applies text-neutral-500 class', () => {
    render(<CardDescription>Desc</CardDescription>);
    const p = screen.getByText('Desc');
    expect(p.className).toContain('text-neutral-500');
  });
});
