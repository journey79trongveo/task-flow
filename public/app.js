const STATUSES = ["To Do", "In Progress", "Review", "Done"];
const NEXT = { "To Do": "In Progress", "In Progress": "Review", Review: "Done" };
const PREVIOUS = { "In Progress": "To Do", Review: "In Progress", Done: "Review" };

const board = document.querySelector("#board");
const errorBox = document.querySelector("#error");

async function api(path, options = {}) {
  const response = await fetch(`/api/tasks${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Request failed.");
  return body;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

function card(task) {
  const item = document.createElement("li");
  item.className = `card card--${task.priority.toLowerCase()}`;
  const title = document.createElement("strong");
  title.textContent = task.title;
  const meta = document.createElement("span");
  meta.className = "meta";
  meta.textContent = [task.jiraKey, task.assignee, task.storyPoints != null ? `${task.storyPoints} SP` : null]
    .filter(Boolean)
    .join(" · ");
  item.append(title, meta);

  const actions = document.createElement("div");
  actions.className = "actions";
  for (const [label, status] of [["←", PREVIOUS[task.status]], ["→", NEXT[task.status]]]) {
    if (!status) continue;
    const button = document.createElement("button");
    button.textContent = label;
    button.title = `Move to ${status}`;
    button.addEventListener("click", () => run(() => api(`/${task.id}/move`, { method: "POST", body: JSON.stringify({ status }) })));
    actions.append(button);
  }
  const remove = document.createElement("button");
  remove.textContent = "✕";
  remove.title = "Delete";
  remove.addEventListener("click", () => run(() => api(`/${task.id}`, { method: "DELETE" })));
  actions.append(remove);
  item.append(actions);
  return item;
}

async function render() {
  const tasks = await api("");
  board.replaceChildren(
    ...STATUSES.map((status) => {
      const column = document.createElement("section");
      column.className = "column";
      const heading = document.createElement("h2");
      const inColumn = tasks.filter((task) => task.status === status);
      heading.textContent = `${status} (${inColumn.length})`;
      const list = document.createElement("ul");
      list.append(...inColumn.map(card));
      column.append(heading, list);
      return column;
    }),
  );
}

async function run(action) {
  try {
    showError("");
    await action();
  } catch (error) {
    showError(error.message);
  }
  await render();
}

document.querySelector("#new-task").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const storyPoints = data.get("storyPoints");
  const body = {
    title: data.get("title"),
    priority: data.get("priority"),
    assignee: data.get("assignee") || null,
    storyPoints: storyPoints === "" ? null : Number(storyPoints),
    jiraKey: data.get("jiraKey") || null,
  };
  run(async () => {
    await api("", { method: "POST", body: JSON.stringify(body) });
    form.reset();
  });
});

render().catch((error) => showError(error.message));
