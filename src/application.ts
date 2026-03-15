import http, { IncomingMessage, ServerResponse } from "node:http";
import { extendRequest } from "./request.js";
import { extendResponse } from "./response.js";
import { Router } from "./router.js";

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

    let matchedParams: Record<string, string> = {};

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
      matchedRoute.handler(request, response, () => {});
    } else {
      response.status(404).json({
        error: "Not found",
        path: request.path,
        method: request.method,
      });
    }
  }
}
