import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';

type HeartbeatReason = 'change' | 'save' | 'open' | 'focus';

interface HeartbeatParams {
  document: vscode.TextDocument;
  editor?: vscode.TextEditor | undefined;
  isWrite: boolean;
  category: string;
  reason: HeartbeatReason;
}

let outputFilePath: string | undefined;

export function initHeartbeatWriter(context: vscode.ExtensionContext) {
  try {
    console.log('[fraud-test-vscode] initHeartbeatWriter() called.');
    console.log('[fraud-test-vscode] context.extensionPath =', context.extensionPath);

    // context.extensionPath aka .../fraud-test/vscode-logger
    const repoRoot = path.resolve(context.extensionPath, '..');
    console.log('[fraud-test-vscode] repoRoot =', repoRoot);

    const dataDir = path.join(repoRoot, 'data');
    const outputDir = path.join(dataDir, 'output');

    console.log('[fraud-test-vscode] dataDir =', dataDir);
    console.log('[fraud-test-vscode] outputDir =', outputDir);

    fs.mkdirSync(outputDir, { recursive: true });

    outputFilePath = path.join(outputDir, 'vscode-heartbeats.ndjson');
    console.log('[fraud-test-vscode] Heartbeats file path:', outputFilePath);
  } catch (err) {
    console.error('[fraud-test-vscode] Failed to init heartbeat writer:', err);
  }
}

export async function writeHeartbeat(params: HeartbeatParams): Promise<void> {
  if (!outputFilePath) {
    console.warn(
      '[fraud-test-vscode] writeHeartbeat called before initHeartbeatWriter.'
    );
    return;
  }

  const { document, editor, isWrite, category, reason } = params;

  try {
    const now = new Date();
    const position =
      editor?.selection?.active ?? new vscode.Position(0, 0);

    const heartbeat = {
      timestamp: now.toISOString(),
      project: vscode.workspace.name ?? null,
      language: document.languageId,
      filePath: document.fileName,
      line: position.line + 1,
      column: position.character + 1,
      isWrite,
      category,
      reason,
      linesInFile: document.lineCount,
      editor: 'vscode',
      machine: os.hostname(),
      userAgent: `vscode/${vscode.version}`,
    };

    const line = JSON.stringify(heartbeat) + '\n';

    console.log(
      '[fraud-test-vscode] About to append heartbeat to:',
      outputFilePath
    );

    await new Promise<void>((resolve, reject) => {
      fs.appendFile(outputFilePath as string, line, (err) => {
        if (err) {
          console.error(
            '[fraud-test-vscode] Error writing heartbeat:',
            err
          );
          reject(err);
        } else {
          console.log('[fraud-test-vscode] Wrote heartbeat OK.');
          resolve();
        }
      });
    });
  } catch (err) {
    console.error(
      '[fraud-test-vscode] Unexpected error in writeHeartbeat:',
      err
    );
  }
}
