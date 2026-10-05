import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserMessageProvider } from './user-message';
import useUserMessage from '@/hooks/user-message';

const MessageTrigger = () => {
  const { showToast, showModal } = useUserMessage();

  return (
    <>
      <button
        type="button"
        onClick={() => showToast({
          content: <span>Calendar write failed after 3 attempts. Try again in a moment.</span>,
          variant: 'error',
          title: 'Save failed',
        })}
      >
        Show toast
      </button>
      <button
        type="button"
        onClick={() => showToast({
          content: 'OAuth scope was declined. Review requested permissions and retry sign in.',
          variant: 'warning',
          timeoutMs: 1000,
        })}
      >
        Show short toast
      </button>
      <button
        type="button"
        onClick={() => {
          showToast({
            content: 'Queued toast appears first.',
            variant: 'information',
            timeoutMs: 1000,
          });
          showModal({
            title: 'Permission required',
            heading: 'Camera permission is required to take a schedule photo.',
            content: 'Open browser settings and allow camera access.',
            variant: 'error',
            actionLabels: ['Open settings'],
          });
        }}
      >
        Queue toast and modal
      </button>
      <button
        type="button"
        onClick={() => showModal({
          title: 'Session expired',
          heading: 'Token expired while saving events.',
          content: <strong>Sign in again and retry saving.</strong>,
          variant: 'error',
          actionLabels: ['Sign in again'],
        })}
      >
        Show modal
      </button>
    </>
  );
};

describe('UserMessageProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders caller-provided toast ReactNode content and variant class', () => {
    render(
      <UserMessageProvider>
        <MessageTrigger />
      </UserMessageProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /show toast/i }));

    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('Calendar write failed after 3 attempts. Try again in a moment.');
    expect(toast.className).toContain('message-toast');
    expect(toast.className).toContain('error');
    expect(screen.getByText('Save failed')).toBeInTheDocument();
  });

  it('auto-dismisses toast using per-call timeout', () => {
    vi.useFakeTimers();

    render(
      <UserMessageProvider>
        <MessageTrigger />
      </UserMessageProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /show short toast/i }));

    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('OAuth scope was declined.');
    expect(screen.queryByText('Save failed')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('queues toast and modal messages in one FIFO queue', () => {
    vi.useFakeTimers();

    render(
      <UserMessageProvider>
        <MessageTrigger />
      </UserMessageProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /queue toast and modal/i }));

    expect(screen.getByRole('status')).toHaveTextContent('Queued toast appears first.');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('alertdialog')).toHaveTextContent('Camera permission is required to take a schedule photo.');
    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
  });

  it('renders string title/heading and ReactNode content for modal', () => {
    render(
      <UserMessageProvider>
        <MessageTrigger />
      </UserMessageProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /show modal/i }));

    expect(screen.getByRole('alertdialog')).toHaveTextContent('Session expired');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Token expired while saving events.');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Sign in again and retry saving.');

    fireEvent.click(screen.getByRole('button', { name: /sign in again/i }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
