export function formatISODate(isoDate) {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,  // Optional, for 12-hour format
    }).format(new Date(isoDate));
  }
  