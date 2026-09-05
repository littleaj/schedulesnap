import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FeatureCard from './FeatureCard';

describe('FeatureCard', () => {
  it('renders icon, heading, and body content inside a card', () => {
    const { container } = render(
      <FeatureCard icon="📸" heading="Photo to schedule">
        <p>Upload a shift image and let the app read the details from the photo.</p>
      </FeatureCard>,
    );

    expect(screen.getByText('📸')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Photo to schedule' })).toBeInTheDocument();
    expect(
      screen.getByText('Upload a shift image and let the app read the details from the photo.'),
    ).toBeInTheDocument();
    expect(container.querySelector('article.card')).toBeInTheDocument();
  });
});