# Tech debt and fragile areas

Each item says what breaks and what a change in that area costs. Agile Copilot reads this file to
judge the technical risk of a change request.

## TD-1 JSON store is not safe under concurrent writes — Risk: High

`json-store.js` reads the whole file, changes it in memory and rewrites the whole file. Two
requests at the same time can overwrite each other (lost update), and a crash mid-write can leave
a truncated file. Fine for one user; not for a team.
**Cost of change:** any feature that increases writes (comments, activity log, bulk moves,
imports) makes this worse. A safe write (temp file + rename, TF-8) is ~3 SP; moving to SQLite is
~8 SP and touches every service function.

## TD-2 No users, no auth — Risk: High

There is no user model, no login, no roles. `assignee` is a free-text string.
**Cost of change:** any request mentioning login, SSO, permissions, "only the owner can…",
"my tasks" or notifications per person needs a user model, sessions and auth middleware on every
route first. Estimate 13+ SP before the feature itself; not a one-sprint add-on.

## TD-3 No pagination, everything in memory — Risk: Medium

`GET /api/tasks` returns every task and the service filters in memory. With a few thousand tasks
the board gets slow. Search built on top of this (TF-3) will do a linear scan.
**Cost of change:** pagination (TF-5) is ~3 SP in the API but the UI assumes it has all tasks per
column, so the board needs changes too (+2 SP).

## TD-4 Notifier runs synchronously in the request — Risk: Medium

`notifier.taskDone()` runs inside `POST /move`. Today it only logs. A real email provider would
make every move to Done wait on the network, and a failure would fail the move after the file was
already written.
**Cost of change:** more notification types (assignment, mentions, due-date reminders) should not
be added before the notifier is moved out of the request path (TF-6, ~5 SP). Due-date reminders
also need a scheduler, which does not exist.

## TD-5 No schema versioning or migrations — Risk: Medium

Tasks are stored as plain JSON with no version field. New required fields have to be defaulted in
code everywhere they are read.
**Cost of change:** each new field adds ~1 SP of defaulting and tests; renaming or restructuring
fields needs a one-off migration script.

## TD-6 UI is hand-written DOM code — Risk: Low

`public/app.js` re-renders the whole board after each action. Simple and cheap to change; no
tests cover the UI.
**Cost of change:** small UI tweaks are 1-2 SP; drag-and-drop or live updates would need a
rework of `render()`.

## Safe areas

- `task-service.js` workflow and validation are covered by unit tests (`test/task-service.test.js`).
- The HTTP layer is covered by one end-to-end test (`test/api.test.js`).
