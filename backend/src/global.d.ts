/**
 * Type augmentations for Express-adapted Fetch API in route handlers.
 * Request/Response get cookies, nextUrl, socket for Next.js compatibility.
 * Body.json() is augmented in next-compat.ts (imported by all routes).
 */
declare global {
  interface Request {
    cookies?: { get(name: string): string | undefined };
    nextUrl?: URL;
    socket?: unknown;
  }
  interface Response {
    cookies?: { set(name: string, value: string, options?: Record<string, unknown>): void };
  }
}

export {};
