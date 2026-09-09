import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CapturePage from './CapturePage';

describe('CapturePage', () => {
  it('renders the upload instructions and file input', () => {
    render(<CapturePage />);

    expect(screen.getByRole('heading', { name: /upload your schedule photo/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/choose a schedule photo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload photo/i })).toBeInTheDocument();
  });

  it('shows the selected file and enables review when an image is chosen', () => {
    render(<CapturePage />);

    const input = screen.getByLabelText(/choose a schedule photo/i) as HTMLInputElement;

    fireEvent.change(input, {
      target: {
        files: [new File(['test'], 'schedule.png', { type: 'image/png' })],
      },
    });

    expect(screen.getByText(/schedule\.png/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue to review/i })).toBeEnabled();
  });
});
