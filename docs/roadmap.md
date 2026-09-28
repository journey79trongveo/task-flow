# Roadmap

The sprint backlog lives in Jira project **TF** on hankimthuy.atlassian.net. This page keeps the
code-side view of it.

## Current sprint: TaskFlow Sprint 1

Goal: *Teams can find their work fast: due dates, search and a board that stays reliable.*

| Key | Item | Area | Notes |
|---|---|---|---|
| TF-1 | Due dates on tasks | API, Storage | New `dueDate` field (TD-5: default for old tasks) |
| TF-2 | Due-date badge on board cards | UI | Depends on TF-1 |
| TF-3 | Search tasks by title | API | Linear scan over all tasks (TD-3) |
| TF-4 | Search box on the board | UI | Depends on TF-3 |
| TF-5 | Pagination for `GET /api/tasks` | API | UI assumes full lists (TD-3) |
| TF-6 | Move notifier out of the request path | Notifications | Unblocks more notification types (TD-4) |
| TF-7 | Board column colour polish | UI | Cosmetic |
| TF-8 | Write-safe JSON store (temp file + rename) | Storage | Reduces TD-1, does not fix concurrency |

## Later (not planned)

- Users, login and roles (TD-2).
- Comments and attachments on tasks (needs TD-1 fixed first; attachments do not fit a JSON file).
- Move to SQLite.
