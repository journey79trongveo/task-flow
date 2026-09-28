# REST API

Base path `/api`. JSON in, JSON out. Errors are `{ "error": "message" }`.

| Method | Path | Body | Success | Errors |
|---|---|---|---|---|
| GET | `/api/health` | | `200 {ok:true}` | |
| GET | `/api/tasks?status=` | | `200 Task[]` (all tasks, no pagination) | |
| GET | `/api/tasks/:id` | | `200 Task` | `404` |
| POST | `/api/tasks` | `{title, priority?, assignee?, storyPoints?, jiraKey?}` | `201 Task` | `400` |
| PATCH | `/api/tasks/:id` | any of `title, priority, assignee, storyPoints, jiraKey` | `200 Task` | `400`, `404` |
| POST | `/api/tasks/:id/move` | `{status}` | `200 Task` | `400`, `404`, `409` (bad transition or WIP limit) |
| DELETE | `/api/tasks/:id` | | `204` | `404` |

Notes:

- There is **no authentication**: anyone who can reach the port can change any task.
- `GET /api/tasks` returns every task. Filtering by `status` happens in memory after reading the
  whole file.
- There is no search endpoint and no sorting parameter yet (TF sprint, see roadmap).
