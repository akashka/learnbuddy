/**
 * Shared formatting standards for GuruChakra.
 * Use across frontend, admin, app, website, backend, and emails.
 *
 * Standards:
 * - Date: dd mmm yyyy (e.g. 20 Mar 2025)
 * - Time: 12-hour format hh:mm AM/PM (or hh:mm:ss when seconds needed)
 * - DateTime: dd mmm yyyy, hh:mm AM/PM
 * - Currency: INR with Indian locale
 * - Numbers: Indian locale (lakhs, crores)
 */

const LOCALE = 'en-IN';

/** Format date as dd mmm yyyy (e.g. 20 Mar 2025) */
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

/** Format time as 12-hour hh:mm AM/PM (or hh:mm:ss when includeSeconds) */
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

/** Format date and time: dd mmm yyyy, hh:mm AM/PM */
export function formatDateTime(
  date: string | Date | null | undefined,
  includeSeconds = false
): string {
  if (date == null) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  const dateStr = formatDate(d);
  const timeStr = formatTime(d, includeSeconds);
  return `${dateStr}, ${timeStr}`;
}

/** Relative time for recent items; falls back to formatDate for older */
export function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (isNaN(d.getTime())) return '—';
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

/** Format currency (INR) */
export function formatCurrency(amount: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: maxFractionDigits,
  }).format(amount);
}

/** Format number with Indian locale */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat(LOCALE).format(n);
}

/** Format percentage */
export function formatPercent(value: number, decimals = 1): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/** Format phone number (Indian format: +91 98765 43210) */
export function formatPhone(phone: string | null | undefined): string {
  if (phone == null || phone === '') return '—';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return digits.length > 0 ? `+91 ${digits.slice(-10).padStart(10, '0').replace(/(\d{5})(\d{5})/, '$1 $2')}` : '—';
}

/** Format file size (e.g. "2.5 MB", "1.2 GB") */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const v = bytes / Math.pow(k, i);
  return `${v % 1 === 0 ? v : v.toFixed(1)} ${sizes[i]}`;
}

/** Format duration in seconds (e.g. "1h 30m", "15m 45s", "45s") */
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

/** Format duration in milliseconds (e.g. "1.2s", "45ms") */
export function formatDurationMs(ms: number): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return formatDuration(ms / 1000);
}
