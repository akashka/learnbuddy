const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function api(path: string, options?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('token');
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
}

export async function apiJson<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await api(path, options);
  const data = await res.json();
  if (!res.ok) {
    const msg = (data as { error?: string }).error || 'Request failed';
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

export interface PageContentResponse {
  pageType: string;
  sections: Record<string, unknown>;
}

export async function fetchPageContent(page: string): Promise<PageContentResponse> {
  return apiJson<PageContentResponse>(`/api/website/page-content?page=${encodeURIComponent(page)}`);
}

export { API_BASE };
