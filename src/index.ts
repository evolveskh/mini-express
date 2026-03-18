/**
 * min-express — A minimal Express.js-like HTTP framework
 *
 * Built from scratch with zero runtime dependencies.
 */
import { Application } from "./application.js";
import { Router } from "./router.js";

function miniExpress() {
  return new Application();
}

/** Create a standalone sub-router: const r = minExpress.Router() */
miniExpress.Router = function (): Router {
  return new Router();
};

export default miniExpress;
export { Router };
