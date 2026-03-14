/**
 * Shared type definitions for the min-express framework.
 */

import type { IncomingMessage, ServerResponse } from "node:http";

/** Supported HTTP methods */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

/** Next function passed to middleware */
export type NextFunction = (err?: unknown) => void;

/** Standard request handler */
export type RequestHandler = (
  req: MinRequest,
  res: MinResponse,
  next: NextFunction
) => void | Promise<void>;

/** Error-handling middleware (4 arguments) */
export type ErrorHandler = (
  err: unknown,
  req: MinRequest,
  res: MinResponse,
  next: NextFunction
) => void | Promise<void>;

/** A middleware can be either a normal handler or an error handler */
export type Middleware = RequestHandler | ErrorHandler;

/** A compiled route entry */
export interface Route {
  method: HttpMethod | "*";
  pattern: string;
  keys: string[];
  regex: RegExp;
  handlers: RequestHandler[];
}

/** Parsed path-to-regex result */
export interface ParsedPath {
  regex: RegExp;
  keys: string[];
}

// ─── Request & Response (forward declarations) ───────────────────────

/** MinRequest — will be implemented in request.ts */
export interface MinRequest extends IncomingMessage {
  /** HTTP method (uppercase) */
  method: string;
  /** URL pathname without query string */
  path: string;
  /** Parsed query string parameters */
  query: Record<string, string | string[]>;
  /** Route parameters (e.g. { id: "123" }) */
  params: Record<string, string>;
  /** Parsed request body (populated by body-parsing middleware) */
  body: unknown;
}

/** MinResponse — will be implemented in response.ts */
export interface MinResponse extends ServerResponse {
  /** Set the HTTP status code. Returns `this` for chaining. */
  status(code: number): MinResponse;
  /** Send a JSON response */
  json(data: unknown): void;
  /** Smart send: string → text/html, object → json, Buffer → binary */
  send(data: unknown): void;
  /** Set a response header. Returns `this` for chaining. */
  set(field: string, value: string): MinResponse;
  /** Send a redirect response */
  redirect(url: string, statusCode?: number): void;
}
