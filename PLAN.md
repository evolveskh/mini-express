# Min-Express: A Minimal Express.js-Like Framework

> **Goal:** Build a production-quality HTTP framework from scratch to demonstrate deep understanding of Node.js internals, API design, and software architecture.

---

## Why This Project Proves You Can Engineer

| Skill Demonstrated | How This Project Shows It |
|---|---|
| Systems thinking | You're building on raw `http.createServer`, not wrapping a library |
| API design | The public API (`app.get()`, `app.use()`, `res.json()`) must feel intuitive |
| Data structures | Route matching uses a trie (or optimized list) — not just `if/else` |
| Async mastery | Middleware pipeline chains async callbacks correctly |
| TypeScript fluency | Generic, type-safe handler signatures (`Request<Params, Body>`) |
| Testing discipline | Every layer has unit + integration tests |
| Documentation | Clear README with examples a stranger can follow in 60 seconds |

---

## First-Principles Breakdown

Every HTTP framework does **three fundamental things**:

1. **Listen** — Accept TCP connections and parse HTTP requests
2. **Route** — Match a request (method + path) to a handler function
3. **Respond** — Give the handler a convenient way to send a response

Everything else (middleware, body parsing, static files) is built **on top** of those three primitives. The plan below is ordered so that each phase only depends on the phases above it.

---

## Phase 1 — Foundation (The Server)

**First principle:** *Node.js already parses HTTP. We just need a clean wrapper.*

### 1.1 Project Setup
- Initialize `package.json` with `name: "min-express"`, `type: "module"`
- Configure TypeScript (`tsconfig.json`): target ES2022, strict mode, ESM output
- Set up build script (`tsc`) and dev script (`tsx watch`)
- Add Vitest for testing
- Folder structure:
  ```
  src/
    index.ts          # public entry — exports the `minExpress()` factory
    application.ts    # the Application class
    request.ts        # MinRequest wrapper
    response.ts       # MinResponse wrapper
    router.ts         # routing engine
    middleware.ts      # middleware pipeline
    utils/
      path-parser.ts  # path-to-regex + param extraction
  tests/
    unit/
    integration/
  examples/
    hello-world.ts
  ```

### 1.2 Application Class
```ts
// What the user writes:
import minExpress from "min-express";
const app = minExpress();
app.listen(3000, () => console.log("Running"));
```

**Under the hood:**
- `minExpress()` returns an `Application` instance
- `Application.listen()` calls `http.createServer(this.handleRequest)` and `.listen(port)`
- `handleRequest(req, res)` is the single callback wired to every incoming request

### 1.3 Request & Response Wrappers

**MinRequest** — thin wrapper around `http.IncomingMessage`:
| Property/Method | What it does |
|---|---|
| `req.method` | `GET`, `POST`, etc. |
| `req.path` | URL pathname (without query) |
| `req.query` | Parsed query-string object |
| `req.params` | Route parameters (filled in by router) |
| `req.headers` | Direct proxy to `IncomingMessage.headers` |
| `req.body` | Populated by body-parsing middleware |

**MinResponse** — thin wrapper around `http.ServerResponse`:
| Method | What it does |
|---|---|
| `res.status(code)` | Set status code, return `this` for chaining |
| `res.json(data)` | Set `Content-Type: application/json`, stringify, end |
| `res.send(data)` | Smart send (string → text/html, object → json, Buffer → binary) |
| `res.set(header, value)` | Set a response header |
| `res.redirect(url)` | 302 redirect |

> **Key insight for interviewers:** These wrappers are intentionally *thin*. They don't re-invent Node's HTTP — they make the existing API ergonomic.

---

## Phase 2 — Core Routing

**First principle:** *Routing is pattern matching: (method, path) → handler.*

### 2.1 Route Registration
```ts
app.get("/users",    handler);    // GET  /users
app.post("/users",   handler);    // POST /users
app.put("/users/:id", handler);   // PUT  /users/123
app.delete("/users/:id", handler);
app.all("/health",   handler);    // any method
```

Each call stores a `Route` object:
```ts
interface Route {
  method: HttpMethod | "*";
  pattern: string;          // original path string
  keys: string[];           // param names  e.g. ["id"]
  regex: RegExp;            // compiled matcher
  handler: RequestHandler;
}
```

### 2.2 Path Parameter Parsing
Convert path patterns to regex:
```
/users/:id       → /^\/users\/([^/]+)\/?$/   keys: ["id"]
/posts/:postId/comments/:commentId → /^\/posts\/([^/]+)\/comments\/([^/]+)\/?$/
```

This is a **standalone utility** (`pathToRegex`) with its own unit tests.

### 2.3 Route Matching Engine
On every request:
1. Iterate registered routes
2. Check method match (or `*`)
3. Test `route.regex` against `req.path`
4. If match → extract params, call handler
5. If no match → 404

> **Later optimisation (Phase 4):** Replace linear scan with a **radix trie** for O(path-length) matching.

---

## Phase 3 — Middleware Pipeline

**First principle:** *Middleware is just a linked list of functions, each deciding whether to continue or stop.*

### 3.1 The `next()` Pattern
```ts
type Middleware = (req: MinRequest, res: MinResponse, next: NextFunction) => void;
type NextFunction = (err?: any) => void;
```

Execution flow:
```
Request → middleware[0] → middleware[1] → ... → route handler → Response
              │                 │
              └── can call next() to continue
              └── can call res.send() to short-circuit
```

### 3.2 App-Level vs Route-Level Middleware
```ts
// App-level: runs on every request
app.use(loggerMiddleware);

// Path-prefixed: runs only for matching paths
app.use("/api", authMiddleware);

// Route-level: inline
app.get("/secret", authMiddleware, secretHandler);
```

Implementation:
- `app.use()` pushes onto a global middleware stack
- Route-level middleware is prepended to the route's handler chain
- The pipeline runner iterates the combined stack, calling `next()` between each

### 3.3 Error-Handling Middleware
```ts
// Signature with 4 params = error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

If any middleware calls `next(error)`, the pipeline skips to the next **error handler** (4-arg middleware).

---

## Phase 4 — Advanced Routing

### 4.1 Router Instances (Sub-Routers)
```ts
const usersRouter = minExpress.Router();
usersRouter.get("/",    listUsers);
usersRouter.get("/:id", getUser);

app.use("/users", usersRouter);
// GET /users     → listUsers
// GET /users/123 → getUser (req.params.id === "123")
```

A `Router` is a mini-app: it has its own middleware stack and route table. When mounted, its paths are prefixed.

### 4.2 Route Chaining
```ts
app.route("/users")
  .get(listUsers)
  .post(createUser)
  .put(updateUser);
```

### 4.3 Wildcard Routes
```ts
app.get("/files/*", serveFiles); // matches /files/a/b/c
app.all("*", notFoundHandler);   // catch-all
```

---

## Phase 5 — Body Parsing & Content Negotiation

**First principle:** *HTTP request bodies are just byte streams. Parsing is middleware.*

### 5.1 JSON Body Parser
```ts
app.use(minExpress.json()); // built-in middleware
```

Implementation:
1. Check `Content-Type: application/json`
2. Collect chunks from the readable stream
3. `JSON.parse()` the buffer
4. Attach to `req.body`
5. Call `next()`

### 5.2 URL-Encoded Parser
```ts
app.use(minExpress.urlencoded({ extended: false }));
```

Same pattern, but uses `URLSearchParams` to parse `key=value&key2=value2`.

### 5.3 Content-Type Negotiation
`res.send()` inspects the data type:
- `string` → `text/html`
- `object` → `application/json`
- `Buffer` → `application/octet-stream`

---

## Phase 6 — Static Files

**First principle:** *Serving files is just: map URL path → filesystem path → stream bytes.*

```ts
app.use(minExpress.static("public"));
// GET /style.css → reads ./public/style.css
```

Implementation:
1. Resolve `path.join(root, req.path)`
2. **Security:** Prevent path traversal (`../../../etc/passwd`)
3. Check if file exists (`fs.stat`)
4. Set `Content-Type` from extension (use a lookup map)
5. Stream file with `fs.createReadStream().pipe(res)`
6. If not found → call `next()` (let other middleware handle it)

---

## Phase 7 — Developer Experience & TypeScript

### 7.1 Type-Safe Handlers
```ts
app.get<{ id: string }>("/users/:id", (req, res) => {
  req.params.id; // TypeScript knows this is string
});

app.post<{}, CreateUserBody>("/users", (req, res) => {
  req.body.name; // TypeScript knows the shape
});
```

### 7.2 Error Messages
- Missing handler → descriptive error with suggestion
- Port in use → catch `EADDRINUSE`, print a helpful message
- Invalid middleware → throw with call-site info

### 7.3 Example Application
Build a small REST API (e.g., in-memory todo app) that exercises:
- CRUD routes with params
- JSON body parsing
- Error handling middleware
- Static file serving
- Sub-routers

---

## Phase 8 — Testing & Documentation

### 8.1 Unit Tests (Vitest)
| Module | What to test |
|---|---|
| `pathToRegex` | Param extraction, edge cases, no-match |
| `Router` | Route matching, method filtering, param passing |
| `Middleware pipeline` | Ordering, `next()`, error propagation |
| `MinRequest` | Query parsing, header access |
| `MinResponse` | `json()`, `send()`, `status()`, chaining |

### 8.2 Integration Tests
- Spin up the server on a random port
- Use `fetch()` (Node 18+ built-in) to make real HTTP requests
- Assert status codes, headers, and response bodies

### 8.3 Documentation
- **README.md**: Quick-start (< 60 seconds), feature list, comparison to Express
- **API docs**: Every public method with examples
- **Architecture doc**: Diagram of how request flows through the system

---

## Implementation Order & Milestones

```
Week 1 ──────────────────────────────────────────
  ✦ Phase 1: Foundation  (server boots, req/res work)
  ✦ Phase 2: Core Routing (GET /hello → "Hello!")

Week 2 ──────────────────────────────────────────
  ✦ Phase 3: Middleware   (use(), next(), error handling)
  ✦ Phase 4: Advanced     (Router(), route chaining)

Week 3 ──────────────────────────────────────────
  ✦ Phase 5: Body Parsing (JSON, URL-encoded)
  ✦ Phase 6: Static Files

Week 4 ──────────────────────────────────────────
  ✦ Phase 7: DX & Types  (generics, examples)
  ✦ Phase 8: Tests & Docs (coverage, README, architecture)
```

---

## What Makes This Portfolio-Worthy

1. **No dependencies** (except dev tools) — proves you understand what libraries hide
2. **TypeScript from day one** — shows professional-grade engineering
3. **Tests at every layer** — unit + integration, not just "it works on my machine"
4. **Progressive complexity** — each phase builds on the last; easy to explain in an interview
5. **Clean git history** — one meaningful commit per feature (squash if needed)
6. **Published to npm** — goes from "side project" to "I ship software"
