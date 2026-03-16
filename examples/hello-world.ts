import miniExpress from "../src/index.js";
import { MinRequest, MinResponse, NextFunction } from "../src/types.js";

const app = miniExpress();

// 1. GLOBAL MIDDLEWARE: Runs on every single request
app.use((req: MinRequest, res: MinResponse, next: NextFunction) => {
  console.log(`[Log] ${req.method} ${req.path}`);
  // Pass control to the next middleware in the pipeline
  next(); 
});

// 2. ROUTE-SPECIFIC MIDDLEWARE (Reusable)
const requireAuth = (req: MinRequest, res: MinResponse, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Missing authorization header" });
    // Note: We don't call next(), so the pipeline stops here.
    return;
  }
  next();
};

app.get("/hello", (req: MinRequest, res: MinResponse) => {
  res.status(200).json({ message: "Hello world route!" });
});

app.get("/users", (req: MinRequest, res: MinResponse) => {
  res.status(200).json({ users: [{ name: "madonathy" }] });
});

// Using the route-specific middleware
app.get("/secret", requireAuth, (req: MinRequest, res: MinResponse) => {
  res.status(200).json({ message: "You saw the secret!" });
});

app.get("/welcome", (req: MinRequest, res: MinResponse) => {
  res.status(200).json({ message: "welcome to our website" });
});

app.get("/users/:id/posts/:postId", (req: MinRequest, res: MinResponse) => {
  res.status(200).json({
    message: "Found dynamic parameters!",
    userId: req.params.id,
    postId: req.params.postId,
  });
});

// 3. THROWING ERROR: To test the error handler
app.get("/error", (req: MinRequest, res: MinResponse, next: NextFunction) => {
  // Simulate something going wrong
  const err = new Error("Database connection failed");
  next(err); // Passing an argument means "skip to the error handler!"
});

// 4. GLOBAL ERROR HANDLER (4 Arguments: err, req, res, next)
// Because it has 4 arguments, the dispatcher recognizes it as an Error Handler.
app.use((err: any, req: MinRequest, res: MinResponse, next: NextFunction) => {
  console.error("🔥 Error caught by global handler:", err.message);
  res.status(500).json({ 
    error: "Internal Server Error",
    details: err.message
  });
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
  console.log("🚀 Try these endpoints:");
  console.log("  GET http://localhost:3000/hello");
  console.log("  GET http://localhost:3000/secret (will fail without auth header)");
  console.log("  GET http://localhost:3000/error (will trigger global error handler)");
  console.log("  GET http://localhost:3000/xyz (will fall through to 404 handler)");
});
