/**
 * Compatibility layer for Next.js Request/Response in Express adapter
 */
export type NextRequest = Request;

export const NextResponse = {
  json: (data: unknown, init?: { status?: number }) =>
    Response.json(data, { status: init?.status ?? 200 }),
  /** Create a Response with custom body (e.g. CSV string) and headers */
  body: (
    body: string | Blob | ArrayBuffer,
    init?: { status?: number; headers?: Record<string, string> }
  ) => {
    const headers = new Headers(init?.headers);
    return new Response(body, { status: init?.status ?? 200, headers });
  },
};
