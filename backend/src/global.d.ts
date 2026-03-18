/**
 * Augment Fetch API Body.json() for route handlers that parse request body.
 */
declare global {
  interface Body {
    json(): Promise<Record<string, unknown>>;
  }
}

export {};
