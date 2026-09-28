import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { createNotifier } from "./notifications/notifier.js";
import { createTaskService } from "./services/task-service.js";
import { createJsonStore } from "./storage/json-store.js";

const dataFile = process.env.DATA_FILE ?? fileURLToPath(new URL("../data/tasks.json", import.meta.url));
const port = Number(process.env.PORT ?? 3000);

const service = createTaskService({
  store: createJsonStore(dataFile),
  notifier: createNotifier(),
  wipLimit: Number(process.env.WIP_LIMIT ?? 3),
});

createApp(service).listen(port, () => {
  console.log(`TaskFlow on http://localhost:${port}`);
});
