import miniExpress from "../src/index.js";

const app = miniExpress();

// This will only run for GET /hello
app.get("/hello", (req, res) => {
  res.status(200).json({ message: "Hello world route!" });
});
// This will only run for GET /users
app.get("/users", (req, res) => {
  res.status(200).json({ users: [{ name: "madonathy" }] });
});

app.get("/welcome", (req, res) => {
  res.status(200).json({ message: "welcome to our website" });
});

app.get("/users/:id/posts/:postId", (req, res) => {
  res.status(200).json({
    message: "Found dynamic parameters!",
    userId: req.params.id,
    postId: req.params.postId,
  });
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
