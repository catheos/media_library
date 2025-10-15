import express, { Express } from "express";
const app = express();
const port = 3000;

// route imports
const users = require("./routes/users");

// routes
app.use("/api/users", users);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})