import { RequestHandler, Middleware, HttpMethod } from "./types.js";
import { pathToRegex } from "./utils/path-parser.js";

interface Route {
  method: HttpMethod | "*";
  path: string;
  keys: string[];
  regex: RegExp;
  handlers: RequestHandler[];
}

/**
 * A RouteChain is returned by `router.route(path)`.
 * It allows fluent method chaining: .get(h).post(h).put(h)
 */
class RouteChain {
  constructor(
    private readonly router: Router,
    private readonly path: string
  ) {}

  get(...handlers: RequestHandler[]): this {
    this.router.get(this.path, ...handlers);
    return this;
  }

  post(...handlers: RequestHandler[]): this {
    this.router.post(this.path, ...handlers);
    return this;
  }

  put(...handlers: RequestHandler[]): this {
    this.router.put(this.path, ...handlers);
    return this;
  }

  delete(...handlers: RequestHandler[]): this {
    this.router.delete(this.path, ...handlers);
    return this;
  }

  patch(...handlers: RequestHandler[]): this {
    this.router.patch(this.path, ...handlers);
    return this;
  }

  all(...handlers: RequestHandler[]): this {
    this.router.all(this.path, ...handlers);
    return this;
  }
}

export class Router {
  protected routes: Route[] = [];
  // Middleware entries: { prefix, middleware | router }
  protected middlewareStack: Array<{
    prefix: string | null;
    handler: Middleware | Router;
  }> = [];

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
    return this;
  }

  post(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("POST", path, handlers);
    return this;
  }

  put(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("PUT", path, handlers);
    return this;
  }

  delete(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("DELETE", path, handlers);
    return this;
  }

  patch(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("PATCH", path, handlers);
    return this;
  }

  all(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("*", path, handlers);
    return this;
  }

  /** Register middleware (optionally scoped to a path prefix) or mount a sub-router */
  use(handler: Middleware | Router): this;
  use(prefix: string, handler: Middleware | Router): this;
  use(
    prefixOrHandler: string | Middleware | Router,
    handler?: Middleware | Router
  ): this {
    if (typeof prefixOrHandler === "string") {
      this.middlewareStack.push({
        prefix: prefixOrHandler,
        handler: handler!,
      });
    } else {
      this.middlewareStack.push({ prefix: null, handler: prefixOrHandler });
    }
    return this;
  }

  /** Fluent route builder — returns a RouteChain for the given path */
  route(path: string): RouteChain {
    return new RouteChain(this, path);
  }

  /** Expose internals for the Application dispatcher */
  getRoutes(): Route[] {
    return this.routes;
  }

  getMiddlewareStack(): Array<{ prefix: string | null; handler: Middleware | Router }> {
    return this.middlewareStack;
  }
}
