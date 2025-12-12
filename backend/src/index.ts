import express, { Express, Request, Response, NextFunction } from "express";
require('dotenv').config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// middleware
import { authenticate } from "./middleware/auth";

const publicRoutes = [
  '/api/users/register',
  '/api/users/login'
];

// Global authentication middleware with exclusions
app.use((req: Request, res: Response, next: NextFunction) => {
  // Check if exact route is in public list
  if (publicRoutes.includes(req.path)) {
    return next();
  }
  
  // Otherwise, require authentication
  authenticate(req, res, next);
});

// route imports
const users = require("./routes/users");
const media = require("./routes/media");

// routes
app.use("/api/users", users);
app.use("/api/media", media);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
});