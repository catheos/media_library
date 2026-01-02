import express, { Express, Request, Response, NextFunction } from "express";
import path from "path";

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve React frontend static files (production only)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, '..', 'frontend', 'dist')));
}

// Health check endpoint (BEFORE authentication)
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// middleware
import { authenticate } from "./middleware/auth";

const publicRoutes: { method: string, path: string }[] = [
  { method: "POST", path: "/api/users/register" },
  { method: "POST", path: "/api/users/login" },
  { method: "GET", path: "/api/health" },
];

// Global authentication middleware with exclusions
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip authentication for non-API routes (frontend static files)
  if (!req.path.startsWith('/api')) {
    return next();
  }

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

// SPA fallback - serve index.html for all non-API routes (production only, MUST be last)
if (process.env.NODE_ENV === 'production') {
  app.get(/.*/, (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
});