/**
 * min-express — A minimal Express.js-like HTTP framework
 *
 * Built from scratch with zero runtime dependencies.
 */
import { Application } from "./application.js";

export default function miniExpress() {
  return new Application();
}
