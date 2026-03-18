/**
 * Adapts Next.js route handlers (Request -> Response) to Express (req, res). * When authMiddleware has run and set req.auth, passes the decoded payload via X-Auth-Payload
 * so route handlers can use getAuthFromRequest() without re-validating the token.
 * Passes req.params as { params: Promise<...> } for handlers that expect route params.
 */
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Readable } from 'stream';
import { AUTH_PAYLOAD_HEADER } from './lib/auth.js';

/** Accepts Next.js-style route handlers. Context is always passed; handlers may type params more specifically. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptNextRoute(handler: (request: Request, context?: any) => Promise<any>) {
  return async (expressReq: ExpressRequest, expressRes: ExpressResponse) => {
    try {
      const protocol = expressReq.protocol || 'http';
      const host = expressReq.get('host') || 'localhost:3005';
      const url = `${protocol}://${host}${expressReq.originalUrl}`;

      const headers = new Headers(expressReq.headers as Record<string, string>);
      if (expressReq.auth?.decoded) {
        headers.set(AUTH_PAYLOAD_HEADER, JSON.stringify(expressReq.auth.decoded));
      }
      if (expressReq.requestId) {
        headers.set('X-Request-ID', expressReq.requestId);
      }

      const init: RequestInit = {
        method: expressReq.method,
        headers,
      };

      if (!['GET', 'HEAD'].includes(expressReq.method)) {
        const contentType = expressReq.get('content-type') || '';
        if (contentType.includes('multipart/form-data')) {
          // Convert Node.js IncomingMessage to Web ReadableStream for Fetch API
          init.body = Readable.toWeb(expressReq) as unknown as RequestInit['body'];
        } else if (expressReq.body) {
          init.body = JSON.stringify(expressReq.body);
        }
      }

      const request = new Request(url, init);
      // Attach Next.js-compat props (Request is extensible at runtime)
      const req = request as Request & { cookies?: { get(n: string): string | undefined }; nextUrl?: URL; socket?: unknown };
      const cookieHeader = expressReq.get('cookie') || '';
      const cookieMap = Object.fromEntries(
        cookieHeader.split(';').map((s) => {
          const [k, ...v] = s.trim().split('=');
          return [k, v.join('=').trim()];
        })
      );
      req.cookies = { get: (name: string) => cookieMap[name] };
      req.nextUrl = new URL(url);
      req.socket = (expressReq as ExpressRequest & { socket?: unknown }).socket;
      const context = { params: Promise.resolve((expressReq.params || {}) as Record<string, string>) };
      const response = await handler(request, context);

      const contentType = response.headers.get('content-type');
      const location = response.headers.get('location');
      const text = await response.text();

      expressRes.status(response.status);

      if (response.status >= 300 && response.status < 400 && location) {
        expressRes.redirect(response.status, location);
        return;
      }

      if (contentType?.includes('application/json')) {
        try {
          expressRes.json(JSON.parse(text));
        } catch {
          expressRes.send(text);
        }
      } else {
        // Forward response headers for downloads (e.g. CSV with Content-Disposition)
        response.headers.forEach((value: string, key: string) => {
          if (key.toLowerCase() !== 'content-length') {
            expressRes.setHeader(key, value);
          }
        });
        expressRes.send(text);
      }
    } catch (err) {
      const requestId = expressReq.requestId;
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          requestId,
          level: 'error',
          message: 'Route error',
          error: err instanceof Error ? err.message : String(err),
        })
      );
      expressRes.status(500).json({ error: 'Internal server error' });
    }
  };
}
