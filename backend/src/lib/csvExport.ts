/**
 * CSV export utilities for admin export endpoints.
 * Escapes values for CSV (quotes, commas, newlines).
 */
export function escapeCsvValue(val: unknown): string {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function toCsvRow(values: unknown[]): string {
  return values.map(escapeCsvValue).join(',');
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => toCsvRow(r)).join('\n');
}

export function pickFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[],
  fieldLabels?: Record<string, string>
): string[] {
  return fields.map((f) => {
    const val = obj[f];
    if (val != null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      const sub = val as Record<string, unknown>;
      if (sub._id) return String(sub._id);
      if (sub.email) return String(sub.email);
      if (sub.name) return String(sub.name);
      return JSON.stringify(val);
    }
    if (val instanceof Date) return val.toISOString();
    return val == null ? '' : String(val);
  });
}
