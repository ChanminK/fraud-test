import * as vscode from 'vscode';
import { HackatimeClient } from './hackatimeClient';
import { buildHeartbeatFromEditor, computeLineDelta } from './heartbeat';
import { isIdle, markActivity } from './idle';
import { StatusBarController } from './statusBar';

export function registerActivityTracker(
  context: vscode.ExtensionContext,
  client: HackatimeClient,
  output: vscode.OutputChannel,
  statusBar: StatusBarController
) {
    //sending on every edit for now
  const changeSub = vscode.workspace.onDidChangeTextDocument(async (event) => {
    const editor = vscode.window.visibleTextEditors.find(
      (e) => e.document === event.document
    );
    if (!editor) return;

    const { lineAdditions, lineDeletions } = computeLineDelta(event);

    const hb = buildHeartbeatFromEditor(editor, {
      isWrite: true,
      lineAdditions,
      lineDeletions
    });

    markActivity();

    output.appendLine('[hackatime] edit heartbeat');
    output.appendLine(JSON.stringify(hb));

    await client.sendHeartbeat(hb);
    statusBar.onHeartbeatSent();
  });

  //sending on cursor movement
  const cursorSub = vscode.window.onDidChangeTextEditorSelection(
    async (event) => {
      const editor = event.textEditor;
      
      // idle is 3+ minutes, wake up sends normal heartbeat
      const hb = buildHeartbeatFromEditor(editor, {
        isWrite: false,
        lineAdditions: 0,
        lineDeletions: 0
      });

      markActivity();

      output.appendLine('[hackatime] cursor heartbeat');
      output.appendLine(JSON.stringify(hb));

      await client.sendHeartbeat(hb);
      statusBar.onHeartbeatSent();
    }
  );

  context.subscriptions.push(changeSub, cursorSub);
}
