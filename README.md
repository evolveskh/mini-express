# mini-express 🚀

A minimal, high-performance web framework for Node.js built from first principles.

> **Note:** This project is built from scratch with zero runtime dependencies to demonstrate deep understanding of Node.js internals, asynchronous programming, and API design.

## ✨ Features

- **Zero Dependencies**: Pure Node.js under the hood.
- **TypeScript First**: Statically typed for a better developer experience.
- **Express-like API**: Familiar `app.get()`, `app.use()`, and middleware patterns.
- **Modern ESM**: Built for the future of the JavaScript ecosystem.

## 🛠 Project Progress

- [x] **Phase 1.1**: Project Scaffolding & Tooling
- [x] **Phase 1.2**: Core Application Engine (HTTP Wrapper)
- [x] **Phase 1.3**: Custom Request & Response Objects
- [x] **Phase 2**: Routing Engine (Regex matching & Params)
- [ ] **Phase 3**: Middleware Pipeline (The `next()` pattern)
- [ ] **Phase 4**: Advanced Routing (Sub-routers)
- [ ] **Phase 5**: Built-in Body Parsing
- [ ] **Phase 6**: Static File Serving

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

```bash
git clone https://github.com/yourusername/mini-express.git
cd mini-express
npm install
```

### Simple Example

```typescript
import miniExpress from "mini-express";

const app = miniExpress();

// 1. Basic route
app.get("/hello", (req, res) => {
  res.status(200).json({ message: "Hello world route!" });
});

// 2. Dynamic route parameters
app.get("/users/:id", (req, res) => {
  res.status(200).json({ 
    user: req.params.id,
    query: req.query // Automatically parsed!
  });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
```

## 🧪 Testing

We use **Vitest** for a fast and reliable testing experience.

```bash
npm test
```

## 📜 License

MIT
