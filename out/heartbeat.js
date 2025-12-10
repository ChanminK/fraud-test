"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeLineDelta = computeLineDelta;
exports.buildHeartbeatFromEditor = buildHeartbeatFromEditor;
const vscode = __importStar(require("vscode"));
const crypto = __importStar(require("crypto"));
const os = __importStar(require("os"));
const fileState = new Map();
let cachedMachineId;
function getMachineId() {
    if (cachedMachineId)
        return cachedMachineId;
    const basis = `${os.hostname()}::${os.userInfo().username}`;
    cachedMachineId = crypto
        .createHash('sha256')
        .update(basis)
        .digest('hex')
        .slice(0, 16);
    return cachedMachineId;
}
function getProjectName(doc) {
    const folder = vscode.workspace.getWorkspaceFolder(doc.uri);
    if (folder)
        return folder.name;
    return undefined;
}
function computeLineDelta(e) {
    let added = 0;
    let removed = 0;
    for (const change of e.contentChanges) {
        const newLines = change.text.split(/\r\n|\r|\n/).length - 1;
        const oldLines = change.range.end.line - change.range.start.line;
        if (newLines > oldLines)
            added += newLines - oldLines;
        if (oldLines > newLines)
            removed += oldLines - newLines;
    }
    return { lineAdditions: added, lineDeletions: removed };
}
function buildHeartbeatFromEditor(editor, opts) {
    const doc = editor.document;
    const file = doc.uri.fsPath;
    const pos = editor.selection.active;
    const lines = doc.lineCount;
    const currentState = fileState.get(file) ?? { lastLineCount: lines };
    fileState.set(file, { lastLineCount: lines });
    const nowSeconds = Date.now() / 1000;
    const hb = {
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
//# sourceMappingURL=heartbeat.js.map