import { randomUUID } from "node:crypto";

export const STATUSES = ["To Do", "In Progress", "Review", "Done"];
export const PRIORITIES = ["High", "Medium", "Low"];

/** Allowed moves on the board. A task can also go back one column. */
const TRANSITIONS = {
  "To Do": ["In Progress"],
  "In Progress": ["Review", "To Do"],
  Review: ["Done", "In Progress"],
  Done: ["Review"],
};

export const DEFAULT_WIP_LIMIT = 3;

export class TaskError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function validateInput(input, { partial = false } = {}) {
  if (typeof input !== "object" || input === null) throw new TaskError(400, "Body must be a JSON object.");
  const { title, priority, assignee, storyPoints } = input;
  if (!partial || title !== undefined) {
    if (typeof title !== "string" || !title.trim()) throw new TaskError(400, "Title is required.");
    if (title.length > 200) throw new TaskError(400, "Title is at most 200 characters.");
  }
  if (priority !== undefined && !PRIORITIES.includes(priority)) {
    throw new TaskError(400, `Priority must be one of ${PRIORITIES.join(", ")}.`);
  }
  if (assignee !== undefined && assignee !== null && typeof assignee !== "string") {
    throw new TaskError(400, "Assignee must be a string.");
  }
  if (storyPoints !== undefined && storyPoints !== null && !(Number.isInteger(storyPoints) && storyPoints >= 0)) {
    throw new TaskError(400, "Story points must be a whole number of 0 or more.");
  }
}

/**
 * All business rules live here: validation, the status workflow, the WIP
 * limit on "In Progress", and the notification when a task is done.
 * Routes stay thin; storage knows nothing about rules.
 */
export function createTaskService({ store, notifier, wipLimit = DEFAULT_WIP_LIMIT, now = () => new Date() }) {
  function list({ status } = {}) {
    const tasks = store.readAll();
    return status ? tasks.filter((task) => task.status === status) : tasks;
  }

  function get(id) {
    const task = store.readAll().find((candidate) => candidate.id === id);
    if (!task) throw new TaskError(404, "Task not found.");
    return task;
  }

  function create(input) {
    validateInput(input);
    const tasks = store.readAll();
    const timestamp = now().toISOString();
    const task = {
      id: randomUUID(),
      title: input.title.trim(),
      priority: input.priority ?? "Medium",
      assignee: input.assignee ?? null,
      storyPoints: input.storyPoints ?? null,
      jiraKey: typeof input.jiraKey === "string" ? input.jiraKey : null,
      status: "To Do",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    tasks.push(task);
    store.writeAll(tasks);
    return task;
  }

  function update(id, input) {
    validateInput(input, { partial: true });
    if (input.status !== undefined) throw new TaskError(400, "Use POST /api/tasks/:id/move to change status.");
    const tasks = store.readAll();
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) throw new TaskError(404, "Task not found.");
    const allowed = ["title", "priority", "assignee", "storyPoints", "jiraKey"];
    const changes = Object.fromEntries(Object.entries(input).filter(([key]) => allowed.includes(key)));
    if (typeof changes.title === "string") changes.title = changes.title.trim();
    tasks[index] = { ...tasks[index], ...changes, updatedAt: now().toISOString() };
    store.writeAll(tasks);
    return tasks[index];
  }

  function move(id, status) {
    if (!STATUSES.includes(status)) throw new TaskError(400, `Status must be one of ${STATUSES.join(", ")}.`);
    const tasks = store.readAll();
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) throw new TaskError(404, "Task not found.");
    const task = tasks[index];
    if (task.status === status) return task;
    if (!TRANSITIONS[task.status].includes(status)) {
      throw new TaskError(409, `Cannot move a task from ${task.status} to ${status}.`);
    }
    if (status === "In Progress") {
      const inProgress = tasks.filter((candidate) => candidate.status === "In Progress").length;
      if (inProgress >= wipLimit) throw new TaskError(409, `WIP limit reached: at most ${wipLimit} tasks In Progress.`);
    }
    tasks[index] = { ...task, status, updatedAt: now().toISOString() };
    store.writeAll(tasks);
    if (status === "Done") notifier.taskDone(tasks[index]);
    return tasks[index];
  }

  function remove(id) {
    const tasks = store.readAll();
    const next = tasks.filter((task) => task.id !== id);
    if (next.length === tasks.length) throw new TaskError(404, "Task not found.");
    store.writeAll(next);
  }

  return { list, get, create, update, move, remove };
}
