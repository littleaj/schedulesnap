export const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
});

export const monthDayFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

export const timeFormatter = new Intl.DateTimeFormat(undefined, {
  timeStyle: 'short',
});

export const toLocalDate = (date: string) => new Date(`${date}T00:00:00`);

export const toLocalIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const formatWeekday = (date: Date) => weekdayFormatter.format(date);

export const formatMonthDay = (date: Date) => monthDayFormatter.format(date);

export const formatTime = (time: string) => {
  if (!time?.trim()) {
    return '';
  }
  return timeFormatter.format(new Date(`1970-01-01T${time}`));
};

