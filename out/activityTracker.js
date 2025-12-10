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
exports.registerActivityTracker = registerActivityTracker;
const vscode = __importStar(require("vscode"));
const heartbeat_1 = require("./heartbeat");
const idle_1 = require("./idle");
function registerActivityTracker(context, client, output, statusBar) {
    //sending on every edit for now
    const changeSub = vscode.workspace.onDidChangeTextDocument(async (event) => {
        const editor = vscode.window.visibleTextEditors.find((e) => e.document === event.document);
        if (!editor)
            return;
        const { lineAdditions, lineDeletions } = (0, heartbeat_1.computeLineDelta)(event);
        const hb = (0, heartbeat_1.buildHeartbeatFromEditor)(editor, {
            isWrite: true,
            lineAdditions,
            lineDeletions
        });
        (0, idle_1.markActivity)();
        output.appendLine('[hackatime] edit heartbeat');
        output.appendLine(JSON.stringify(hb));
        await client.sendHeartbeat(hb);
        statusBar.onHeartbeatSent();
    });
    //sending on cursor movement
    const cursorSub = vscode.window.onDidChangeTextEditorSelection(async (event) => {
        const editor = event.textEditor;
        // idle is 3+ minutes, wake up sends normal heartbeat
        const hb = (0, heartbeat_1.buildHeartbeatFromEditor)(editor, {
            isWrite: false,
            lineAdditions: 0,
            lineDeletions: 0
        });
        (0, idle_1.markActivity)();
        output.appendLine('[hackatime] cursor heartbeat');
        output.appendLine(JSON.stringify(hb));
        await client.sendHeartbeat(hb);
        statusBar.onHeartbeatSent();
    });
    context.subscriptions.push(changeSub, cursorSub);
}
//# sourceMappingURL=activityTracker.js.map