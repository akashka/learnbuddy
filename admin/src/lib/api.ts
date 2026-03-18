const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';

export function api(path: string, options?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('token');
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
}

export async function apiJson<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await api(path, options);
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(res.ok ? 'Invalid response' : (text || `Request failed (${res.status})`));
  }
  if (!res.ok) throw new Error((data as { error?: string })?.error || text || `Request failed (${res.status})`);
  return data as T;
}

/** For multipart/form-data uploads - do not set Content-Type */
export function apiUpload(path: string, formData: FormData): Promise<Response> {
  const token = localStorage.getItem('token');
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
}

export { API_BASE };
