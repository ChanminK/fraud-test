const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

let lastActivityTime = Date.now();

export function markActivity() {
  lastActivityTime = Date.now();
}

export function isIdle(): boolean {
  return Date.now() - lastActivityTime >= IDLE_TIMEOUT_MS;
}
