import { createRequire } from "node:module";
import type * as vscode from "vscode";

type LogLevel = "info" | "warn" | "error" | "debug";

const runtimeRequire = createRequire(import.meta.url);
let channel: vscode.OutputChannel | null = null;
let debugEnabled = false;
let vscodeApi: typeof import("vscode") | null | undefined;

function nowIso() {
	return new Date().toISOString();
}

function getVscodeApi() {
	if (vscodeApi !== undefined) return vscodeApi;
	try {
		vscodeApi = runtimeRequire("vscode") as typeof import("vscode");
	} catch {
		vscodeApi = null;
	}
	return vscodeApi;
}

function shouldLog(level: LogLevel) {
	if (level !== "debug") return true;
	return debugEnabled;
}

export function initKireLogChannel(context: vscode.ExtensionContext) {
	const vscodeApi = getVscodeApi();
	if (!vscodeApi) return;
	if (!channel) {
		channel = vscodeApi.window.createOutputChannel("Kire");
		context.subscriptions.push(channel);
	}
	refreshKireLogConfig();
}

export function refreshKireLogConfig() {
	const vscodeApi = getVscodeApi();
	if (!vscodeApi) {
		debugEnabled = false;
		return;
	}
	const config = vscodeApi.workspace.getConfiguration("kire");
	debugEnabled = config.get<boolean>("logs.debug", false);
}

export function kireLog(level: LogLevel, message: string) {
	if (!channel || !shouldLog(level)) return;
	channel.appendLine(`[${nowIso()}] [${level.toUpperCase()}] ${message}`);
}

export function showKireLogs() {
	channel?.show(true);
}
