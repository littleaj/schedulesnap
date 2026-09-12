import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EditableText from './EditableText';

describe('EditableText', () => {
  it('shows text, enters edit mode on double click, and confirms with Enter or OK', () => {
    const onCommit = vi.fn();

    render(
      <EditableText
        value="09:00 AM"
        placeholder="Start time"
        ariaLabel="Start time"
        onCommit={onCommit}
      />,
    );

    expect(screen.getByText('09:00 AM')).toBeInTheDocument();

    fireEvent.doubleClick(screen.getByRole('button', { name: /start time/i }));

    const input = screen.getByLabelText(/start time/i);
    fireEvent.change(input, { target: { value: '10:15 AM' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onCommit).toHaveBeenCalledWith('10:15 AM');
  });

  it('shows a placeholder when empty and cancels with Escape or the cancel button', () => {
    const onCommit = vi.fn();

    render(
      <EditableText
        value=""
        placeholder="Role"
        ariaLabel="Role"
        onCommit={onCommit}
      />,
    );

    expect(screen.getByPlaceholderText('Role')).toBeInTheDocument();

    const input = screen.getByLabelText(/role/i);
    fireEvent.change(input, { target: { value: 'Cashier' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('Role')).toBeInTheDocument();
  });
});
