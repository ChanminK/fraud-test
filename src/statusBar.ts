import * as vscode from 'vscode';

const DISPLAY_UPDATE_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export class StatusBarController {
  private item: vscode.StatusBarItem;
  private lastUpdateTime = 0;
  private totalHeartbeats = 0;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.item.text = 'Hackatime: tracking...';
    this.item.tooltip =
      'Hackatime Fraud Tracker – sending detailed coding heartbeats.';
    this.item.show();
  }

  dispose() {
    this.item.dispose();
  }

  onHeartbeatSent() {
    this.totalHeartbeats += 1;
    const now = Date.now();
    if (now - this.lastUpdateTime >= DISPLAY_UPDATE_INTERVAL_MS) {
      this.lastUpdateTime = now;
      this.item.text = `Hackatime: ${this.totalHeartbeats} hb`;
    }
  }
}
