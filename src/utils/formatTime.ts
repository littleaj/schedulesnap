/**
 * Format a time string to the current locale's default time format.
 * Assumes the input is in HH:MM or HH:MM:SS format.
 */
export const formatTimeToLocale = (timeString: string | undefined): string => {
  if (!timeString) return '??';

  try {
    // Parse the time string (HH:MM or HH:MM:SS)
    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    // Validate parsed values
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return timeString;
    }

    // Create a date object with the time (date doesn't matter for time formatting)
    const date = new Date();
    date.setHours(hours, minutes, 0);

    // Format using the browser's locale
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return timeString;
  }
};
