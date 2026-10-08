import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import WorkflowBreadcrumbs from './WorkflowBreadcrumbs';

const renderAt = (pathname: string) =>
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <WorkflowBreadcrumbs />
    </MemoryRouter>,
  );

describe('WorkflowBreadcrumbs', () => {
  it.each(['/capture', '/analyze', '/confirm', '/creating'])(
    'renders on the %s workflow route',
    (pathname) => {
      renderAt(pathname);

      expect(screen.getByLabelText(/workflow progress/i)).toBeInTheDocument();
    },
  );

  it('does not render on non-workflow routes', () => {
    renderAt('/login');

    expect(screen.queryByLabelText(/workflow progress/i)).not.toBeInTheDocument();
  });

  it('shows connect google as completed when snap photo is the current step', () => {
    renderAt('/capture');

    const progress = screen.getByLabelText(/workflow progress/i);
    const connectStep = within(progress).getByText('Connect Google');
    const snapPhotoStep = within(progress).getByText('Snap Photo');
    const analyzeStep = within(progress).getByText('Analyze');

    expect(connectStep).toHaveAttribute('data-state', 'completed');
    expect(snapPhotoStep).toHaveAttribute('data-state', 'active');
    expect(snapPhotoStep).toHaveAttribute('aria-current', 'step');
    expect(analyzeStep).toHaveAttribute('data-state', 'upcoming');
    expect(within(progress).queryAllByRole('link')).toHaveLength(0);
  });
});
