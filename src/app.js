import express from "express";
import { fileURLToPath } from "node:url";
import { tasksRouter } from "./routes/tasks.js";

const publicDir = fileURLToPath(new URL("../public", import.meta.url));

/** Builds the Express app from a task service, so tests can pass an in-memory one. */
export function createApp(service) {
  const app = express();
  app.use(express.json({ limit: "100kb" }));
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/tasks", tasksRouter(service));
  app.use(express.static(publicDir));
  return app;
}
