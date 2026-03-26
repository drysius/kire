import { Kirewire } from "../kirewire";

type Direction = "up" | "down" | "left" | "right";
type CanvasInputType = "pointer" | "keydown" | "keyup";

type Point = { x: number; y: number };

type CanvasBinding = {
	componentId: string;
	channel: string;
	method?: string;
	rawExpression: string;
	canvas: HTMLCanvasElement;
	state: Record<string, unknown>;
	lastPayload: unknown;
	frameHandle: number | null;
	lastFrameAt: number;
	disposed: boolean;
	disposeFns: Array<() => void>;
	pressedKeys: Set<string>;
};

export type WireCanvasInput = {
	channel: string;
	componentId: string;
	method?: string;
	type: CanvasInputType;
	key?: string;
	code?: string;
	button?: number;
	x?: number;
	y?: number;
	canvasWidth?: number;
	canvasHeight?: number;
	ctrlKey: boolean;
	altKey: boolean;
	shiftKey: boolean;
	metaKey: boolean;
	at: number;
};

export type WireCanvasRendererContext = {
	ctx: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
	state: Record<string, unknown>;
	payload: unknown;
	channel: string;
	now: number;
	dt: number;
	width: number;
	height: number;
	wire: typeof Kirewire;
};

export type WireCanvasRenderer = (ctx: WireCanvasRendererContext) => void;

export type WireCanvasApi = {
	setRenderer: (channel: string, renderer: WireCanvasRenderer) => void;
	clearRenderer: (channel: string) => void;
	getState: (channel: string) => Record<string, unknown> | undefined;
	pushState: (channel: string, state: Record<string, unknown>) => void;
	emit: (channel: string, payload?: Record<string, unknown>) => void;
};

const CHANNEL_PATTERN = /^[a-zA-Z0-9:_-]{1,120}$/;
const METHOD_PATTERN = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
const RESERVED_KEYS = new Set([
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	" ",
	"Spacebar",
]);
const GAME_CONTROL_KEYS = new Set([
	"arrowup",
	"arrowdown",
	"arrowleft",
	"arrowright",
	"w",
	"a",
	"s",
	"d",
	" ",
	"space",
	"spacebar",
]);
const GAME_CONTROL_CODES = new Set([
	"arrowup",
	"arrowdown",
	"arrowleft",
	"arrowright",
	"keyw",
	"keya",
	"keys",
	"keyd",
	"space",
]);

const renderersByChannel = new Map<string, WireCanvasRenderer>();
const bindingsByCanvas = new WeakMap<HTMLCanvasElement, CanvasBinding>();
const bindingsByComponent = new Map<string, Set<CanvasBinding>>();
const bindingsByChannel = new Map<string, Set<CanvasBinding>>();
let activeKeyboardBinding: CanvasBinding | null = null;
let globalKeyboardInitialized = false;

declare global {
	interface Window {
		KirewireCanvas?: WireCanvasApi;
	}
}

function toRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object") return {};
	return value as Record<string, unknown>;
}

function toNumber(value: unknown, fallback = 0): number {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}

function isDirection(value: unknown): value is Direction {
	return (
		value === "up" || value === "down" || value === "left" || value === "right"
	);
}

function parseExpression(
	expression: string,
): { channel: string; method?: string } | null {
	const raw = String(expression || "").trim();
	if (!raw) return null;

	const [rawChannel, rawMethod = ""] = raw
		.split("|", 2)
		.map((part) => String(part || "").trim());
	if (!CHANNEL_PATTERN.test(rawChannel)) return null;

	if (rawMethod && !METHOD_PATTERN.test(rawMethod)) return null;
	return { channel: rawChannel, method: rawMethod || undefined };
}

function resolveRootElement(el: HTMLElement): HTMLElement | null {
	if (el.hasAttribute("wire:id") || el.hasAttribute("wire-id")) return el;
	try {
		const fromClosest = el.closest(
			"[wire\\:id], [wire-id]",
		) as HTMLElement | null;
		if (fromClosest) return fromClosest;
	} catch {
		// Some selector engines may reject ":" in attribute names.
	}

	let current: HTMLElement | null = el.parentElement;
	while (current) {
		if (current.hasAttribute("wire:id") || current.hasAttribute("wire-id"))
			return current;
		current = current.parentElement;
	}

	return null;
}

function readRootState(root: HTMLElement): Record<string, unknown> {
	const raw = root.getAttribute("wire:state");
	if (!raw) return {};

	try {
		return toRecord(JSON.parse(raw));
	} catch {
		return {};
	}
}

function ensureSetEntry(
	map: Map<string, Set<CanvasBinding>>,
	key: string,
): Set<CanvasBinding> {
	let set = map.get(key);
	if (!set) {
		set = new Set<CanvasBinding>();
		map.set(key, set);
	}
	return set;
}

function unregisterBinding(binding: CanvasBinding) {
	if (binding.disposed) return;
	binding.disposed = true;

	if (binding.frameHandle !== null) {
		cancelAnimationFrame(binding.frameHandle);
		binding.frameHandle = null;
	}

	for (const dispose of binding.disposeFns) {
		try {
			dispose();
		} catch {
			// No-op on listener disposal errors.
		}
	}
	binding.disposeFns = [];
	binding.pressedKeys.clear();

	const byComponent = bindingsByComponent.get(binding.componentId);
	byComponent?.delete(binding);
	if (byComponent && byComponent.size === 0)
		bindingsByComponent.delete(binding.componentId);

	const byChannel = bindingsByChannel.get(binding.channel);
	byChannel?.delete(binding);
	if (byChannel && byChannel.size === 0)
		bindingsByChannel.delete(binding.channel);

	if (activeKeyboardBinding === binding) {
		setActiveKeyboardBinding(pickFallbackBinding(binding.channel));
	}
}

function findComponentRoot(componentId: string): HTMLElement | null {
	try {
		const fromSelector = document.querySelector(
			`[wire\\:id="${componentId}"], [wire-id="${componentId}"]`,
		) as HTMLElement | null;
		if (fromSelector) return fromSelector;
	} catch {
		// Some selector engines may reject ":" in attribute names.
	}

	const byWireId = document.querySelector(
		`[wire-id="${componentId}"]`,
	) as HTMLElement | null;
	if (byWireId) return byWireId;

	const all = document.querySelectorAll("*");
	for (const node of all) {
		const element = node as HTMLElement;
		if (element.getAttribute("wire:id") === componentId) return element;
	}

	return null;
}

function parseChannel(value: unknown): string | null {
	const channel = String(value || "").trim();
	if (!CHANNEL_PATTERN.test(channel)) return null;
	return channel;
}

function normalizeKey(value: string): string {
	return String(value || "").toLowerCase();
}

function keyboardIdentity(event: KeyboardEvent): string {
	const code = normalizeKey(event.code);
	if (code) return code;
	return `key:${normalizeKey(event.key)}`;
}

function isGameplayKey(event: KeyboardEvent): boolean {
	const key = normalizeKey(event.key);
	const code = normalizeKey(event.code);
	return GAME_CONTROL_KEYS.has(key) || GAME_CONTROL_CODES.has(code);
}

function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
	if (target.isContentEditable) return true;
	return target.closest("[contenteditable='true']") !== null;
}

function firstBindingInSet(
	set: Set<CanvasBinding> | undefined,
): CanvasBinding | null {
	if (!set || set.size === 0) return null;
	return set.values().next().value ?? null;
}

function pickFallbackBinding(preferredChannel?: string): CanvasBinding | null {
	if (preferredChannel) {
		const preferred = firstBindingInSet(
			bindingsByChannel.get(preferredChannel),
		);
		if (preferred) return preferred;
	}

	for (const set of bindingsByChannel.values()) {
		const binding = firstBindingInSet(set);
		if (binding) return binding;
	}

	return null;
}

function setActiveKeyboardBinding(binding: CanvasBinding | null) {
	activeKeyboardBinding = binding;
}

function resolveKeyboardBinding(event: KeyboardEvent): CanvasBinding | null {
	const directTarget =
		event.target instanceof HTMLCanvasElement
			? bindingsByCanvas.get(event.target)
			: null;
	if (directTarget && !directTarget.disposed) return directTarget;

	if (
		activeKeyboardBinding &&
		!activeKeyboardBinding.disposed &&
		document.body.contains(activeKeyboardBinding.canvas)
	) {
		return activeKeyboardBinding;
	}

	return pickFallbackBinding();
}

function bootstrapCanvasElement(el: HTMLCanvasElement) {
	const root = resolveRootElement(el);
	if (!root) return;

	const componentId = Kirewire.getComponentId(root);
	if (!componentId) return;

	const expression = String(el.getAttribute("wire:canvas") || "");
	const parsed = parseExpression(expression);
	if (!parsed) return;

	const current = bindingsByCanvas.get(el);
	if (
		current &&
		current.componentId === componentId &&
		current.channel === parsed.channel &&
		current.method === parsed.method &&
		current.rawExpression === expression
	) {
		return;
	}

	bindCanvas(
		el,
		parsed.channel,
		parsed.method,
		componentId,
		readRootState(root),
	);
}

function bootstrapCanvases(scope: ParentNode = document) {
	const canvases = scope.querySelectorAll(
		"canvas",
	) as NodeListOf<HTMLCanvasElement>;
	for (const canvas of canvases) {
		if (!canvas.hasAttribute("wire:canvas")) continue;
		bootstrapCanvasElement(canvas);
	}
}

function extractPayloadState(payload: unknown): Record<string, unknown> | null {
	const record = toRecord(payload);
	if (Object.keys(record).length === 0) return null;

	const direct = toRecord(record.state);
	if (Object.keys(direct).length > 0) return direct;

	const frame = toRecord(record.frame);
	if (Object.keys(frame).length > 0) return frame;

	return null;
}

function ensureCanvasResolution(canvas: HTMLCanvasElement): {
	width: number;
	height: number;
	dpr: number;
} {
	const dpr = Math.max(1, window.devicePixelRatio || 1);
	const displayWidth = Math.max(
		1,
		Math.round(canvas.clientWidth || canvas.width || 320),
	);
	const displayHeight = Math.max(
		1,
		Math.round(canvas.clientHeight || canvas.height || 320),
	);
	const targetWidth = Math.round(displayWidth * dpr);
	const targetHeight = Math.round(displayHeight * dpr);

	if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
		canvas.width = targetWidth;
		canvas.height = targetHeight;
	}

	return {
		width: displayWidth,
		height: displayHeight,
		dpr,
	};
}

function drawRect(
	ctx: CanvasRenderingContext2D,
	color: string,
	x: number,
	y: number,
	size: number,
) {
	ctx.fillStyle = color;
	ctx.fillRect(x, y, size, size);
}

function drawTank(
	ctx: CanvasRenderingContext2D,
	tank: Record<string, unknown>,
	color: string,
	tile: number,
	offsetX: number,
	offsetY: number,
	isCurrent = false,
) {
	const x = toNumber(tank.x, -99);
	const y = toNumber(tank.y, -99);
	const sizeTiles = Math.max(0.55, Math.min(1.1, toNumber(tank.size, 0.82)));
	const direction = isDirection(tank.dir) ? tank.dir : "up";
	if (x < 0 || y < 0) return;

	const px = offsetX + x * tile;
	const py = offsetY + y * tile;
	const width = tile * sizeTiles;
	const height = tile * sizeTiles;
	const pad = Math.max(1, Math.floor(width * 0.14));

	ctx.fillStyle = color;
	ctx.fillRect(px + pad, py + pad, width - pad * 2, height - pad * 2);

	if (isCurrent) {
		ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
		ctx.lineWidth = Math.max(2, Math.floor(tile * 0.08));
		ctx.strokeRect(
			px + 1,
			py + 1,
			Math.max(1, width - 2),
			Math.max(1, height - 2),
		);
	}

	const turretLength = Math.max(4, Math.floor(width * 0.58));
	const centerX = px + width / 2;
	const centerY = py + height / 2;

	ctx.strokeStyle = "#0b0f1a";
	ctx.lineWidth = Math.max(2, Math.floor(tile * 0.12));
	ctx.lineCap = "round";
	ctx.beginPath();
	if (direction === "up") {
		ctx.moveTo(centerX, centerY);
		ctx.lineTo(centerX, centerY - turretLength);
	} else if (direction === "down") {
		ctx.moveTo(centerX, centerY);
		ctx.lineTo(centerX, centerY + turretLength);
	} else if (direction === "left") {
		ctx.moveTo(centerX, centerY);
		ctx.lineTo(centerX - turretLength, centerY);
	} else {
		ctx.moveTo(centerX, centerY);
		ctx.lineTo(centerX + turretLength, centerY);
	}
	ctx.stroke();
}

function defaultRenderer({
	ctx,
	state,
	width,
	height,
}: WireCanvasRendererContext) {
	ctx.clearRect(0, 0, width, height);
	ctx.fillStyle = "#0b1020";
	ctx.fillRect(0, 0, width, height);

	const mapRows = Array.isArray(state.map) ? state.map : [];
	const boardSize = Math.max(
		8,
		Math.round(toNumber(state.boardSize, mapRows.length || 13)),
	);
	const tile = Math.max(10, Math.floor(Math.min(width, height) / boardSize));
	const gridWidth = tile * boardSize;
	const gridHeight = tile * boardSize;
	const offsetX = Math.floor((width - gridWidth) / 2);
	const offsetY = Math.floor((height - gridHeight) / 2);

	// Arena background
	ctx.fillStyle = "#15203b";
	ctx.fillRect(offsetX, offsetY, gridWidth, gridHeight);

	// Grid lines
	ctx.strokeStyle = "rgba(173, 196, 255, 0.10)";
	ctx.lineWidth = 1;
	for (let i = 0; i <= boardSize; i++) {
		const gx = offsetX + i * tile + 0.5;
		const gy = offsetY + i * tile + 0.5;
		ctx.beginPath();
		ctx.moveTo(gx, offsetY);
		ctx.lineTo(gx, offsetY + gridHeight);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(offsetX, gy);
		ctx.lineTo(offsetX + gridWidth, gy);
		ctx.stroke();
	}

	// Tiles
	for (let y = 0; y < mapRows.length; y++) {
		const row = mapRows[y];
		if (!Array.isArray(row)) continue;

		for (let x = 0; x < row.length; x++) {
			const cell = toNumber(row[x], 0);
			const px = offsetX + x * tile;
			const py = offsetY + y * tile;

			if (cell === 1) drawRect(ctx, "#cc6f45", px + 1, py + 1, tile - 2); // Brick
			if (cell === 2) drawRect(ctx, "#8a96b8", px + 1, py + 1, tile - 2); // Steel
			if (cell === 3) drawRect(ctx, "#2f5bd9", px + 1, py + 1, tile - 2); // Water
		}
	}

	const currentPlayerId = String(state.currentPlayerId || "");
	const players = Array.isArray(state.players)
		? state.players.map((value) => toRecord(value))
		: [];
	if (players.length > 0) {
		for (const playerValue of players) {
			const playerId = String(playerValue.id || "");
			const color = String(playerValue.color || "#62d26f");
			drawTank(
				ctx,
				playerValue,
				color,
				tile,
				offsetX,
				offsetY,
				playerId === currentPlayerId,
			);
		}
	} else {
		const fallbackPlayer = toRecord(state.player);
		drawTank(ctx, fallbackPlayer, "#62d26f", tile, offsetX, offsetY, true);
	}

	const enemies = Array.isArray(state.enemies) ? state.enemies : [];
	for (const enemy of enemies) {
		drawTank(ctx, toRecord(enemy), "#ef5e6a", tile, offsetX, offsetY);
	}

	const bullets = Array.isArray(state.bullets) ? state.bullets : [];
	for (const bulletValue of bullets) {
		const bullet = toRecord(bulletValue);
		const bx = toNumber(bullet.x, -99);
		const by = toNumber(bullet.y, -99);
		if (bx < 0 || by < 0) continue;
		const cx = offsetX + (bx + 0.5) * tile;
		const cy = offsetY + (by + 0.5) * tile;
		const radius = Math.max(2, tile * toNumber(bullet.radius, 0.12));

		ctx.fillStyle = bullet.owner === "enemy" ? "#ffd166" : "#f7f8fc";
		ctx.beginPath();
		ctx.arc(cx, cy, radius, 0, Math.PI * 2);
		ctx.fill();
	}

	const score = Math.max(0, Math.round(toNumber(state.score, 0)));
	const lives = Math.max(0, Math.round(toNumber(state.lives, 0)));
	const wave = Math.max(1, Math.round(toNumber(state.wave, 1)));
	const onlinePlayers = Math.max(
		1,
		Math.round(toNumber(state.onlinePlayers, players.length || 1)),
	);
	const status = String(state.status || "Use arrows/WASD + Space");

	ctx.fillStyle = "#e9efff";
	ctx.font = '600 14px "Space Grotesk", sans-serif';
	ctx.textBaseline = "top";
	ctx.fillText(
		`Score ${score}   Lives ${lives}   Wave ${wave}   Players ${onlinePlayers}`,
		offsetX,
		Math.max(8, offsetY - 24),
	);
	ctx.font = '500 12px "Space Grotesk", sans-serif';
	ctx.fillStyle = "rgba(233, 239, 255, 0.84)";
	ctx.fillText(status, offsetX, offsetY + gridHeight + 8);

	if (state.gameOver === true) {
		ctx.fillStyle = "rgba(3, 8, 18, 0.72)";
		ctx.fillRect(offsetX, offsetY, gridWidth, gridHeight);
		ctx.fillStyle = "#ffcc66";
		ctx.font = '700 24px "Space Grotesk", sans-serif';
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(
			"GAME OVER",
			offsetX + gridWidth / 2,
			offsetY + gridHeight / 2 - 10,
		);
		ctx.font = '500 13px "Space Grotesk", sans-serif';
		ctx.fillStyle = "#ffffff";
		ctx.fillText(
			"Press Reset to restart",
			offsetX + gridWidth / 2,
			offsetY + gridHeight / 2 + 18,
		);
		ctx.textAlign = "left";
		ctx.textBaseline = "alphabetic";
	}
}

function drawBinding(binding: CanvasBinding, now: number) {
	const context = binding.canvas.getContext("2d");
	if (!context) return;

	const { width, height, dpr } = ensureCanvasResolution(binding.canvas);
	const dt = binding.lastFrameAt > 0 ? now - binding.lastFrameAt : 16.67;
	binding.lastFrameAt = now;

	const renderer = renderersByChannel.get(binding.channel) || defaultRenderer;
	context.setTransform(dpr, 0, 0, dpr, 0, 0);

	try {
		renderer({
			ctx: context,
			canvas: binding.canvas,
			state: binding.state,
			payload: binding.lastPayload,
			channel: binding.channel,
			now,
			dt,
			width,
			height,
			wire: Kirewire,
		});
	} catch (error) {
		console.error("[Kirewire] canvas renderer failed:", error);
		defaultRenderer({
			ctx: context,
			canvas: binding.canvas,
			state: binding.state,
			payload: binding.lastPayload,
			channel: binding.channel,
			now,
			dt,
			width,
			height,
			wire: Kirewire,
		});
	}
}

function startRenderLoop(binding: CanvasBinding) {
	if (binding.frameHandle !== null) return;

	const step = (now: number) => {
		if (binding.disposed || !document.body.contains(binding.canvas)) {
			unregisterBinding(binding);
			return;
		}

		drawBinding(binding, now);
		binding.frameHandle = requestAnimationFrame(step);
	};

	binding.frameHandle = requestAnimationFrame(step);
}

function canvasPointFromPointer(
	event: PointerEvent,
	canvas: HTMLCanvasElement,
): Point {
	const rect = canvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	return { x, y };
}

function emitCanvasInput(binding: CanvasBinding, payload: WireCanvasInput) {
	Kirewire.emit("canvas:input", payload);
	Kirewire.emit(`canvas:input:${binding.channel}`, payload);

	if (!binding.method) return;
	const root = findComponentRoot(binding.componentId);
	if (!root) return;
	void Kirewire.call(root, binding.method, [payload]);
}

function emitKeyboardInput(
	binding: CanvasBinding,
	type: "keydown" | "keyup",
	event: KeyboardEvent,
) {
	if (RESERVED_KEYS.has(event.key)) event.preventDefault();
	const rect = binding.canvas.getBoundingClientRect();

	emitCanvasInput(binding, {
		channel: binding.channel,
		componentId: binding.componentId,
		method: binding.method,
		type,
		key: event.key,
		code: event.code,
		canvasWidth: rect.width,
		canvasHeight: rect.height,
		ctrlKey: Boolean(event.ctrlKey),
		altKey: Boolean(event.altKey),
		shiftKey: Boolean(event.shiftKey),
		metaKey: Boolean(event.metaKey),
		at: Date.now(),
	});
}

function shouldSkipRepeatedKeydown(
	binding: CanvasBinding,
	event: KeyboardEvent,
): boolean {
	const identity = keyboardIdentity(event);
	if (event.repeat || binding.pressedKeys.has(identity)) {
		if (RESERVED_KEYS.has(event.key)) event.preventDefault();
		return true;
	}
	binding.pressedKeys.add(identity);
	return false;
}

function markKeyReleased(binding: CanvasBinding, event: KeyboardEvent) {
	const identity = keyboardIdentity(event);
	binding.pressedKeys.delete(identity);
}

function ensureGlobalKeyboardHandlers() {
	if (globalKeyboardInitialized || typeof window === "undefined") return;
	globalKeyboardInitialized = true;

	const onWindowKeyDown = (event: KeyboardEvent) => {
		if (!isGameplayKey(event)) return;
		if (isEditableTarget(event.target)) return;
		if (
			event.target instanceof HTMLCanvasElement &&
			bindingsByCanvas.has(event.target)
		)
			return;

		const binding = resolveKeyboardBinding(event);
		if (!binding) return;
		if (shouldSkipRepeatedKeydown(binding, event)) return;
		emitKeyboardInput(binding, "keydown", event);
	};

	const onWindowKeyUp = (event: KeyboardEvent) => {
		if (!isGameplayKey(event)) return;
		if (isEditableTarget(event.target)) return;
		if (
			event.target instanceof HTMLCanvasElement &&
			bindingsByCanvas.has(event.target)
		)
			return;

		const binding = resolveKeyboardBinding(event);
		if (!binding) return;
		markKeyReleased(binding, event);
		emitKeyboardInput(binding, "keyup", event);
	};

	window.addEventListener("keydown", onWindowKeyDown);
	window.addEventListener("keyup", onWindowKeyUp);
}

function attachInputHandlers(binding: CanvasBinding) {
	const { canvas } = binding;
	ensureGlobalKeyboardHandlers();

	if (!canvas.hasAttribute("tabindex")) {
		canvas.tabIndex = 0;
	}

	const makeCommon =
		(type: CanvasInputType) =>
		(
			event: KeyboardEvent | PointerEvent,
		): Omit<
			WireCanvasInput,
			"type" | "channel" | "componentId" | "method" | "at"
		> => {
			const maybePointer = event as PointerEvent;
			const maybeKeyboard = event as KeyboardEvent;
			const rect = canvas.getBoundingClientRect();
			const point =
				type === "pointer"
					? canvasPointFromPointer(maybePointer, canvas)
					: null;

			return {
				key: type === "pointer" ? undefined : maybeKeyboard.key,
				code: type === "pointer" ? undefined : maybeKeyboard.code,
				button: type === "pointer" ? maybePointer.button : undefined,
				x: point?.x,
				y: point?.y,
				canvasWidth: type === "pointer" ? rect.width : undefined,
				canvasHeight: type === "pointer" ? rect.height : undefined,
				ctrlKey: Boolean(event.ctrlKey),
				altKey: Boolean(event.altKey),
				shiftKey: Boolean(event.shiftKey),
				metaKey: Boolean(event.metaKey),
			};
		};

	const pointerCommon = makeCommon("pointer");

	const onPointerDown = (event: PointerEvent) => {
		canvas.focus();
		setActiveKeyboardBinding(binding);
		emitCanvasInput(binding, {
			channel: binding.channel,
			componentId: binding.componentId,
			method: binding.method,
			type: "pointer",
			at: Date.now(),
			...pointerCommon(event),
		});
	};

	const onFocus = () => {
		setActiveKeyboardBinding(binding);
	};

	const onBlur = () => {
		binding.pressedKeys.clear();
		if (activeKeyboardBinding === binding) {
			setActiveKeyboardBinding(pickFallbackBinding(binding.channel));
		}
	};

	const onKeyDown = (event: KeyboardEvent) => {
		if (shouldSkipRepeatedKeydown(binding, event)) return;
		emitKeyboardInput(binding, "keydown", event);
	};

	const onKeyUp = (event: KeyboardEvent) => {
		markKeyReleased(binding, event);
		emitKeyboardInput(binding, "keyup", event);
	};

	canvas.addEventListener("pointerdown", onPointerDown);
	canvas.addEventListener("focus", onFocus);
	canvas.addEventListener("blur", onBlur);
	canvas.addEventListener("keydown", onKeyDown);
	canvas.addEventListener("keyup", onKeyUp);

	binding.disposeFns.push(() =>
		canvas.removeEventListener("pointerdown", onPointerDown),
	);
	binding.disposeFns.push(() => canvas.removeEventListener("focus", onFocus));
	binding.disposeFns.push(() => canvas.removeEventListener("blur", onBlur));
	binding.disposeFns.push(() =>
		canvas.removeEventListener("keydown", onKeyDown),
	);
	binding.disposeFns.push(() => canvas.removeEventListener("keyup", onKeyUp));
}

function bindCanvas(
	el: HTMLCanvasElement,
	channel: string,
	method: string | undefined,
	componentId: string,
	state: Record<string, unknown>,
) {
	const old = bindingsByCanvas.get(el);
	if (old) unregisterBinding(old);
	const rawExpression = method ? `${channel}|${method}` : channel;

	const binding: CanvasBinding = {
		componentId,
		channel,
		method,
		rawExpression,
		canvas: el,
		state,
		lastPayload: null,
		frameHandle: null,
		lastFrameAt: 0,
		disposed: false,
		disposeFns: [],
		pressedKeys: new Set<string>(),
	};

	bindingsByCanvas.set(el, binding);
	ensureSetEntry(bindingsByComponent, componentId).add(binding);
	ensureSetEntry(bindingsByChannel, channel).add(binding);
	if (!activeKeyboardBinding) {
		setActiveKeyboardBinding(binding);
	}

	el.setAttribute("wire:canvas-channel", channel);
	if (method) {
		el.setAttribute("wire:canvas-method", method);
	} else {
		el.removeAttribute("wire:canvas-method");
	}

	attachInputHandlers(binding);
	startRenderLoop(binding);
}

Kirewire.directive("canvas", ({ el, expression, wire }) => {
	if (!(el instanceof HTMLCanvasElement)) return;

	const parsed = parseExpression(expression);
	if (!parsed) return;

	const root = resolveRootElement(el);
	if (!root) return;

	const componentId = wire.getComponentId(root);
	if (!componentId) return;

	bindCanvas(
		el,
		parsed.channel,
		parsed.method,
		componentId,
		readRootState(root),
	);
});

Kirewire.on("wire:ready", () => {
	bootstrapCanvases(document);
});

Kirewire.on("component:update", (payload) => {
	const componentId = String(payload?.id || "");
	if (!componentId) return;

	const root = findComponentRoot(componentId);
	if (root) {
		bootstrapCanvases(root);
	}

	const bindings = bindingsByComponent.get(componentId);
	if (!bindings || bindings.size === 0) return;

	const state = toRecord(payload?.state);
	if (Object.keys(state).length === 0) return;

	for (const binding of bindings) {
		binding.state = state;
		binding.lastPayload = payload;
	}
});

Kirewire.on("canvas", (payload) => {
	const channel = parseChannel(toRecord(payload).channel);
	if (!channel) return;

	const bindings = bindingsByChannel.get(channel);
	if (!bindings || bindings.size === 0) return;

	const state = extractPayloadState(payload);
	for (const binding of bindings) {
		if (state) binding.state = state;
		binding.lastPayload = payload;
	}
});

const canvasApi: WireCanvasApi = {
	setRenderer(channel, renderer) {
		if (!CHANNEL_PATTERN.test(channel)) return;
		renderersByChannel.set(channel, renderer);
	},
	clearRenderer(channel) {
		renderersByChannel.delete(channel);
	},
	getState(channel) {
		const bindings = bindingsByChannel.get(channel);
		if (!bindings || bindings.size === 0) return undefined;
		return bindings.values().next().value?.state;
	},
	pushState(channel, state) {
		if (!CHANNEL_PATTERN.test(channel)) return;
		const bindings = bindingsByChannel.get(channel);
		if (!bindings || bindings.size === 0) return;
		for (const binding of bindings) {
			binding.state = toRecord(state);
			binding.lastPayload = { channel, state };
		}
	},
	emit(channel, payload = {}) {
		if (!CHANNEL_PATTERN.test(channel)) return;
		Kirewire.emit("canvas", { ...payload, channel });
	},
};

if (typeof window !== "undefined") {
	window.KirewireCanvas = canvasApi;
}
