/**
 * Compatibility layer for Next.js Request/Response in Express adapter
 */
/// <reference path="../global.d.ts" />

declare global {
  interface Body {
    json(): Promise<any>;
  }
}

export type NextRequest = Request;

/** Typed request body - use instead of request.json() to avoid "Property X does not exist" errors */
export async function getBody<T = any>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

function formatCookie(name: string, value: string, options?: Record<string, unknown>): string {
  let s = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  if (options?.maxAge) s += `; Max-Age=${options.maxAge}`;
  if (options?.httpOnly) s += '; HttpOnly';
  if (options?.secure) s += '; Secure';
  if (options?.sameSite) s += `; SameSite=${options.sameSite}`;
  if (options?.path) s += `; Path=${options.path}`;
  return s;
}

export type NextResponseType = Response & {
  cookies?: { set(name: string, value: string, opts?: Record<string, unknown>): void };
};

export const NextResponse = {
  json: (data: unknown, init?: { status?: number }): NextResponseType => {
    const res = Response.json(data, { status: init?.status ?? 200 }) as NextResponseType;
    res.cookies = {
      set: (name, value, opts) => res.headers.append('Set-Cookie', formatCookie(name, value, opts)),
    };
    return res;
  },
  /** Create a Response with custom body (e.g. CSV string, binary) and headers */
  body: (
    body: string | Blob | ArrayBuffer,
    init?: { status?: number; headers?: Record<string, string> }
  ) => {
    const headers = new Headers(init?.headers);
    return new Response(body, { status: init?.status ?? 200, headers });
  },
  /** Redirect to URL (302 by default) */
  redirect: (url: string, status?: number) =>
    new Response(null, { status: status ?? 302, headers: { Location: url } }),
};
