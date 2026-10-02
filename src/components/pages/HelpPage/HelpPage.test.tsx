import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import HelpPage from './HelpPage';

describe('HelpPage', () => {
  it('renders the help content and common workflow details', () => {
    render(
      <MemoryRouter>
        <HelpPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /help & faqs/i })).toBeInTheDocument();
    expect(screen.getByText(/capture your schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/review your shifts/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });
});
