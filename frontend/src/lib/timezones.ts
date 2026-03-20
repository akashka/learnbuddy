/**
 * Common timezones for the Settings dropdown.
 * Uses IANA timezone identifiers (e.g. Asia/Kolkata).
 */
export const TIMEZONES: { value: string; label: string }[] = [
  { value: 'Asia/Kolkata', label: 'India (IST, UTC+5:30)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST, UTC+4)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT, UTC+8)' },
  { value: 'America/New_York', label: 'Eastern (EST/EDT, UTC-5/-4)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PST/PDT, UTC-8/-7)' },
  { value: 'Europe/London', label: 'London (GMT/BST, UTC+0/+1)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST, UTC+1/+2)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT, UTC+10/+11)' },
  { value: 'UTC', label: 'UTC' },
];

/** Get browser's current timezone */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}
