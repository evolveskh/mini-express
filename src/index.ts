/**
 * min-express — A minimal Express.js-like HTTP framework
 *
 * Built from scratch with zero runtime dependencies.
 */
import { Application } from "./application.js";

export default function miniExpress() {
  return new Application();
}
// Phase 1.2+ will populate this file with:
// - minExpress() factory function
// - Router export
// - Built-in middleware exports (json, urlencoded, static)
