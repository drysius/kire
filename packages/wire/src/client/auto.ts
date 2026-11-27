/**
 * Auto-boot entry for the Kirewire client. Built as a standalone IIFE bundle
 * (dist/client/auto.js) that can be dropped in with a classic
 * `<script src="/kirewire.js" defer>` tag — it calls `start()` itself, reading
 * the update endpoint from the script tag's `data-kirewire-url` (default
 * `/_wire`). This is what the framework integration packages serve.
 *
 * When the tag also carries `data-kirewire-ws` (a path), the client connects
 * over the duplex WebSocket transport instead of HTTP POST; `data-kirewire-channel`
 * subscribes to a server-push channel on connect.
 */
import { start } from "./index";
import { WebSocketTransport } from "./transport";

function currentScript(): HTMLScriptElement | null {
	const el = document.currentScript as HTMLScriptElement | null;
	if (el) return el;
	// `defer`/`module` execution may leave currentScript null — find our tag.
	return document.querySelector<HTMLScriptElement>("script[data-kirewire-url]");
}

/** Resolve a path (or absolute ws/http URL) to a ws(s):// URL on the page origin. */
function toWsUrl(pathOrUrl: string): string {
	if (/^wss?:\/\//.test(pathOrUrl)) return pathOrUrl;
	if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl.replace(/^http/, "ws");
	const proto = location.protocol === "https:" ? "wss:" : "ws:";
	const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
	return `${proto}//${location.host}${path}`;
}

const script = currentScript();
const url = script?.dataset.kirewireUrl || "/_wire";
const wsPath = script?.dataset.kirewireWs;
const channel = script?.dataset.kirewireChannel;

if (wsPath) {
	start({
		transport: new WebSocketTransport(toWsUrl(wsPath)),
		channel,
		navigate: true,
	});
} else {
	start({ url, navigate: true });
}
