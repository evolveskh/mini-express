import { describe, it, expect, beforeEach, afterEach } from "vitest";
import miniExpress from "../../src/index.js";
import { MinRequest, MinResponse, NextFunction } from "../../src/types.js";
import http from "node:http";

// Helper: find a free port and start the app, returns { port, close }
function startApp(app: ReturnType<typeof miniExpress>): Promise<{ port: number; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = (app as any).server as http.Server;
    server.listen(0, () => {
      const addr = server.address() as { port: number };
      resolve({
        port: addr.port,
        close: () => new Promise((res) => server.close(() => res())),
      });
    });
  });
}

async function get(port: number, path: string, headers?: Record<string, string>) {
  const res = await fetch(`http://localhost:${port}${path}`, { headers });
  const body = await res.json();
  return { status: res.status, body };
}

async function post(port: number, path: string, data: unknown) {
  const res = await fetch(`http://localhost:${port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { status: res.status, body };
}

// ─────────────────────────────────────────────────────────────────────────────
describe("Phase 4 — Sub-routers", () => {
  it("mounts a Router and resolves GET /users", async () => {
    const app = miniExpress();
    const usersRouter = miniExpress.Router();

    usersRouter.get("/", (_req: MinRequest, res: MinResponse) => {
      res.json({ users: ["alice", "bob"] });
    });

    app.use("/users", usersRouter);
    const { port, close } = await startApp(app);

    try {
      const { status, body } = await get(port, "/users");
      expect(status).toBe(200);
      expect(body.users).toEqual(["alice", "bob"]);
    } finally {
      await close();
    }
  });

  it("mounts a Router and resolves GET /users/:id with params", async () => {
    const app = miniExpress();
    const usersRouter = miniExpress.Router();

    usersRouter.get("/:id", (req: MinRequest, res: MinResponse) => {
      res.json({ id: req.params.id });
    });

    app.use("/users", usersRouter);
    const { port, close } = await startApp(app);

    try {
      const { status, body } = await get(port, "/users/42");
      expect(status).toBe(200);
      expect(body.id).toBe("42");
    } finally {
      await close();
    }
  });

  it("returns 404 for unmatched sub-router path", async () => {
    const app = miniExpress();
    const usersRouter = miniExpress.Router();
    usersRouter.get("/", (_req: MinRequest, res: MinResponse) => res.json({}));
    app.use("/users", usersRouter);

    const { port, close } = await startApp(app);

    try {
      const { status } = await get(port, "/posts");
      expect(status).toBe(404);
    } finally {
      await close();
    }
  });

  it("runs path-prefixed middleware only for matching prefix", async () => {
    const app = miniExpress();
    const log: string[] = [];

    app.use("/api", (_req: MinRequest, _res: MinResponse, next: NextFunction) => {
      log.push("api-middleware");
      next();
    });

    app.get("/api/ping", (_req: MinRequest, res: MinResponse) => {
      res.json({ log });
    });

    app.get("/public", (_req: MinRequest, res: MinResponse) => {
      res.json({ log });
    });

    const { port, close } = await startApp(app);

    try {
      const { body: apiBody } = await get(port, "/api/ping");
      expect(apiBody.log).toContain("api-middleware");

      log.length = 0;
      const { body: pubBody } = await get(port, "/public");
      expect(pubBody.log).not.toContain("api-middleware");
    } finally {
      await close();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Phase 4 — Route chaining", () => {
  it("chains .get and .post on the same path", async () => {
    const app = miniExpress();

    app
      .route("/items")
      .get((_req: MinRequest, res: MinResponse) => res.json({ method: "GET" }))
      .post((_req: MinRequest, res: MinResponse) => res.json({ method: "POST" }));

    const { port, close } = await startApp(app);

    try {
      const { body: getBody } = await get(port, "/items");
      expect(getBody.method).toBe("GET");

      const { body: postBody } = await post(port, "/items", {});
      expect(postBody.method).toBe("POST");
    } finally {
      await close();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Phase 4 — Wildcard routes", () => {
  it("matches /files/* for any sub-path", async () => {
    const app = miniExpress();

    app.get("/files/*", (req: MinRequest, res: MinResponse) => {
      res.json({ path: req.path });
    });

    const { port, close } = await startApp(app);

    try {
      const { status, body } = await get(port, "/files/a/b/c.txt");
      expect(status).toBe(200);
      expect(body.path).toBe("/files/a/b/c.txt");
    } finally {
      await close();
    }
  });

  it("bare * catch-all matches anything", async () => {
    const app = miniExpress();

    app.get("/known", (_req: MinRequest, res: MinResponse) => res.json({ route: "known" }));
    app.all("*", (_req: MinRequest, res: MinResponse) => res.json({ route: "catch-all" }));

    const { port, close } = await startApp(app);

    try {
      const { body: knownBody } = await get(port, "/known");
      expect(knownBody.route).toBe("known");

      const { body: catchBody } = await get(port, "/anything/else");
      expect(catchBody.route).toBe("catch-all");
    } finally {
      await close();
    }
  });
});
