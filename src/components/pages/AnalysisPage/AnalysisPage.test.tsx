import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import AnalysisPage from './AnalysisPage';

describe('AnalysisPage', () => {
  it('renders the loading state and analysis actions', () => {
    render(
      <MemoryRouter>
        <AnalysisPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /analyzing your schedule/i })).toBeInTheDocument();
    expect(screen.getByText(/reading your schedule photo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to capture/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue to review/i })).toBeInTheDocument();
  });
});
