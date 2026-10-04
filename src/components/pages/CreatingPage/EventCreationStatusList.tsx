import type { EventStatus, QueuedEventItem } from './types';

export interface EventCreationStatusListProps {
  items: QueuedEventItem[];
}

const ICONS: Record<EventStatus, string> = {
  pending: '\ue9d0',
  success: '\ue86c',
  failed: '\ue000',
};

const EventCreationStatusList = ({ items }: EventCreationStatusListProps) => {
  return (
    <ul className="creating-card__event-list" aria-label="Pending event creations">
      {items.map((item) => (
        <li key={item.id} className={`creating-card__event creating-card__event--${item.status}`}>
          <span className="material-symbols-outlined creating-card__event-icon" aria-hidden="true">
            {ICONS[item.status]}
          </span>
          <span className="creating-card__event-title">
            {/* TODO: Format the event title and start time more nicely */}
            {item.event.summary} @ {item.event.start.dateTime}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default EventCreationStatusList;
