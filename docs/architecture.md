# Architecture

TaskFlow is one Node.js process (Express 4, ES modules, Node 22). There is no database, no auth
and no build step.

## Modules

| Module | File | Responsibility | Depends on |
|---|---|---|---|
| Server | `src/server.js` | Reads env, builds the store, notifier and service, starts HTTP | App, Service, Storage, Notifications |
| App | `src/app.js` | Express setup: JSON body (100 kb limit), `/api/health`, `/api/tasks`, static `public/` | Routes |
| Routes | `src/routes/tasks.js` | HTTP only: parse request, call the service, map `TaskError` → status | Service |
| Service | `src/services/task-service.js` | **All business rules**: validation, status workflow, WIP limit, notify on Done | Storage (interface), Notifications (interface) |
| Storage | `src/storage/json-store.js` | `readAll()` / `writeAll(tasks)` over one JSON file; in-memory twin for tests | Node `fs` |
| Notifications | `src/notifications/notifier.js` | `taskDone(task)`: logs an "email" synchronously | none |
| UI | `public/*` | Board with four columns; calls the REST API with `fetch` | REST API |

The service receives the store and notifier by injection, so tests run with the in-memory store
and a silent notifier.

## Data model

One entity, `Task`:

```json
{
  "id": "uuid",
  "title": "string, 1-200 chars",
  "priority": "High | Medium | Low",
  "assignee": "string | null",
  "storyPoints": "integer >= 0 | null",
  "jiraKey": "string | null (e.g. TF-3)",
  "status": "To Do | In Progress | Review | Done",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

There are no users, projects, comments, attachments or due dates yet. Adding a field means
touching the service (validation + allowed update keys), the UI form and card, and every existing
JSON file (there is no migration step, see TD-5).

## Data flow

1. The UI calls `POST /api/tasks/:id/move {status}`.
2. Routes call `service.move(id, status)`.
3. The service reads **all** tasks (`store.readAll()`), checks the transition and WIP limit,
   then rewrites **the whole file** (`store.writeAll()`).
4. On Done, the service calls `notifier.taskDone(task)` inside the same request.

## Workflow rules

- Forward moves: To Do → In Progress → Review → Done. One step back is allowed.
- Skipping a column returns `409`.
- At most `WIP_LIMIT` (default 3) tasks In Progress; the next move there returns `409`.
- Status never changes through `PATCH`; only through `/move`.

## Change hot-spots

- **Anything touching storage** (new fields, search, filtering, pagination, attachments) goes
  through `json-store.js`, which loads everything into memory on every request. See TD-1, TD-3.
- **Anything user-related** (roles, login, "my tasks", mentions) has no foundation: there is no
  user model and no auth. See TD-2.
- **Anything that sends messages** runs synchronously inside the request. See TD-4.
- **UI changes** are cheap: plain DOM code in `public/app.js`, no framework, no build.
