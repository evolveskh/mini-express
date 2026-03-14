import miniExpress from "../src/index.js"

const app = miniExpress();

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
})