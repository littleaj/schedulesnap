import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorProvider } from './error';
import useError from '@/hooks/error';

const retryAction = vi.fn();

const ErrorTrigger = () => {
  const { showToast, showModal } = useError();

  return (
    <>
      <button
        type="button"
        onClick={() => showToast({
          message: 'Calendar write failed after 3 attempts.',
          action: 'Try again in a moment.',
          actionLabel: 'Retry',
          onAction: retryAction,
        })}
      >
        Show toast
      </button>
      <button
        type="button"
        onClick={() => showToast({
          message: 'OAuth scope was declined.',
          action: 'Review requested permissions and retry sign in.',
          timeoutMs: 1000,
        })}
      >
        Show short toast
      </button>
      <button
        type="button"
        onClick={() => {
          showModal({
            message: 'Camera permission is required to take a schedule photo.',
            action: 'Open browser settings and allow camera access.',
            acknowledgeLabel: 'Open settings',
          });
          showModal({
            message: 'Token expired while saving events.',
            action: 'Sign in again and retry saving.',
            acknowledgeLabel: 'Sign in again',
          });
        }}
      >
        Queue modals
      </button>
    </>
  );
};

describe('ErrorProvider', () => {
  afterEach(() => {
    retryAction.mockReset();
    vi.useRealTimers();
  });

  it('renders caller-provided toast message/action with optional action button', () => {
    render(
      <ErrorProvider>
        <ErrorTrigger />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /show toast/i }));

    expect(screen.getByRole('status')).toHaveTextContent('Calendar write failed after 3 attempts.');
    expect(screen.getByRole('status')).toHaveTextContent('Try again in a moment.');

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(retryAction).toHaveBeenCalledTimes(1);
  });


  it('auto-dismisses toast with the default timeout when none is provided', () => {
    vi.useFakeTimers();

    render(
      <ErrorProvider>
        <ErrorTrigger />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /show toast/i }));
    expect(screen.getByRole('status')).toHaveTextContent('Calendar write failed after 3 attempts.');

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('auto-dismisses toast using per-call timeout', () => {
    vi.useFakeTimers();

    render(
      <ErrorProvider>
        <ErrorTrigger />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /show short toast/i }));

    expect(screen.getByRole('status')).toHaveTextContent('OAuth scope was declined.');

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('queues blocking modal errors until the current modal is acknowledged', () => {
    render(
      <ErrorProvider>
        <ErrorTrigger />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /queue modals/i }));

    expect(screen.getByRole('alertdialog')).toHaveTextContent('Camera permission is required to take a schedule photo.');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Open browser settings and allow camera access.');
    expect(screen.queryByText('Token expired while saving events.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open settings/i }));

    expect(screen.getByRole('alertdialog')).toHaveTextContent('Token expired while saving events.');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Sign in again and retry saving.');
  });
});
