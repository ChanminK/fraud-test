import * as vscode from 'vscode';
import { Heartbeat } from './heartbeat';
import { HackatimeConfig, getConfig } from './config';

export class HackatimeClient {
  private config: HackatimeConfig;
  private output: vscode.OutputChannel;

  constructor(output: vscode.OutputChannel) {
    this.config = getConfig();
    this.output = output;
  }

  private normalizeBaseUrl(url: string): string {
    return url.replace(/\/+$/, '');
  }

  refreshConfig() {
    this.config = getConfig();
  }

  async sendHeartbeat(hb: Heartbeat): Promise<void> {
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
        this.output.appendLine(
          `[hackatime] API error ${res.status}: ${text}`
        );
      }
    } catch (err: any) {
      this.output.appendLine(
        `[hackatime] Failed to send heartbeat: ${String(err)}`
      );
    }
  }
}
