import * as vscode from 'vscode';
import { HackatimeClient } from './hackatimeClient';
import { registerActivityTracker } from './activityTracker';
import { StatusBarController } from './statusBar';

export function activate(context: vscode.ExtensionContext) {
  const output = vscode.window.createOutputChannel('Hackatime Fraud');
  context.subscriptions.push(output);

  const client = new HackatimeClient(output);
  const statusBar = new StatusBarController();

  context.subscriptions.push({ dispose: () => statusBar.dispose() });

  registerActivityTracker(context, client, output, statusBar);

  output.appendLine('[hackatime] Hackatime Fraud Tracker activated.');
}

export function deactivate() { 
    //nothin here to see :)
}



