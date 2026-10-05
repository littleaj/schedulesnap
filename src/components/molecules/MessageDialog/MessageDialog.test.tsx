import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MessageDialog from './MessageDialog';

describe('MessageDialog', () => {
  it('renders the title, heading, content, and provided action buttons', () => {
    render(
      <MessageDialog
        title="Permission required"
        heading="Camera permission is required."
        content="Open browser settings and allow camera access."
        variant="error"
        actionLabels={['Open settings', 'Cancel']}
        onAcknowledge={() => undefined}
      />
    );

    expect(screen.getByRole('alertdialog')).toHaveTextContent('Permission required');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Camera permission is required.');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Open browser settings and allow camera access.');
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onAcknowledge with the selected label when an action is clicked', () => {
    const onAcknowledge = vi.fn();

    render(
      <MessageDialog
        title="Session expired"
        heading="Token expired while saving events."
        content="Sign in again and retry saving."
        variant="warning"
        actionLabels={['Sign in again', 'Dismiss']}
        onAcknowledge={onAcknowledge}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign in again' }));
    expect(onAcknowledge).toHaveBeenCalledWith('Sign in again');
  });

  it('calls onAcknowledge(null) and hides the close button when closeable is false', () => {
    const onAcknowledge = vi.fn();

    render(
      <MessageDialog
        title="Unsaved changes"
        heading="There are unsaved edits."
        content="Leave without saving?"
        variant="information"
        closeable={false}
        onAcknowledge={onAcknowledge}
      />
    );

    const closeButton = document.querySelector('button[aria-label="Close message"]');
    expect(closeButton).toHaveAttribute('hidden');
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onAcknowledge).toHaveBeenCalledWith('OK');
  });
});
