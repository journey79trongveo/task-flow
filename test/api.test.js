import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { createNotifier } from "../src/notifications/notifier.js";
import { createTaskService } from "../src/services/task-service.js";
import { createMemoryStore } from "../src/storage/json-store.js";

test("API: create, list, move and delete a task over HTTP", async (t) => {
  const service = createTaskService({ store: createMemoryStore(), notifier: createNotifier({ log: () => {} }) });
  const server = createApp(service).listen(0);
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api/tasks`;

  const created = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "From the API", jiraKey: "TF-1" }),
  });
  assert.equal(created.status, 201);
  const task = await created.json();

  const listed = await (await fetch(base)).json();
  assert.equal(listed.length, 1);

  const moved = await fetch(`${base}/${task.id}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Done" }),
  });
  assert.equal(moved.status, 409);

  const deleted = await fetch(`${base}/${task.id}`, { method: "DELETE" });
  assert.equal(deleted.status, 204);
});
