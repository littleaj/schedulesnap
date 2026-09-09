import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import ConfirmPage from './ConfirmPage';

const { loadAnalysisResponseMock, loadDraftConfirmationMock } = vi.hoisted(() => ({
  loadAnalysisResponseMock: vi.fn(),
  loadDraftConfirmationMock: vi.fn(),
}));

vi.mock('@/services/schedule-analysis', () => ({
  loadAnalysisResponse: loadAnalysisResponseMock,
  loadDraftConfirmation: loadDraftConfirmationMock,
}));

describe('ConfirmPage', () => {
  it('renders the cached analysis response when resuming a review', () => {
    loadDraftConfirmationMock.mockReturnValue(null);
    loadAnalysisResponseMock.mockReturnValue({
      scheduleOwnerGuess: 'Alex',
      warnings: ['Year assumed from context'],
      shifts: [
        {
          date: '2026-09-05',
          startTime: '09:00',
          endTime: '17:00',
          confidence: 0.9,
          rawText: 'Sep 5 9:00 AM - 5:00 PM',
        },
      ],
    });

    render(
      <MemoryRouter>
        <ConfirmPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /review your extracted shifts/i })).toBeInTheDocument();
    expect(screen.getByText(/1 extracted shift/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-09-05 09:00 - 17:00/i)).toBeInTheDocument();
  });

  it('falls back to capture when no cached review exists', () => {
    loadDraftConfirmationMock.mockReturnValue(null);
    loadAnalysisResponseMock.mockReturnValue(null);

    render(
      <MemoryRouter>
        <ConfirmPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/no saved review was found/i)).toBeInTheDocument();
  });
});
