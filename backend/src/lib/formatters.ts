/**
 * Formatting standards for backend (API responses, emails, CSV exports).
 * Mirrors shared/formatters.ts - keep in sync.
 *
 * Standards: dd mmm yyyy, 12-hour time, INR currency, Indian locale.
 */

const LOCALE = 'en-IN';

export function formatDate(date: string | Date | null | undefined): string {
  if (date == null) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(
  date: string | Date | null | undefined,
  includeSeconds = false
): string {
  if (date == null) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  });
}

export function formatDateTime(
  date: string | Date | null | undefined,
  includeSeconds = false
): string {
  if (date == null) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return `${formatDate(d)}, ${formatTime(d, includeSeconds)}`;
}

export function formatCurrency(amount: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: maxFractionDigits,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(LOCALE).format(n);
}

export function formatPhone(phone: string | null | undefined): string {
  if (phone == null || phone === '') return '—';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return digits.length > 0 ? `+91 ${digits.slice(-10).padStart(10, '0').replace(/(\d{5})(\d{5})/, '$1 $2')}` : '—';
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const v = bytes / Math.pow(k, i);
  return `${v % 1 === 0 ? v : v.toFixed(1)} ${sizes[i]}`;
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0 || !Number.isFinite(totalSeconds)) return '0s';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

export function formatDurationMs(ms: number): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return formatDuration(ms / 1000);
}
