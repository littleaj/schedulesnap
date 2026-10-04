import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CreationProgressBar from './CreationProgressBar';

describe('CreationProgressBar', () => {
  it('renders the progress bar and percentage while creation is in progress', () => {
    render(<CreationProgressBar percent={65} isFinished={false} />);

    const progress = screen.getByRole('progressbar', { name: /creation progress/i });
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveAttribute('max', '100');
    expect(progress).toHaveAttribute('value', '65');
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('shows a completion message instead of the progress bar when finished', () => {
    render(<CreationProgressBar percent={100} isFinished />);

    expect(screen.queryByRole('progressbar', { name: /creation progress/i })).not.toBeInTheDocument();
    expect(screen.getByText('Creation complete.')).toBeInTheDocument();
  });

  it('renders the success output even if percent is not 100 when finished', () => {
    render(<CreationProgressBar percent={42} isFinished />);

    expect(screen.getByText('Creation complete.')).toBeInTheDocument();
    expect(screen.queryByText('42%')).not.toBeInTheDocument();
  });
});
