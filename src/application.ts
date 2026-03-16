import http, { IncomingMessage, ServerResponse } from "node:http";
import { extendRequest } from "./request.js";
import { extendResponse } from "./response.js";
import { Router } from "./router.js";
import { Middleware, ErrorHandler, RequestHandler } from "./types.js";

export class Application extends Router {
  private server = http.createServer((req, res) =>
    this.handleRequest(req, res)
  );

  // Store global app-level middleware (both normal and error handlers)
  private globalMiddlewares: Middleware[] = [];

  // Register a global middleware
  use(middleware: Middleware) {
    this.globalMiddlewares.push(middleware);
  }

  listen(port: number, callback?: () => void) {
    this.server.listen(port, callback);
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse) {
    const request = extendRequest(req);
    const response = extendResponse(res);

    let matchedParams: Record<string, string> = {};

    // 1. Find the matching route
    const matchedRoute = this.routes.find((route) => {
      const methodMatched =
        route.method === "*" || route.method === request.method;

      if (!methodMatched) return false;

      const match = route.regex.exec(request.path);

      if (match) {
        route.keys.forEach((key, index) => {
          matchedParams[key] = match[index + 1];
        });
        return true;
      }

      return false;
    });

    if (matchedRoute) {
      request.params = matchedParams;
    }

    // 2. Combine global middleware with the specific route's handlers
    const pipeline: Middleware[] = [
      ...this.globalMiddlewares,
      ...(matchedRoute ? matchedRoute.handlers : []),
    ];

    // 3. The Dispatch Engine
    let index = 0;

    const dispatch = (err?: unknown) => {
      // If we reach the end of the pipeline
      if (index >= pipeline.length) {
        if (err) {
          // Uncaught error reached the end
          response.status(500).json({ 
            error: err instanceof Error ? err.message : String(err) 
          });
        } else if (!matchedRoute) {
          // No route matched, and no middleware sent a response
          response.status(404).json({
            error: "Not found",
            path: request.path,
            method: request.method,
          });
        }
        return;
      }

      // Get current middleware and increment index for the next call
      const currentMiddleware = pipeline[index++];

      try {
        if (err) {
          // ERROR MODE: We are looking for an Error Handler (4 arguments)
          if (currentMiddleware.length === 4) {
            (currentMiddleware as ErrorHandler)(err, request, response, dispatch);
          } else {
            // Not an error handler, skip to the next
            dispatch(err);
          }
        } else {
          // NORMAL MODE: We skip error handlers
          if (currentMiddleware.length === 4) {
            dispatch();
          } else {
            // Fire normal request handler
            (currentMiddleware as RequestHandler)(request, response, dispatch);
          }
        }
      } catch (syncErr) {
        // Catch synchronous errors automatically and pass into error mode
        dispatch(syncErr);
      }
    };

    // Start the assembly line!
    dispatch();
  }
}
