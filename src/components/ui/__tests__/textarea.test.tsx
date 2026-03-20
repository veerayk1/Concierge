import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Textarea Component', () => {
  it('imports without error', async () => {
    const mod = await import('../textarea');
    expect(mod.Textarea).toBeDefined();
  });

  it('renders a textarea element', async () => {
    const mod = await import('../textarea');
    const Textarea = mod.Textarea;
    if (!Textarea) return;

    render(<Textarea placeholder="Enter text..." />);
    const el = screen.getByPlaceholderText('Enter text...');
    expect(el.tagName).toBe('TEXTAREA');
  });

  it('accepts user input', async () => {
    const mod = await import('../textarea');
    const Textarea = mod.Textarea;
    if (!Textarea) return;

    const user = userEvent.setup();
    render(<Textarea placeholder="Type here" />);
    const el = screen.getByPlaceholderText('Type here');
    await user.type(el, 'Hello World');
    expect(el).toHaveValue('Hello World');
  });

  it('supports maxLength attribute', async () => {
    const mod = await import('../textarea');
    const Textarea = mod.Textarea;
    if (!Textarea) return;

    render(<Textarea placeholder="Limited" maxLength={100} />);
    const el = screen.getByPlaceholderText('Limited');
    expect(el).toHaveAttribute('maxLength', '100');
  });
});
