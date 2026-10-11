import React, { useEffect } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('dismisses an active toast when the close button is clicked', () => {
    vi.useFakeTimers();

    render(
      <UserMessageProvider>
        <MessageTrigger />
      </UserMessageProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /show short toast/i }));
    expect(screen.getByRole('status')).toHaveTextContent('OAuth scope was declined.');

    fireEvent.click(screen.getByRole('button', { name: /close toast/i }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders active toast and modal at the same time', () => {
    vi.useFakeTimers();

    render(
      <UserMessageProvider>
        <MessageTrigger />
      </UserMessageProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /queue toast and modal/i }));

    expect(screen.getByRole('status')).toHaveTextContent('Queued toast appears first.');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Camera permission is required to take a schedule photo.');
    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Camera permission is required to take a schedule photo.');
  });

  it('resolves the modal promise with the selected action label', async () => {
    const resolvedLabel: { current: string | null | undefined } = { current: undefined };

    const AutoModalTrigger = () => {
      const { showModal } = useUserMessage();

      useEffect(() => {
        void showModal({
          title: 'Session expired',
          heading: 'Token expired while saving events.',
          content: 'Sign in again and retry saving.',
          variant: 'error',
          actionLabels: ['Sign in again'],
        }).then((label) => {
          resolvedLabel.current = label;
        });
      }, [showModal]);

      return null;
    };

    render(
      <UserMessageProvider>
        <AutoModalTrigger />
      </UserMessageProvider>
    );

    expect(screen.getByRole('alertdialog')).toHaveTextContent('Session expired');

    fireEvent.click(screen.getByRole('button', { name: /sign in again/i }));

    await waitFor(() => {
      expect(resolvedLabel.current).toBe('Sign in again');
    });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
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

  it('calls onShow when the modal is displayed', async () => {
    const onShow = vi.fn();

    const AutoModalTrigger = () => {
      const { showModal } = useUserMessage();

      useEffect(() => {
        void showModal({
          title: 'Session expired',
          heading: 'Token expired while saving events.',
          content: 'Sign in again and retry saving.',
          variant: 'error',
          actionLabels: ['Sign in again'],
          onShow,
        });
      }, [showModal]);

      return null;
    };

    render(
      <UserMessageProvider>
        <AutoModalTrigger />
      </UserMessageProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toHaveTextContent('Session expired');
      expect(onShow).toHaveBeenCalledTimes(1);
    });
  });
});
