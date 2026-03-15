import { RequestHandler, HttpMethod } from "./types.js";
import { pathToRegex } from "./utils/path-parser.js";

interface Route {
  method: HttpMethod | "*";
  path: string;
  keys: string[];
  regex: RegExp;
  handler: RequestHandler;
}

export class Router {
  protected routes: Route[] = [];

  // A helper method to avoid duplicating pathToRegex in every method
  private addRoute(
    method: HttpMethod | "*",
    path: string,
    handler: RequestHandler
  ) {
    const { regex, keys } = pathToRegex(path);
    this.routes.push({ method, path, keys, regex, handler });
  }

  get(path: string, handler: RequestHandler) {
    this.addRoute("GET", path, handler);
  }

  post(path: string, handler: RequestHandler) {
    this.addRoute("POST", path, handler);
  }

  put(path: string, handler: RequestHandler) {
    this.addRoute("PUT", path, handler);
  }

  delete(path: string, handler: RequestHandler) {
    this.addRoute("DELETE", path, handler);
  }

  patch(path: string, handler: RequestHandler) {
    this.addRoute("PATCH", path, handler);
  }
}
