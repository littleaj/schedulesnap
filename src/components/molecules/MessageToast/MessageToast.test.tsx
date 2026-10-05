import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MessageToast from './MessageToast';

describe('MessageToast', () => {
  it('renders its title, content, and dismiss button', () => {
    render(
      <MessageToast
        title="Save failed"
        content="Calendar write failed after 3 attempts."
        variant="error"
        onDismiss={() => undefined}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent('Save failed');
    expect(screen.getByRole('status')).toHaveTextContent('Calendar write failed after 3 attempts.');
    expect(screen.getByRole('button', { name: /close toast/i })).toBeInTheDocument();
  });

  it('calls onDismiss when the close button is clicked', () => {
    const onDismiss = vi.fn();

    render(
      <MessageToast
        title="Save failed"
        content="Calendar write failed after 3 attempts."
        variant="warning"
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /close toast/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
