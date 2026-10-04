import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EventCreationStatusList from './EventCreationStatusList';
import type { QueuedEventItem } from './types';

const buildItem = (id: string, summary: string, startDateTime: string, status: QueuedEventItem['status']): QueuedEventItem => ({
  id,
  status,
  event: {
    summary,
    start: {
      dateTime: startDateTime,
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: `${startDateTime.replace('09:00:00', '17:00:00').replace('18:00:00', '22:00:00')}`,
      timeZone: 'America/New_York',
    },
  },
});

describe('EventCreationStatusList', () => {
  it('renders each queued event with its summary and start time', () => {
    const items = [
      buildItem('shift-1', 'Morning Shift', '2026-10-01T09:00:00-04:00', 'pending'),
      buildItem('shift-2', 'Evening Shift', '2026-10-02T18:00:00-04:00', 'success'),
    ];

    render(<EventCreationStatusList items={items} />);

    const list = screen.getByRole('list', { name: /pending event creations/i });
    expect(list).toBeInTheDocument();
    expect(screen.getByText('Morning Shift @ 2026-10-01T09:00:00-04:00')).toBeInTheDocument();
    expect(screen.getByText('Evening Shift @ 2026-10-02T18:00:00-04:00')).toBeInTheDocument();
  });

  it('applies the correct status class for each event row', () => {
    const items = [
      buildItem('shift-pending', 'Pending Shift', '2026-10-03T09:00:00-04:00', 'pending'),
      buildItem('shift-success', 'Success Shift', '2026-10-03T10:00:00-04:00', 'success'),
      buildItem('shift-failed', 'Failed Shift', '2026-10-03T11:00:00-04:00', 'failed'),
    ];

    const { container } = render(<EventCreationStatusList items={items} />);
    const rows = container.querySelectorAll('.creating-card__event');

    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveClass('creating-card__event--pending');
    expect(rows[1]).toHaveClass('creating-card__event--success');
    expect(rows[2]).toHaveClass('creating-card__event--failed');
  });

  it('renders an empty list when no items exist', () => {
    render(<EventCreationStatusList items={[]} />);

    const list = screen.getByRole('list', { name: /pending event creations/i });
    expect(list).toBeInTheDocument();
    expect(list.querySelectorAll('li')).toHaveLength(0);
  });
});
