import { test } from "node:test";
import assert from "node:assert/strict";
import { createNotifier } from "../src/notifications/notifier.js";
import { createTaskService, TaskError } from "../src/services/task-service.js";
import { createMemoryStore } from "../src/storage/json-store.js";

function setup(options = {}) {
  const notifier = createNotifier({ log: () => {} });
  const service = createTaskService({ store: createMemoryStore(), notifier, ...options });
  return { service, notifier };
}

test("create: a new task starts in To Do with Medium priority", () => {
  const { service } = setup();
  const task = service.create({ title: "  Write docs  " });
  assert.equal(task.status, "To Do");
  assert.equal(task.priority, "Medium");
  assert.equal(task.title, "Write docs");
  assert.equal(service.list().length, 1);
});

test("create: rejects an empty title and a bad priority", () => {
  const { service } = setup();
  assert.throws(() => service.create({ title: "" }), (error) => error instanceof TaskError && error.status === 400);
  assert.throws(() => service.create({ title: "x", priority: "Urgent" }), /Priority/);
});

test("move: follows the workflow and refuses skipping a column", () => {
  const { service } = setup();
  const task = service.create({ title: "A" });
  assert.throws(() => service.move(task.id, "Done"), (error) => error.status === 409);
  assert.equal(service.move(task.id, "In Progress").status, "In Progress");
  assert.equal(service.move(task.id, "Review").status, "Review");
  assert.equal(service.move(task.id, "Done").status, "Done");
});

test("move: the WIP limit caps In Progress", () => {
  const { service } = setup({ wipLimit: 1 });
  const first = service.create({ title: "A" });
  const second = service.create({ title: "B" });
  service.move(first.id, "In Progress");
  assert.throws(() => service.move(second.id, "In Progress"), /WIP limit/);
});

test("move: Done sends one notification", () => {
  const { service, notifier } = setup();
  const task = service.create({ title: "Ship it", assignee: "Alice" });
  service.move(task.id, "In Progress");
  service.move(task.id, "Review");
  service.move(task.id, "Done");
  assert.deepEqual(notifier.sent, [{ to: "alice@example.com", subject: "Done: Ship it" }]);
});

test("update: status cannot be changed through update", () => {
  const { service } = setup();
  const task = service.create({ title: "A" });
  assert.throws(() => service.update(task.id, { status: "Done" }), /move/);
  assert.equal(service.update(task.id, { priority: "High" }).priority, "High");
});

test("remove: deletes a task and 404s on an unknown id", () => {
  const { service } = setup();
  const task = service.create({ title: "A" });
  service.remove(task.id);
  assert.equal(service.list().length, 0);
  assert.throws(() => service.remove(task.id), (error) => error.status === 404);
});
