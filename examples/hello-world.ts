import miniExpress from "../src/index.js";
import { MinRequest, MinResponse, NextFunction } from "../src/types.js";

const app = miniExpress();

// ── GLOBAL MIDDLEWARE ─────────────────────────────────────────────────────────
app.use((_req: MinRequest, _res: MinResponse, next: NextFunction) => {
  console.log(`[Log] ${_req.method} ${_req.path}`);
  next();
});

// ── ROUTE-SPECIFIC MIDDLEWARE ─────────────────────────────────────────────────
const requireAuth = (req: MinRequest, res: MinResponse, next: NextFunction) => {
  if (!req.headers.authorization) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }
  next();
};

// ── BASIC ROUTES ──────────────────────────────────────────────────────────────
app.get("/hello", (_req: MinRequest, res: MinResponse) => {
  res.status(200).json({ message: "Hello world route!" });
});

app.get("/users", (_req: MinRequest, res: MinResponse) => {
  res.status(200).json({ users: [{ name: "madonathy" }] });
});

app.get("/secret", requireAuth, (_req: MinRequest, res: MinResponse) => {
  res.status(200).json({ message: "You saw the secret!" });
});

app.get("/users/:id/posts/:postId", (req: MinRequest, res: MinResponse) => {
  res.status(200).json({
    message: "Found dynamic parameters!",
    userId: req.params.id,
    postId: req.params.postId,
  });
});

// ── PHASE 4: SUB-ROUTER ───────────────────────────────────────────────────────
const productsRouter = miniExpress.Router();

productsRouter.get("/", (_req: MinRequest, res: MinResponse) => {
  res.json({ products: ["widget", "gadget"] });
});

productsRouter.get("/:id", (req: MinRequest, res: MinResponse) => {
  res.json({ product: req.params.id });
});

app.use("/products", productsRouter);
// GET /products     → list products
// GET /products/42  → { product: "42" }

// ── PHASE 4: ROUTE CHAINING ───────────────────────────────────────────────────
app
  .route("/items")
  .get((_req: MinRequest, res: MinResponse) => res.json({ method: "GET", items: [] }))
  .post((_req: MinRequest, res: MinResponse) => res.json({ method: "POST", created: true }));

// ── PHASE 4: WILDCARD ─────────────────────────────────────────────────────────
app.get("/files/*", (req: MinRequest, res: MinResponse) => {
  res.json({ file: req.path.replace("/files/", "") });
});

// ── ERROR ROUTES ──────────────────────────────────────────────────────────────
app.get("/error", (_req: MinRequest, _res: MinResponse, next: NextFunction) => {
  next(new Error("Database connection failed"));
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
app.use((err: unknown, _req: MinRequest, res: MinResponse, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Error caught by global handler:", message);
  res.status(500).json({ error: "Internal Server Error", details: message });
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
  console.log("Try these endpoints:");
  console.log("  GET  /hello");
  console.log("  GET  /products          (sub-router)");
  console.log("  GET  /products/42       (sub-router with params)");
  console.log("  GET  /items             (route chain)");
  console.log("  POST /items             (route chain)");
  console.log("  GET  /files/a/b/c.txt  (wildcard)");
  console.log("  GET  /error             (triggers error handler)");
});
