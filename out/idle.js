"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markActivity = markActivity;
exports.isIdle = isIdle;
const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
let lastActivityTime = Date.now();
function markActivity() {
    lastActivityTime = Date.now();
}
function isIdle() {
    return Date.now() - lastActivityTime >= IDLE_TIMEOUT_MS;
}
//# sourceMappingURL=idle.js.map