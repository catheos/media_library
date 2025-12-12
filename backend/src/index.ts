import express, { Express } from "express";
require('dotenv').config()

const app = express();
const port = process.env.PORT || 3000;

// route imports
const users = require("./routes/users");
const media = require("./routes/media");

// routes
app.use("/api/users", users);
app.use("/api/media", media);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})
