import { Kirewire } from "../kirewire";

function parseDurationToken(token: string): number | null {
	const match = String(token || "")
		.trim()
		.toLowerCase()
		.match(/^(\d+)(ms|s|m)?$/);
	if (!match) return null;

	const value = Number(match[1] || 0);
	if (!Number.isFinite(value) || value < 0) return null;

	const unit = match[2] || "ms";
	if (unit === "s") return value * 1000;
	if (unit === "m") return value * 60_000;
	return value;
}

function parseInterval(modifiers: string[]): number {
	for (let i = 0; i < modifiers.length; i++) {
		const token = modifiers[i] || "";
		if (token === "visible" || token === "once") continue;
		if (token === "throttle" || token === "debounce") {
			i += 1;
			continue;
		}

		const parsed = parseDurationToken(token);
		if (parsed !== null) return parsed;
	}
	return 2000;
}

function parseTimedModifier(modifiers: string[], key: "throttle" | "debounce") {
	const index = modifiers.indexOf(key);
	if (index === -1) return 0;

	const parsed = parseDurationToken(modifiers[index + 1] || "");
	if (parsed !== null) return parsed;
	return 150;
}

Kirewire.directive("poll", ({ el, expression, modifiers, cleanup, wire }) => {
	const interval = parseInterval(modifiers);
	const visibleOnly = modifiers.includes("visible");
	const once = modifiers.includes("once");
	const throttleMs = parseTimedModifier(modifiers, "throttle");
	const debounceMs = parseTimedModifier(modifiers, "debounce");

	let inFlight = false;
	let stopped = false;
	let isVisible = !visibleOnly;
	let observer: IntersectionObserver | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let throttledUntil = 0;
	let timer: ReturnType<typeof setInterval> | null = null;

	const stop = () => {
		if (stopped) return;
		stopped = true;
		if (timer) {
			clearInterval(timer);
			timer = null;
		}

		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}

		observer?.disconnect();
		observer = null;

		document.removeEventListener("visibilitychange", onVisibilityChange);
		window.removeEventListener("online", onOnline);
	};

	const canRun = () => {
		if (stopped) return false;
		if (!document.body?.contains(el)) {
			stop();
			return false;
		}
		if (visibleOnly && !isVisible) return false;
		if (typeof document !== "undefined" && document.hidden) return false;
		if (typeof navigator !== "undefined" && navigator.onLine === false)
			return false;
		return true;
	};

	const run = async () => {
		if (!canRun()) return;
		if (inFlight) return;

		const meta = wire.getMetadata(el);
		if (!meta) return;

		inFlight = true;
		try {
			await wire.call(el, expression || "$refresh");
			if (once) stop();
		} finally {
			inFlight = false;
		}
	};

	const schedule = () => {
		if (!canRun()) return;

		const now = Date.now();
		if (throttleMs > 0) {
			if (now < throttledUntil) return;
			throttledUntil = now + throttleMs;
		}

		if (debounceMs > 0) {
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				debounceTimer = null;
				void run();
			}, debounceMs);
			return;
		}

		void run();
	};

	const onVisibilityChange = () => {
		if (!document.hidden) schedule();
	};
	const onOnline = () => schedule();

	if (visibleOnly && typeof IntersectionObserver !== "undefined") {
		observer = new IntersectionObserver((entries) => {
			for (let i = 0; i < entries.length; i++) {
				const entry = entries[i];
				if (!entry) continue;
				isVisible = !!entry.isIntersecting;
				if (isVisible) {
					schedule();
				}
				break;
			}
		});
		observer.observe(el);
	}

	document.addEventListener("visibilitychange", onVisibilityChange);
	window.addEventListener("online", onOnline);

	timer = setInterval(() => {
		schedule();
	}, interval);

	cleanup(stop);
});
