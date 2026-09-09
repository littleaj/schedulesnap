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
          role: 'Barista',
          location: 'Downtown',
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
    expect(screen.getByRole('list', { name: /weekly schedule/i })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByText(new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date('2026-09-05T00:00:00')))).toBeInTheDocument();
    expect(screen.getByText(new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date('2026-09-05T09:00:00')) + ' - ' + new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date('2026-09-05T17:00:00')))).toBeInTheDocument();
    expect(screen.getByText('Barista')).toBeInTheDocument();
    expect(screen.getByText('Downtown')).toBeInTheDocument();
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
