import * as vscode from 'vscode';
import { writeHeartbeat, initHeartbeatWriter } from './heartbeatWriter';

let statusBarItem: vscode.StatusBarItem | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('=== FRAUD-TEST VSCODE LOGGER v2 ACTIVATING ===');

  // start it all
  initHeartbeatWriter(context);

  // Stat bar
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.text = '$(watch) fraud log: ON';
  statusBarItem.tooltip =
    'Fraud Test VS Code Logger – logging heartbeats.';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Doc
  const changeSub = vscode.workspace.onDidChangeTextDocument((event) => {
    console.log('[fraud-test-vscode] onDidChangeTextDocument fired.');

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== event.document) {
      console.log(
        '[fraud-test-vscode] change event ignored (no active editor or different doc).'
      );
      return;
    }

    void writeHeartbeat({
      document: event.document,
      editor,
      isWrite: true,
      category: 'coding',
      reason: 'change',
    });
  });

  // Editor 
  const activeSub = vscode.window.onDidChangeActiveTextEditor((editor) => {
    console.log('[fraud-test-vscode] onDidChangeActiveTextEditor fired.');

    if (!editor) {
      console.log('[fraud-test-vscode] no active editor.');
      return;
    }

    void writeHeartbeat({
      document: editor.document,
      editor,
      isWrite: false,
      category: 'active',
      reason: 'focus',
    });
  });

  // For save
  const saveSub = vscode.workspace.onDidSaveTextDocument((doc) => {
    console.log('[fraud-test-vscode] onDidSaveTextDocument fired.');

    const editor = vscode.window.activeTextEditor;

    void writeHeartbeat({
      document: doc,
      editor,
      isWrite: true,
      category: 'save',
      reason: 'save',
    });
  });

  // Opening files
  const openSub = vscode.workspace.onDidOpenTextDocument((doc) => {
    console.log('[fraud-test-vscode] onDidOpenTextDocument fired.');

    const editor = vscode.window.activeTextEditor;

    void writeHeartbeat({
      document: doc,
      editor,
      isWrite: false,
      category: 'open',
      reason: 'open',
    });
  });

  context.subscriptions.push(changeSub, activeSub, saveSub, openSub);

  console.log('[fraud-test-vscode] Extension activated (v2).');
}

export function deactivate() {
  console.log('[fraud-test-vscode] Extension deactivated.');
}
