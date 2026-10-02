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

    expect(screen.getByRole('heading', { name: /about schedulesnap/i })).toBeInTheDocument();
  });
});
