import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import AboutPage from './AboutPage';

describe('AboutPage', () => {
  it('renders the story, tech stack, and support link', () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /about schedule snap/i })).toBeInTheDocument();
    expect(screen.getByText(/i was tired of entering my schedule into google calendar/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /tech stack/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /looking for help\?/i })).toBeInTheDocument();
  });
});
