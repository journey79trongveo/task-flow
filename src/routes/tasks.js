import { Router } from "express";
import { TaskError } from "../services/task-service.js";

/** Thin HTTP layer: parse the request, call the service, map TaskError to a status code. */
export function tasksRouter(service) {
  const router = Router();

  const handle = (fn) => (req, res) => {
    try {
      fn(req, res);
    } catch (error) {
      if (error instanceof TaskError) {
        res.status(error.status).json({ error: error.message });
      } else {
        console.error(error);
        res.status(500).json({ error: "Something went wrong." });
      }
    }
  };

  router.get("/", handle((req, res) => res.json(service.list({ status: req.query.status }))));
  router.get("/:id", handle((req, res) => res.json(service.get(req.params.id))));
  router.post("/", handle((req, res) => res.status(201).json(service.create(req.body))));
  router.patch("/:id", handle((req, res) => res.json(service.update(req.params.id, req.body))));
  router.post("/:id/move", handle((req, res) => res.json(service.move(req.params.id, req.body?.status))));
  router.delete("/:id", handle((req, res) => {
    service.remove(req.params.id);
    res.status(204).end();
  }));

  return router;
}
