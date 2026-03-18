const STORAGE_KEY = 'admin_table_prefs';

export type ColumnPref = Record<string, boolean>;

export function getColumnPreferences(pageKey: string, userId?: string): ColumnPref | null {
  try {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, ColumnPref>;
    return all[pageKey] ?? null;
  } catch {
    return null;
  }
}

export function setColumnPreferences(pageKey: string, prefs: ColumnPref, userId?: string): void {
  try {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    const raw = localStorage.getItem(key);
    const all = raw ? (JSON.parse(raw) as Record<string, ColumnPref>) : {};
    all[pageKey] = prefs;
    localStorage.setItem(key, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function getVisibleColumns(
  pageKey: string,
  allColumns: string[],
  userId?: string
): string[] {
  const saved = getColumnPreferences(pageKey, userId);
  if (!saved) return allColumns;
  return allColumns.filter((col) => saved[col] !== false);
}
