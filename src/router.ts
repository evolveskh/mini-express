import { RequestHandler, HttpMethod } from "./types.js";
import { pathToRegex } from "./utils/path-parser.js";

interface Route {
  method: HttpMethod | "*";
  path: string;
  keys: string[];
  regex: RegExp;
  handlers: RequestHandler[];
}

export class Router {
  protected routes: Route[] = [];

  // A helper method to avoid duplicating pathToRegex in every method
  private addRoute(
    method: HttpMethod | "*",
    path: string,
    handlers: RequestHandler[]
  ) {
    const { regex, keys } = pathToRegex(path);
    this.routes.push({ method, path, keys, regex, handlers });
  }

  get(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("GET", path, handlers);
  }

  post(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("POST", path, handlers);
  }

  put(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("PUT", path, handlers);
  }

  delete(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("DELETE", path, handlers);
  }

  patch(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("PATCH", path, handlers);
  }
}
