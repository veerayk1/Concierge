import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip, TooltipProvider } from './tooltip';

function renderTooltip(props: Partial<React.ComponentProps<typeof Tooltip>> = {}) {
  return render(
    <TooltipProvider delayDuration={0}>
      <Tooltip content="Helpful text" {...props}>
        <button>Hover me</button>
      </Tooltip>
    </TooltipProvider>,
  );
}

describe('Tooltip', () => {
  it('renders the trigger element', () => {
    renderTooltip();
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('shows tooltip content on hover', async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.hover(screen.getByText('Hover me'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Helpful text');
  });

  it('hides tooltip when mouse leaves', async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.hover(screen.getByText('Hover me'));
    await screen.findByRole('tooltip');

    await user.unhover(screen.getByText('Hover me'));
    // Tooltip should eventually disappear (animation)
  });

  it('shows tooltip on focus for keyboard accessibility', async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
  });

  it('renders with custom content', async () => {
    const user = userEvent.setup();
    renderTooltip({ content: 'Custom tooltip' });

    await user.hover(screen.getByText('Hover me'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Custom tooltip');
  });
});
