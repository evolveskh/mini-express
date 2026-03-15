import http, { IncomingMessage, ServerResponse } from "node:http";
import { extendRequest } from "./request.js";
import { extendResponse } from "./response.js";

export class Application {
  private server = http.createServer((req, res) =>
    this.handleRequest(req, res)
  );

  listen(port: number, callback?: () => void) {
    this.server.listen(port, callback);
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse) {
    const request = extendRequest(req);
    const response = extendResponse(res);

    response.status(200).json({
      message: "Hello from my framework",
      path: request.path,
      query: request.query,
    });
  }
}
