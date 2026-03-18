# mini-express

A minimal, Express.js-like HTTP framework built from first principles — zero runtime dependencies.

## Features

- **Zero dependencies** — pure Node.js `http` module under the hood
- **TypeScript first** — strict types, generic handler signatures
- **Express-like API** — familiar `app.get()`, `app.use()`, middleware patterns
- **Sub-routers** — modular routing with `minExpress.Router()`
- **Route chaining** — `app.route(path).get(h).post(h)`
- **Wildcard routes** — `/files/*`, catch-all `*`
- **Error handling** — 4-argument error middleware, auto-catch of sync throws
- **Modern ESM** — `import`/`export` throughout

## Project Progress

- [x] **Phase 1** — Foundation: HTTP server, request/response wrappers
- [x] **Phase 2** — Core routing: regex matching, path params
- [x] **Phase 3** — Middleware pipeline: `next()`, error handlers
- [x] **Phase 4** — Advanced routing: sub-routers, route chaining, wildcards
- [ ] **Phase 5** — Body parsing: JSON, URL-encoded
- [ ] **Phase 6** — Static file serving
- [ ] **Phase 7** — DX & TypeScript generics
- [ ] **Phase 8** — Tests & documentation

## Getting Started

```bash
git clone https://github.com/yourusername/mini-express.git
cd mini-express
bun install
```

## Usage

### Basic routes & middleware

```typescript
import miniExpress from "mini-express";

const app = miniExpress();

// Global middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Route with inline middleware
const requireAuth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

app.get("/secret", requireAuth, (req, res) => {
  res.json({ message: "You saw the secret!" });
});

// Path params
app.get("/users/:id", (req, res) => {
  res.json({ id: req.params.id });
});

app.listen(3000, () => console.log("Running on http://localhost:3000"));
```

### Sub-routers

```typescript
const usersRouter = miniExpress.Router();

usersRouter.get("/", (req, res) => res.json({ users: [] }));
usersRouter.get("/:id", (req, res) => res.json({ id: req.params.id }));

app.use("/users", usersRouter);
// GET /users      → list
// GET /users/42   → { id: "42" }
```

### Route chaining

```typescript
app.route("/items")
  .get((req, res) => res.json({ items: [] }))
  .post((req, res) => res.json({ created: true }));
```

### Wildcard routes

```typescript
app.get("/files/*", (req, res) => res.json({ path: req.path }));
app.all("*", (req, res) => res.status(404).json({ error: "Not found" }));
```

### Error handling

```typescript
app.get("/boom", (req, res, next) => {
  next(new Error("something went wrong"));
});

// 4-argument signature = error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

## Testing

```bash
bun test
```

## License

MIT
