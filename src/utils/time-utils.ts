
export const convertTo24Hour = (timeValue: string): string => {
  if (!timeValue?.trim()) {
    return '';
  }

  const trimmedValue = timeValue.trim();
  const match = (/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i).exec(trimmedValue);

  if (!match) {
    return trimmedValue;
  }

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2] ?? '0', 10);
  const modifier = match[3]?.toLowerCase();

  if (modifier === 'pm' && hours < 12) {
    hours += 12;
  }

  if (modifier === 'am' && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const getWeekStartDate = (date: Date) => {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const localeInfo = typeof Intl.Locale === 'function' ? new Intl.Locale(locale) : null;
  const weekInfo = typeof localeInfo?.getWeekInfo === 'function' ? localeInfo.getWeekInfo() : null;
  const firstDay = weekInfo?.firstDay ?? (locale.toLowerCase().startsWith('en-us') ? 7 : 1);
  const currentDay = date.getDay() === 0 ? 7 : date.getDay();
  const offset = (currentDay - firstDay + 7) % 7;

  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - offset);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

