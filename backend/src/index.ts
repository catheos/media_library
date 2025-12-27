import express, { Express, Request, Response, NextFunction } from "express";
require('dotenv').config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// middleware
import { authenticate } from "./middleware/auth";

const publicRoutes: { method: string, path: string }[] = [
  { method: "POST", path: "/api/users/register" },
  { method: "POST", path: "/api/users/login" },
];

// Global authentication middleware with exclusions
app.use((req: Request, res: Response, next: NextFunction) => {
  // Check if route and method in publicRoutes
  if (publicRoutes.some(route => route.method === req.method && route.path === req.path)) {
    return next();
  }
  
  // Otherwise, require authentication
  authenticate(req, res, next);
});

// route imports
const users = require("./routes/users");
const media = require("./routes/media");
const characters = require("./routes/characters");
const media_characters = require("./routes/media-characters");
const media_users = require("./routes/media-user");

// routes
app.use("/api/users", users);
app.use("/api/media", media);
app.use("/api/characters", characters);
app.use("/api/media-characters", media_characters);
app.use("/api/media-user", media_users);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
});