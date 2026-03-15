import { IncomingMessage } from "node:http";
import { MinRequest } from "./types.js";

export function extendRequest(req: IncomingMessage): MinRequest {
  const url = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`
  );

  const query: Record<string, string | string[]> = {};
  url.searchParams.forEach((value, key) => {
    if (key in query) {
      // Key already exists → turn into array
      const existing = query[key];
      query[key] = Array.isArray(existing)
        ? [...existing, value]
        : [existing, value];
    } else {
      query[key] = value;
    }
  });

  const customReq = req as MinRequest;
  customReq.path = url.pathname;
  customReq.query = query;
  customReq.params = {};
  customReq.body = undefined;

  return customReq;
}
