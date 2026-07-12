/** "12 Jul 2026, 14:05" — locale-aware, compact. */
export function formatDateTime(epochMs: number): string {
  return new Date(epochMs).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "12 Jul 2026" — accepts epoch ms or an ISO yyyy-mm-dd string. */
export function formatDate(value: number | string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Local-timezone ISO date, yyyy-mm-dd. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
