/**
 * Notification stub. "Sends" an email by logging it, synchronously, inside
 * the request that moved the task. A real mail provider would block the
 * request the same way: see docs/tech-debt.md (TD-4).
 */
export function createNotifier({ log = console.log } = {}) {
  const sent = [];
  return {
    sent,
    taskDone(task) {
      const message = {
        to: task.assignee ? `${task.assignee.toLowerCase()}@example.com` : "team@example.com",
        subject: `Done: ${task.title}`,
      };
      sent.push(message);
      log(`[notifier] email to ${message.to}: ${message.subject}`);
    },
  };
}
