import http, { IncomingMessage, ServerResponse } from "node:http";
import { extendRequest } from "./request.js";
import { extendResponse } from "./response.js";
import { Router } from "./router.js";
import { Middleware, ErrorHandler, RequestHandler, MinRequest, MinResponse } from "./types.js";

export class Application extends Router {
  private server = http.createServer((req, res) =>
    this.handleRequest(req, res)
  );

  listen(port: number, callback?: () => void) {
    this.server.listen(port, callback);
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse) {
    const request = extendRequest(req);
    const response = extendResponse(res);

    // Build the flat pipeline from the middleware stack + matched route
    const pipeline: Middleware[] = this.buildPipeline(request, response);

    let index = 0;

    const dispatch = (err?: unknown) => {
      if (index >= pipeline.length) {
        if (err) {
          response.status(500).json({
            error: err instanceof Error ? err.message : String(err),
          });
        } else if (!response.writableEnded) {
          response.status(404).json({
            error: "Not found",
            path: request.path,
            method: request.method,
          });
        }
        return;
      }

      const currentMiddleware = pipeline[index++];

      try {
        if (err) {
          if (currentMiddleware.length === 4) {
            (currentMiddleware as ErrorHandler)(err, request, response, dispatch);
          } else {
            dispatch(err);
          }
        } else {
          if (currentMiddleware.length === 4) {
            dispatch();
          } else {
            (currentMiddleware as RequestHandler)(request, response, dispatch);
          }
        }
      } catch (syncErr) {
        dispatch(syncErr);
      }
    };

    dispatch();
  }

  /**
   * Walk the middleware stack (which can contain plain middleware or mounted
   * Routers), expand sub-routers into their constituent handlers, then append
   * the matched route's handlers.
   */
  private buildPipeline(request: MinRequest, _response: MinResponse): Middleware[] {
    const pipeline: Middleware[] = [];
    let routeMatched = false;

    // Recursively expand a Router at a given mount prefix
    const expandRouter = (router: Router, mountPrefix: string) => {
      for (const entry of router.getMiddlewareStack()) {
        const entryPrefix = joinPrefix(mountPrefix, entry.prefix);

        if (entry.handler instanceof Router) {
          // Only expand sub-router if the request path starts with the prefix
          if (pathStartsWith(request.path, entryPrefix)) {
            expandRouter(entry.handler, entryPrefix);
          }
        } else {
          // Plain middleware — include if prefix matches (or no prefix)
          if (entry.prefix === null || pathStartsWith(request.path, entryPrefix)) {
            pipeline.push(entry.handler);
          }
        }
      }

      // Try matching routes within this router (strip the mount prefix first)
      if (!routeMatched) {
        const localPath = stripPrefix(request.path, mountPrefix);

        for (const route of router.getRoutes()) {
          const methodOk = route.method === "*" || route.method === request.method;
          if (!methodOk) continue;

          const match = route.regex.exec(localPath);
          if (match) {
            // Extract params
            route.keys.forEach((key, i) => {
              if (key !== "*") request.params[key] = match[i + 1]!;
            });
            pipeline.push(...route.handlers);
            routeMatched = true;
            break;
          }
        }
      }
    };

    expandRouter(this, "");

    return pipeline;
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function joinPrefix(base: string, segment: string | null): string {
  if (!segment) return base;
  // Normalise: no trailing slash on base, leading slash on segment
  const b = base.replace(/\/$/, "");
  const s = segment.startsWith("/") ? segment : `/${segment}`;
  return b + s;
}

function pathStartsWith(path: string, prefix: string): boolean {
  if (!prefix || prefix === "/") return true;
  return path === prefix || path.startsWith(prefix + "/");
}

function stripPrefix(path: string, prefix: string): string {
  if (!prefix || prefix === "/") return path;
  const stripped = path.slice(prefix.length);
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}
