export function formatDateLabel(date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getDateSeed(date = new Date()): number {
  return date.getDate() + (date.getMonth() + 1) * 31 + (date.getFullYear() % 100);
}

export function dateMetric(min: number, max: number, offset = 0, date = new Date()): number {
  const seed = getDateSeed(date) + offset * 17;
  return min + (seed % (max - min + 1));
}

export function dateFloat(min: number, max: number, offset = 0, precision = 1, date = new Date()): string {
  const range = Math.round((max - min) * 10);
  const seed = getDateSeed(date) + offset * 11;
  const value = min + ((seed % (range + 1)) / 10);
  return value.toFixed(precision);
}

export function trafficLevelFromDate(date = new Date()): string {
  const values = ['Low', 'Moderate', 'High', 'Severe'];
  return values[getDateSeed(date) % values.length];
}

export function formattedMinutesAgo(date = new Date()): string {
  const minutes = 1 + ((getDateSeed(date) + 4) % 9);
  return `${minutes} min ago`;
}

export function dateBasedPlaces(base: number, id: number, date = new Date()): number {
  const factor = (getDateSeed(date) + id * 7) % 40;
  return Math.max(5, base + factor - 10);
}

export function dateBasedLevel(date = new Date(), id = 0): number {
  const level = 1 + ((getDateSeed(date) + id * 3) % 8);
  return Math.min(8, Math.max(1, level));
}
