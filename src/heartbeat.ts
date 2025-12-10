import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as os from 'os';

export interface Heartbeat {
  entity: string;        
  type: 'file';
  time: number;      

  project?: string;
  branch?: string;
  language?: string;
  editor?: string;
  plugin?: string;
  machine?: string;

  is_write?: boolean;
  category?: 'coding';

  lineno?: number;
  cursorpos?: number;
  lines?: number;
  line_additions?: number;
  line_deletions?: number;

  user_agent?: string;
  source?: string;
}

export type FileState = {
  lastLineCount: number;
};

const fileState = new Map<string, FileState>();
let cachedMachineId: string | undefined;

function getMachineId(): string {
  if (cachedMachineId) return cachedMachineId;
  const basis = `${os.hostname()}::${os.userInfo().username}`;
  cachedMachineId = crypto
    .createHash('sha256')
    .update(basis)
    .digest('hex')
    .slice(0, 16);
  return cachedMachineId;
}

function getProjectName(doc: vscode.TextDocument): string | undefined {
  const folder = vscode.workspace.getWorkspaceFolder(doc.uri);
  if (folder) return folder.name;
  return undefined;
}

export function computeLineDelta(
  e: vscode.TextDocumentChangeEvent
): { lineAdditions: number; lineDeletions: number } {
  let added = 0;
  let removed = 0;

  for (const change of e.contentChanges) {
    const newLines = change.text.split(/\r\n|\r|\n/).length - 1;
    const oldLines = change.range.end.line - change.range.start.line;
    if (newLines > oldLines) added += newLines - oldLines;
    if (oldLines > newLines) removed += oldLines - newLines;
  }

  return { lineAdditions: added, lineDeletions: removed };
}

export function buildHeartbeatFromEditor(
  editor: vscode.TextEditor,
  opts: { isWrite: boolean; lineAdditions?: number; lineDeletions?: number }
): Heartbeat {
  const doc = editor.document;
  const file = doc.uri.fsPath;
  const pos = editor.selection.active;

  const lines = doc.lineCount;
  const currentState = fileState.get(file) ?? { lastLineCount: lines };
  fileState.set(file, { lastLineCount: lines });

  const nowSeconds = Date.now() / 1000;

  const hb: Heartbeat = {
    entity: file,
    type: 'file',
    time: nowSeconds,

    project: getProjectName(doc),
    language: doc.languageId,
    editor: 'vscode',
    plugin: 'vscode-hackatime-fraud/0.0.1',
    machine: getMachineId(),

    is_write: opts.isWrite,
    category: 'coding',

    lineno: pos.line + 1,
    cursorpos: pos.character + 1,
    lines,

    line_additions: opts.lineAdditions ?? 0,
    line_deletions: opts.lineDeletions ?? 0,

    user_agent: `vscode-hackatime-fraud/0.0.1 (VSCode ${vscode.version}; ${process.platform})`,
    source: 'vscode-hackatime-fraud'
  };

  return hb;
}
