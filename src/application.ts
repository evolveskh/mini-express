import http from "node:http";

export class Application {
  private server = http.createServer((req, res) =>
    this.handleRequest(req, res)
  );

  listen(port: number, callback?: () => void) {
    this.server.listen(port, callback);
  }

  private handleRequest(req: any, res: any) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("Hello from my framework!");
  }
}
