import { MinResponse } from "./types.js";
import { ServerResponse } from "node:http";

export function extendResponse(res: ServerResponse): MinResponse {
  const customRes = res as MinResponse;

  customRes.status = function (code: number) {
    this.statusCode = code;
    return this;
  };

  customRes.json = function (data: unknown) {
    this.setHeader("Content-Type", "application/json");
    this.end(JSON.stringify(data));
  };

  customRes.send = function (data: unknown) {
    if (typeof data === "object") {
      this.json(data); // object -> JSON
    } else {
      this.setHeader("Content-Type", "text/html");
      this.end(data as string);
    }
  };

  customRes.set = function (field: string, value: string) {
    this.setHeader(field, value);
    return this;
  };

  customRes.redirect = function (url: string, statusCode = 302) {
    this.statusCode = statusCode;
    this.setHeader("Location", url);
    this.end();
  };

  return customRes;
}
