'use strict';

const FINALE_NOTIFICATION_CONFIG = Object.freeze({
  notificationsEnabled: true,
  endpoint: 'https://love-quest-notify.mark-lazarev-9945.workers.dev/notify',
  timeoutMs: 8000
});

function isFinaleChoice(choice) {
  if (!choice || !['home', 'city', 'trip'].includes(choice.option)) return false;
  return choice.option === 'trip' ? ['thermal', 'paleontology'].includes(choice.suboption) :
    choice.suboption === null;
}

function isFinaleSubmission(choice) {
  return isFinaleChoice(choice) && typeof choice.submissionId === 'string' &&
    /^[a-f0-9]{32}$/.test(choice.submissionId) && typeof choice.confirmedAt === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(choice.confirmedAt) &&
    Number.isFinite(Date.parse(choice.confirmedAt)) &&
    new Date(choice.confirmedAt).toISOString() === choice.confirmedAt;
}

function createFinaleNotifications(config = FINALE_NOTIFICATION_CONFIG) {
  let endpoint = null;
  if (config.notificationsEnabled && typeof config.endpoint === 'string') {
    try {
      const url = new URL(config.endpoint);
      if (url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash) {
        endpoint = url.href;
      }
    } catch { /* Invalid configuration keeps delivery disabled. */ }
  }

  const active = new Map();

  async function send(choice) {
    if (!endpoint || !isFinaleSubmission(choice) || active.has(choice.submissionId)) return null;
    if (navigator.onLine === false) return 'failed';

    const workerChoice = choice.option === 'trip' ?
      (choice.suboption === 'thermal' ? 'trip_thermal' : 'trip_paleo') :
      (choice.option === 'city' ? 'museum' : 'home');
    const controller = new AbortController();
    active.set(choice.submissionId, controller);
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({choice: workerChoice}),
        credentials: 'omit',
        redirect: 'error',
        signal: controller.signal
      });
      if (response.status !== 200) return 'failed';
      const result = await response.json();
      return result?.ok === true && result.status === 'sent' ? 'sent' : 'failed';
    } catch {
      return 'failed';
    } finally {
      clearTimeout(timeout);
      active.delete(choice.submissionId);
    }
  }

  return {
    enabled: endpoint !== null,
    send,
    cancel() {
      for (const controller of active.values()) controller.abort();
    }
  };
}
