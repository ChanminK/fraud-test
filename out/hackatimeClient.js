"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HackatimeClient = void 0;
const config_1 = require("./config");
class HackatimeClient {
    constructor(output) {
        this.config = (0, config_1.getConfig)();
        this.output = output;
    }
    normalizeBaseUrl(url) {
        return url.replace(/\/+$/, '');
    }
    refreshConfig() {
        this.config = (0, config_1.getConfig)();
    }
    async sendHeartbeat(hb) {
        if (!this.config.apiKey) {
            this.output.appendLine('[hackatime] API key not set, skipping heartbeat.');
            return;
        }
        const base = this.normalizeBaseUrl(this.config.baseUrl);
        // WakaTime-compatible heartbeat endpoint (single heartbeat)
        const url = `${base}/api/v1/users/current/heartbeats`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'User-Agent': hb.user_agent ?? 'vscode-hackatime-fraud/0.0.1'
                },
                body: JSON.stringify(hb)
            });
            if (!res.ok) {
                const text = await res.text();
                this.output.appendLine(`[hackatime] API error ${res.status}: ${text}`);
            }
        }
        catch (err) {
            this.output.appendLine(`[hackatime] Failed to send heartbeat: ${String(err)}`);
        }
    }
}
exports.HackatimeClient = HackatimeClient;
//# sourceMappingURL=hackatimeClient.js.map