import * as vscode from "vscode";

type LogLevel = "info" | "warn" | "error" | "debug";

let channel: vscode.OutputChannel | null = null;
let debugEnabled = false;

function nowIso() {
	return new Date().toISOString();
}

function shouldLog(level: LogLevel) {
	if (level !== "debug") return true;
	return debugEnabled;
}

export function initKireLogChannel(context: vscode.ExtensionContext) {
	if (!channel) {
		channel = vscode.window.createOutputChannel("Kire");
		context.subscriptions.push(channel);
	}
	refreshKireLogConfig();
}

export function refreshKireLogConfig() {
	const config = vscode.workspace.getConfiguration("kire");
	debugEnabled = config.get<boolean>("logs.debug", false);
}

export function kireLog(level: LogLevel, message: string) {
	if (!channel || !shouldLog(level)) return;
	channel.appendLine(`[${nowIso()}] [${level.toUpperCase()}] ${message}`);
}

export function showKireLogs() {
	channel?.show(true);
}
