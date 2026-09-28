# TaskFlow

A small task board: an Express REST API with a JSON file store and a plain HTML/JS board UI.
Tasks move through **To Do → In Progress → Review → Done**, with a WIP limit on In Progress.

TaskFlow is the sample team repository for **Agile Copilot**. Agile Copilot reads the docs on
the `main` branch of this repo (this README and everything under `docs/`) as the
**technical view** in its sprint trade-off analysis. Keep these docs true to the code: they are
what the AI reasons about.

## Run it

```bash
npm install
npm start          # http://localhost:3000
npm test           # node:test, no network
```

| Env var | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DATA_FILE` | `data/tasks.json` | Where the JSON store writes |
| `WIP_LIMIT` | `3` | Max tasks In Progress |

## Jira link

The backlog for this repo lives in Jira project **TF (TaskFlow)** on
`https://hankimthuy.atlassian.net`.

- Put the Jira key in branch names, commit messages and PR titles, e.g.
  `TF-3-search-api`, `TF-3 Add title search to GET /api/tasks`.
- Tasks in the app can carry a `jiraKey` (e.g. `TF-3`) so a board card points at its issue.
- Optional: install the **GitHub for Jira** app on the Atlassian site and connect the
  `journey79trongveo` organisation; commits and PRs with `TF-…` keys then show in each issue's
  Development panel.
- In Agile Copilot, `CODE_REPO_JIRA_PROJECT=TF` links a sprint loaded from Jira project TF to this
  repo, so the technical view is switched on automatically.

## Docs

- [docs/architecture.md](docs/architecture.md): modules, data flow and which module depends on which.
- [docs/api.md](docs/api.md): the REST endpoints.
- [docs/tech-debt.md](docs/tech-debt.md): known fragile areas and what a change there costs.
- [docs/roadmap.md](docs/roadmap.md): what the current sprint (TF) is building.

## Layout

```
src/
  server.js                 entry point: wires store + notifier + service, starts HTTP
  app.js                    Express app: JSON body, /api/tasks, static public/
  routes/tasks.js           thin HTTP layer, maps TaskError to status codes
  services/task-service.js  all business rules (validation, workflow, WIP limit, notify on Done)
  storage/json-store.js     JSON file store + in-memory store for tests
  notifications/notifier.js email stub (logs only)
public/                     board UI (index.html, app.js, styles.css), no build step
test/                       node:test unit + HTTP tests
```
