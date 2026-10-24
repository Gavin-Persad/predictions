// Formats e.g. "Fri 12pm" in UK time so every player sees the same value.
export function formatUkDayTime(iso: string): string {
  const formatted = new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return formatted.replace(':00 ', ' ').toLowerCase();
}
