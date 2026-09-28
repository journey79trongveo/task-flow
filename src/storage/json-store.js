import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

/**
 * JSON file store. The whole list is read into memory and the whole file is
 * rewritten on every change. There is no locking and no schema version:
 * see docs/tech-debt.md (TD-1, TD-5).
 */
export function createJsonStore(filePath) {
  function readAll() {
    if (!existsSync(filePath)) return [];
    const raw = readFileSync(filePath, "utf8");
    return raw.trim() ? JSON.parse(raw) : [];
  }

  function writeAll(tasks) {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(tasks, null, 2));
  }

  return { readAll, writeAll };
}

/** In-memory store with the same interface, used by tests. */
export function createMemoryStore(initial = []) {
  let tasks = structuredClone(initial);
  return {
    readAll: () => structuredClone(tasks),
    writeAll: (next) => {
      tasks = structuredClone(next);
    },
  };
}
