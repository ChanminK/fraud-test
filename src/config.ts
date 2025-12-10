import * as vscode from 'vscode';

export interface HackatimeConfig {
  apiKey: string;
  baseUrl: string;
}

export function getConfig(): HackatimeConfig {
  const cfg = vscode.workspace.getConfiguration('hackatime');
  return {
    apiKey: cfg.get<string>('apiKey', ''),
    baseUrl: cfg.get<string>('baseUrl', 'https://hackatime.hackclub.com')
  };
}
