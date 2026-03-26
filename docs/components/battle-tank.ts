import { Component, Variable, Wire, WireBroadcast } from "../lib/wire";

type Direction = "up" | "down" | "left" | "right";
type Owner = "enemy" | `player:${string}`;

type Vector = { x: number; y: number };
type ControlsState = {
	up: boolean;
	down: boolean;
	left: boolean;
	right: boolean;
	fire: boolean;
};

type TankUnit = {
	x: number;
	y: number;
	dir: Direction;
	size: number;
	speed: number;
	cooldown: number;
};

type PlayerTank = TankUnit & {
	id: string;
	name: string;
	color: string;
	score: number;
	lives: number;
	controls: ControlsState;
	lastSeenAt: number;
	joinedAt: number;
};

type Bullet = {
	x: number;
	y: number;
	dir: Direction;
	owner: Owner;
	speed: number;
	radius: number;
};

type ControlAction = keyof ControlsState | null;

const DIR_VECTORS: Record<Direction, Vector> = {
	up: { x: 0, y: -1 },
	down: { x: 0, y: 1 },
	left: { x: -1, y: 0 },
	right: { x: 1, y: 0 },
};

const PLAYER_COLORS = ["#62d26f", "#5ab1ff", "#ffc857", "#ff7a90"];
const STEP_INTERVAL_MS = 50;
const MAX_CATCHUP_STEPS = 4;
const PLAYER_TIMEOUT_MS = 30_000;
const MAX_PLAYERS = 4;
const DEFAULT_LIVES = 3;
const INITIAL_ENEMIES = 3;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function randomDirection(): Direction {
	const dirs: Direction[] = ["up", "down", "left", "right"];
	return dirs[Math.floor(Math.random() * dirs.length)]!;
}

function normalizeInputToken(value: unknown): string {
	return String(value || "")
		.trim()
		.toLowerCase();
}

function createControls(): ControlsState {
	return { up: false, down: false, left: false, right: false, fire: false };
}

function isPlayerOwner(owner: Owner): owner is `player:${string}` {
	return owner.startsWith("player:");
}

function ownerToPlayerId(owner: Owner): string {
	return String(owner).replace(/^player:/, "");
}

function resolveControlAction(key: unknown, code: unknown): ControlAction {
	const normalizedKey = normalizeInputToken(key);
	const normalizedCode = normalizeInputToken(code);

	const byKey: Record<string, ControlAction> = {
		arrowup: "up",
		arrowdown: "down",
		arrowleft: "left",
		arrowright: "right",
		w: "up",
		s: "down",
		a: "left",
		d: "right",
		" ": "fire",
		space: "fire",
		spacebar: "fire",
	};

	const byCode: Record<string, ControlAction> = {
		arrowup: "up",
		arrowdown: "down",
		arrowleft: "left",
		arrowright: "right",
		keyw: "up",
		keys: "down",
		keya: "left",
		keyd: "right",
		space: "fire",
	};

	return byCode[normalizedCode] || byKey[normalizedKey] || null;
}

@Wire({ name: "battle-tank" })
export default class BattleTank extends Component {
	@Variable("string")
	public readonly channel = "battle-tank";
	@Variable("string")
	public readonly roomChannel = "battle-tank-room";

	@Variable("number")
	public boardSize = 21;
	@Variable("number")
	public tileSize = 28;
	@Variable("number")
	public tankSize = 0.8;
	@Variable("number")
	public bulletRadius = 0.11;

	@Variable("array")
	public map: number[][] = [];
	@Variable("any")
	public players: Record<string, PlayerTank> = {};
	@Variable("any")
	public player: TankUnit = {
		x: Math.floor(this.boardSize / 2),
		y: this.boardSize - 2,
		dir: "up",
		size: this.tankSize,
		speed: 0.19,
		cooldown: 0,
	};
	@Variable("array")
	public enemies: TankUnit[] = [];
	@Variable("array")
	public bullets: Bullet[] = [];

	@Variable("number")
	public score = 0;
	@Variable("any")
	public lives = DEFAULT_LIVES;
	@Variable("number")
	public wave = 1;
	@Variable("number")
	public tickCount = 0;
	@Variable("boolean")
	public gameOver = false;
	@Variable("string")
	public status = "Hold Arrow/WASD + Space to defend the base";
	@Variable("number")
	public onlinePlayers = 1;
	@Variable("string")
	public currentPlayerId = "";
	@Variable("boolean")
	public spectator = false;

	@Variable("any")
	public shared = new WireBroadcast({
		name: this.roomChannel,
		autodelete: true,
		ttlMs: 10 * 60 * 1000,
		includes: [
			"boardSize",
			"tileSize",
			"tankSize",
			"bulletRadius",
			"map",
			"players",
			"enemies",
			"bullets",
			"wave",
			"tickCount",
			"gameOver",
			"status",
			"lastStepAt",
		],
	});

	private lastStepAt = 0;
	private fallbackPlayerId = `local-${Math.random().toString(36).slice(2, 10)}`;

	async mount() {
		this.hydrateShared();
		if (!Array.isArray(this.map) || this.map.length === 0) {
			this.initializeWorld();
		}
		this.ensurePlayerJoined();
		this.finishCycle("mount");
	}

	public reset() {
		this.hydrateShared();
		this.initializeWorld(true);
		this.ensurePlayerJoined();
		this.status = "Arena reset. Defend the base together.";
		this.finishCycle("reset");
	}

	public moveUp() {
		this.touchMove("up");
	}

	public moveDown() {
		this.touchMove("down");
	}

	public moveLeft() {
		this.touchMove("left");
	}

	public moveRight() {
		this.touchMove("right");
	}

	public shoot() {
		this.hydrateShared();
		const player = this.getCurrentPlayer();
		if (!player) return;
		player.lastSeenAt = Date.now();
		this.fireBullet(`player:${player.id}`, player);
		this.finishCycle("touch-fire");
	}

	public input(payload: any) {
		this.hydrateShared();
		const player = this.getCurrentPlayer();
		if (!player || !payload || typeof payload !== "object") return;
		if (player.lives <= 0) return;

		player.lastSeenAt = Date.now();
		const type = String(payload.type || "");

		if (type === "keydown" || type === "keyup") {
			const isPressed = type === "keydown";
			const action = resolveControlAction(payload.key, payload.code);
			if (action === "fire") {
				player.controls.fire = isPressed;
				if (isPressed) this.fireBullet(`player:${player.id}`, player);
			} else if (action) {
				player.controls[action] = isPressed;
				if (isPressed) {
					player.dir = action;
					this.tryMoveTank(
						player,
						action,
						player.speed * 0.55,
						true,
						player.id,
					);
				}
			}
			this.finishCycle("input-keyboard");
			return;
		}

		if (type === "pointer") {
			const x = Number(payload.x);
			const y = Number(payload.y);
			const canvasWidth = Math.max(
				1,
				Number(payload.canvasWidth) || this.boardSize * this.tileSize,
			);
			const canvasHeight = Math.max(
				1,
				Number(payload.canvasHeight) || this.boardSize * this.tileSize,
			);
			if (!Number.isFinite(x) || !Number.isFinite(y)) return;

			const tx = clamp(
				Math.floor((x / canvasWidth) * this.boardSize),
				0,
				this.boardSize - 1,
			);
			const ty = clamp(
				Math.floor((y / canvasHeight) * this.boardSize),
				0,
				this.boardSize - 1,
			);
			const dx = tx - player.x;
			const dy = ty - player.y;

			let direction: Direction = player.dir;
			if (Math.abs(dx) >= Math.abs(dy)) {
				direction = dx < 0 ? "left" : "right";
			} else {
				direction = dy < 0 ? "up" : "down";
			}

			if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
				this.tryMoveTank(player, direction, 0.32, true, player.id);
			} else {
				player.dir = direction;
				this.fireBullet(`player:${player.id}`, player);
			}
			this.finishCycle("input-pointer");
		}
	}

	public tick() {
		this.hydrateShared();
		this.ensurePlayerJoined();

		const me = this.players[this.currentPlayerId];
		if (me) me.lastSeenAt = Date.now();

		this.pruneStalePlayers();
		if (Object.keys(this.players).length === 0) {
			this.gameOver = true;
			this.status = "Waiting for players to join the arena.";
			this.finishCycle("tick-empty");
			return;
		}

		let steps = this.computeStepCount(Date.now());
		if (steps === 0 && this.tickCount === 0) {
			steps = 1;
		}
		for (let i = 0; i < steps; i++) {
			this.stepSimulation();
		}

		this.finishCycle(steps > 0 ? `tick-${steps}` : "tick-sync");
	}

	async render() {
		return this.view("components.battle-tank");
	}

	private hydrateShared() {
		this.currentPlayerId ||= this.resolveCurrentPlayerId();
		this.shared.hydrate(this, this.roomChannel);
		if (!Array.isArray(this.map) || this.map.length === 0) {
			this.initializeWorld();
		}
	}

	private finishCycle(reason: string) {
		this.syncHud();
		this.shared.update(this);
		this.syncCanvas(reason);
	}

	private resolveCurrentPlayerId(): string {
		const scope = String((this as any).$wire_scope_id || "");
		const id = String((this as any).$id || "");
		if (scope && id) return `${scope}:${id}`;
		return this.fallbackPlayerId;
	}

	private getCurrentPlayer(): PlayerTank | null {
		const player = this.players[this.currentPlayerId];
		if (!player || player.lives <= 0) return null;
		return player;
	}

	private getSortedPlayerIds(): string[] {
		return Object.keys(this.players).sort(
			(a, b) => this.players[a]!.joinedAt - this.players[b]!.joinedAt,
		);
	}

	private ensurePlayerJoined() {
		const existing = this.players[this.currentPlayerId];
		if (existing) {
			this.spectator = false;
			return;
		}

		const ids = this.getSortedPlayerIds();
		if (ids.length >= MAX_PLAYERS) {
			this.spectator = true;
			this.status = `Room full (${MAX_PLAYERS} players). You are spectating.`;
			return;
		}

		const now = Date.now();
		const slot = ids.length;
		const spawn = this.getPlayerSpawn(slot);
		this.players[this.currentPlayerId] = {
			id: this.currentPlayerId,
			name: `P${slot + 1}`,
			color: PLAYER_COLORS[slot % PLAYER_COLORS.length] || "#62d26f",
			x: spawn.x,
			y: spawn.y,
			dir: "up",
			size: this.tankSize,
			speed: 0.19,
			cooldown: 0,
			score: 0,
			lives: DEFAULT_LIVES,
			controls: createControls(),
			lastSeenAt: now,
			joinedAt: now,
		};
		this.spectator = false;
		this.gameOver = false;
		this.status = `${this.players[this.currentPlayerId]!.name} joined the arena.`;
	}

	private initializeWorld(resetPlayers = false) {
		const previousPlayers = this.players;
		this.map = this.createMap();
		this.enemies = [];
		this.bullets = [];
		this.wave = 1;
		this.tickCount = 0;
		this.gameOver = false;
		this.lastStepAt = Date.now();

		for (let i = 0; i < INITIAL_ENEMIES; i++) {
			this.spawnEnemy();
		}

		const ids = Object.keys(previousPlayers).sort(
			(a, b) => previousPlayers[a]!.joinedAt - previousPlayers[b]!.joinedAt,
		);
		const rebuilt: Record<string, PlayerTank> = {};
		for (let index = 0; index < ids.length; index++) {
			const id = ids[index]!;
			const previous = previousPlayers[id]!;
			const spawn = this.getPlayerSpawn(index);
			rebuilt[id] = {
				...previous,
				x: spawn.x,
				y: spawn.y,
				dir: "up",
				size: this.tankSize,
				speed: 0.19,
				cooldown: 0,
				controls: createControls(),
				score: resetPlayers ? 0 : previous.score,
				lives: resetPlayers ? DEFAULT_LIVES : Math.max(0, previous.lives),
				lastSeenAt: Date.now(),
			};
		}
		this.players = rebuilt;
	}

	private syncHud() {
		this.onlinePlayers = this.getSortedPlayerIds().length;
		const me = this.players[this.currentPlayerId];
		if (me) {
			this.score = me.score;
			this.lives = me.lives;
			this.player = {
				x: me.x,
				y: me.y,
				dir: me.dir,
				size: me.size,
				speed: me.speed,
				cooldown: me.cooldown,
			};
			this.spectator = false;
		} else {
			const spawn = this.getPlayerSpawn(0);
			this.score = 0;
			this.lives = 0;
			this.player = {
				x: spawn.x,
				y: spawn.y,
				dir: "up",
				size: this.tankSize,
				speed: 0.19,
				cooldown: 0,
			};
			this.spectator = true;
		}
		if (this.onlinePlayers === 0) {
			this.status = "Waiting for players to join the arena.";
		}
	}

	private touchMove(dir: Direction) {
		this.hydrateShared();
		const player = this.getCurrentPlayer();
		if (!player) return;
		player.lastSeenAt = Date.now();
		player.controls = createControls();
		this.tryMoveTank(player, dir, 0.34, true, player.id);
		this.finishCycle(`touch-${dir}`);
	}

	private computeStepCount(now: number): number {
		if (!Number.isFinite(this.lastStepAt) || this.lastStepAt <= 0) {
			this.lastStepAt = now;
			return 1;
		}

		const elapsed = now - this.lastStepAt;
		if (elapsed < STEP_INTERVAL_MS) return 0;

		const steps = Math.min(
			MAX_CATCHUP_STEPS,
			Math.max(1, Math.floor(elapsed / STEP_INTERVAL_MS)),
		);
		this.lastStepAt += steps * STEP_INTERVAL_MS;
		return steps;
	}

	private stepSimulation() {
		if (this.gameOver) return;
		this.tickCount++;

		const activePlayers = this.getActivePlayers();
		if (activePlayers.length === 0) {
			this.gameOver = true;
			this.status = "All tanks were destroyed. Waiting for reinforcements.";
			return;
		}

		for (const player of activePlayers) {
			player.cooldown = Math.max(0, player.cooldown - 1);
			const direction = this.resolveControlDirection(
				player.controls,
				player.dir,
			);
			if (direction) {
				this.tryMoveTank(player, direction, player.speed, true, player.id);
			}
			if (player.controls.fire) {
				this.fireBullet(`player:${player.id}`, player);
			}
		}

		for (const enemy of this.enemies) {
			enemy.cooldown = Math.max(0, enemy.cooldown - 1);
		}

		this.updateEnemies(activePlayers);
		this.updateBullets();
		this.maybeSpawnEnemy();

		if (this.enemies.length === 0 && this.tickCount % 90 === 0) {
			this.wave++;
			this.status = `Wave ${this.wave} inbound`;
			this.spawnEnemy();
			this.spawnEnemy();
		}

		if (!this.gameOver) {
			this.status = `Wave ${this.wave} active � ${activePlayers.length} player(s) online`;
		}
	}

	private getActivePlayers(): PlayerTank[] {
		return this.getSortedPlayerIds()
			.map((id) => this.players[id]!)
			.filter((player) => player && player.lives > 0);
	}

	private resolveControlDirection(
		controls: ControlsState,
		fallback: Direction,
	): Direction | null {
		const pressed: Direction[] = [];
		if (controls.up) pressed.push("up");
		if (controls.down) pressed.push("down");
		if (controls.left) pressed.push("left");
		if (controls.right) pressed.push("right");
		if (pressed.length === 0) return null;
		if (pressed.includes(fallback)) return fallback;
		return pressed[0] || null;
	}

	private tryMoveTank(
		tank: TankUnit,
		dir: Direction,
		distance: number,
		isPlayer: boolean,
		playerId?: string,
	): boolean {
		if (distance <= 0) return false;
		const vec = DIR_VECTORS[dir];
		tank.dir = dir;
		let moved = false;

		if (vec.x !== 0) {
			const nx = tank.x + vec.x * distance;
			if (this.canOccupy(tank, nx, tank.y, isPlayer, playerId)) {
				tank.x = nx;
				moved = true;
			}
		}

		if (vec.y !== 0) {
			const ny = tank.y + vec.y * distance;
			if (this.canOccupy(tank, tank.x, ny, isPlayer, playerId)) {
				tank.y = ny;
				moved = true;
			}
		}

		return moved;
	}

	private canOccupy(
		tank: TankUnit,
		x: number,
		y: number,
		isPlayer: boolean,
		playerId?: string,
	): boolean {
		if (!this.isInsideRect(x, y, tank.size)) return false;
		if (this.rectHitsSolid(x, y, tank.size)) return false;

		if (isPlayer) {
			for (const enemy of this.enemies) {
				if (this.rectOverlap(x, y, tank.size, enemy.x, enemy.y, enemy.size))
					return false;
			}
			for (const [id, player] of Object.entries(this.players)) {
				if (id === playerId || player.lives <= 0) continue;
				if (this.rectOverlap(x, y, tank.size, player.x, player.y, player.size))
					return false;
			}
			return true;
		}

		for (const player of this.getActivePlayers()) {
			if (this.rectOverlap(x, y, tank.size, player.x, player.y, player.size))
				return false;
		}

		for (const enemy of this.enemies) {
			if (enemy === tank) continue;
			if (this.rectOverlap(x, y, tank.size, enemy.x, enemy.y, enemy.size))
				return false;
		}
		return true;
	}

	private fireBullet(owner: Owner, tank: TankUnit) {
		if (tank.cooldown > 0) return;

		const vec = DIR_VECTORS[tank.dir];
		const centerX = tank.x + tank.size / 2;
		const centerY = tank.y + tank.size / 2;
		const worldX = centerX + vec.x * (tank.size * 0.56);
		const worldY = centerY + vec.y * (tank.size * 0.56);
		const bx = worldX - 0.5;
		const by = worldY - 0.5;
		tank.cooldown = owner === "enemy" ? 9 : 4;

		if (!this.isBulletInside(bx, by)) return;
		if (this.bulletHitsSolid(bx, by)) {
			this.damageTileAtBullet(bx, by);
			return;
		}

		if (owner === "enemy") {
			const targetPlayerId = this.findHitPlayer(bx, by);
			if (targetPlayerId) {
				this.hitPlayer(targetPlayerId);
				return;
			}
		} else if (isPlayerOwner(owner)) {
			const shooterId = ownerToPlayerId(owner);
			const enemyIndex = this.enemies.findIndex((enemy) =>
				this.bulletHitsTank(bx, by, enemy),
			);
			if (enemyIndex >= 0) {
				this.enemies.splice(enemyIndex, 1);
				this.awardScore(shooterId, 120);
				this.status = `${this.players[shooterId]?.name || "Player"} destroyed an enemy.`;
				return;
			}

			const targetPlayerId = this.findHitPlayer(bx, by, shooterId);
			if (targetPlayerId) {
				this.hitPlayer(targetPlayerId);
				return;
			}
		}

		this.bullets.push({
			x: bx,
			y: by,
			dir: tank.dir,
			owner,
			speed: owner === "enemy" ? 0.34 : 0.44,
			radius: this.bulletRadius,
		});
	}

	private updateEnemies(activePlayers: PlayerTank[]) {
		for (const enemy of this.enemies) {
			if (activePlayers.length > 0 && Math.random() < 0.16) {
				const target = this.getClosestPlayer(enemy, activePlayers);
				if (target) {
					const dx = target.x - enemy.x;
					const dy = target.y - enemy.y;
					enemy.dir =
						Math.abs(dx) >= Math.abs(dy)
							? dx >= 0
								? "right"
								: "left"
							: dy >= 0
								? "down"
								: "up";
				}
			} else if (Math.random() < 0.12) {
				enemy.dir = randomDirection();
			}

			if (!this.tryMoveTank(enemy, enemy.dir, enemy.speed, false)) {
				enemy.dir = randomDirection();
			}

			if (Math.random() < 0.12) {
				this.fireBullet("enemy", enemy);
			}
		}
	}

	private getClosestPlayer(
		enemy: TankUnit,
		players: PlayerTank[],
	): PlayerTank | null {
		let closest: PlayerTank | null = null;
		let bestDistance = Number.POSITIVE_INFINITY;
		for (const player of players) {
			const dx = player.x - enemy.x;
			const dy = player.y - enemy.y;
			const distance = dx * dx + dy * dy;
			if (distance < bestDistance) {
				bestDistance = distance;
				closest = player;
			}
		}
		return closest;
	}

	private updateBullets() {
		const survivors: Bullet[] = [];

		for (const bullet of this.bullets) {
			const vec = DIR_VECTORS[bullet.dir];
			const nx = bullet.x + vec.x * bullet.speed;
			const ny = bullet.y + vec.y * bullet.speed;

			if (!this.isBulletInside(nx, ny)) continue;
			if (this.bulletHitsSolid(nx, ny)) {
				this.damageTileAtBullet(nx, ny);
				continue;
			}

			if (bullet.owner === "enemy") {
				const targetPlayerId = this.findHitPlayer(nx, ny);
				if (targetPlayerId) {
					this.hitPlayer(targetPlayerId);
					continue;
				}
			} else if (isPlayerOwner(bullet.owner)) {
				const shooterId = ownerToPlayerId(bullet.owner);
				const enemyIndex = this.enemies.findIndex((enemy) =>
					this.bulletHitsTank(nx, ny, enemy),
				);
				if (enemyIndex >= 0) {
					this.enemies.splice(enemyIndex, 1);
					this.awardScore(shooterId, 120);
					this.status = `${this.players[shooterId]?.name || "Player"} destroyed an enemy.`;
					continue;
				}

				const targetPlayerId = this.findHitPlayer(nx, ny, shooterId);
				if (targetPlayerId) {
					this.hitPlayer(targetPlayerId);
					continue;
				}
			}

			survivors.push({ ...bullet, x: nx, y: ny });
		}

		this.bullets = survivors;
	}

	private findHitPlayer(
		x: number,
		y: number,
		excludePlayerId?: string,
	): string | null {
		for (const player of this.getActivePlayers()) {
			if (excludePlayerId && player.id === excludePlayerId) continue;
			if (this.bulletHitsTank(x, y, player)) return player.id;
		}
		return null;
	}

	private awardScore(playerId: string, points: number) {
		const player = this.players[playerId];
		if (!player) return;
		player.score += points;
	}

	private hitPlayer(playerId: string) {
		const player = this.players[playerId];
		if (!player || player.lives <= 0) return;

		player.lives--;
		player.controls = createControls();
		this.bullets = this.bullets.filter(
			(bullet) =>
				!(
					isPlayerOwner(bullet.owner) &&
					ownerToPlayerId(bullet.owner) === playerId
				),
		);

		if (player.lives <= 0) {
			player.x = -99;
			player.y = -99;
			this.status = `${player.name} was eliminated.`;
			if (this.getActivePlayers().length === 0) {
				this.gameOver = true;
				this.status = "All tanks were destroyed. Waiting for reinforcements.";
			}
			return;
		}

		const spawn = this.getPlayerSpawn(this.getPlayerSlot(playerId));
		player.x = spawn.x;
		player.y = spawn.y;
		player.dir = "up";
		player.cooldown = 0;
		this.status = `${player.name} hit! ${player.lives} lives remaining.`;
	}

	private getPlayerSlot(playerId: string): number {
		const ids = this.getSortedPlayerIds();
		const index = ids.indexOf(playerId);
		return index >= 0 ? index : 0;
	}

	private maybeSpawnEnemy() {
		if (this.getActivePlayers().length === 0) return;
		const maxEnemies = 3 + Math.min(this.wave, 4);
		if (this.enemies.length >= maxEnemies) return;
		if (this.tickCount % 30 !== 0) return;
		this.spawnEnemy();
	}

	private spawnEnemy() {
		const offset = (1 - this.tankSize) / 2;
		const available = this.getEnemySpawns().filter((spawn) => {
			const x = spawn.x + offset;
			const y = spawn.y + offset;
			const probe: TankUnit = {
				x,
				y,
				dir: "down",
				size: this.tankSize,
				speed: 0,
				cooldown: 0,
			};
			return this.canOccupy(probe, x, y, false);
		});

		if (available.length === 0) return;
		const picked = available[Math.floor(Math.random() * available.length)]!;
		this.enemies.push({
			x: picked.x + offset,
			y: picked.y + offset,
			dir: randomDirection(),
			size: this.tankSize,
			speed: 0.13 + Math.min(this.wave * 0.004, 0.08),
			cooldown: 0,
		});
	}

	private pruneStalePlayers() {
		const now = Date.now();
		let removedAny = false;
		for (const [id, player] of Object.entries(this.players)) {
			if (now - player.lastSeenAt <= PLAYER_TIMEOUT_MS) continue;
			delete this.players[id];
			removedAny = true;
		}

		if (removedAny) {
			this.repositionActivePlayers();
			if (Object.keys(this.players).length === 0) {
				this.gameOver = true;
				this.status = "Waiting for players to join the arena.";
			}
		}
	}

	private repositionActivePlayers() {
		const ids = this.getSortedPlayerIds();
		for (let index = 0; index < ids.length; index++) {
			const player = this.players[ids[index]!]!;
			if (player.lives <= 0) continue;
			if (
				this.isInsideRect(player.x, player.y, player.size) &&
				!this.rectHitsSolid(player.x, player.y, player.size)
			)
				continue;
			const spawn = this.getPlayerSpawn(index);
			player.x = spawn.x;
			player.y = spawn.y;
			player.dir = "up";
		}
	}

	private getEnemySpawns(): Array<{ x: number; y: number }> {
		const center = Math.floor(this.boardSize / 2);
		const anchors = [2, center - 5, center, center + 5, this.boardSize - 3];
		const unique = Array.from(
			new Set(anchors.map((value) => clamp(value, 1, this.boardSize - 2))),
		);
		return unique.map((x) => ({ x, y: 1 }));
	}

	private getPlayerSpawn(slot: number): { x: number; y: number } {
		const center = Math.floor(this.boardSize / 2);
		const bottom = this.boardSize - 2;
		const rawSpawns = [
			{ x: center, y: bottom },
			{ x: center - 6, y: bottom },
			{ x: center + 6, y: bottom },
			{ x: center, y: bottom - 5 },
		];
		const picked = rawSpawns[slot % rawSpawns.length] || rawSpawns[0]!;
		const offset = (1 - this.tankSize) / 2;
		return {
			x: clamp(
				picked.x + offset,
				1 + offset,
				this.boardSize - 1 - this.tankSize,
			),
			y: clamp(
				picked.y + offset,
				1 + offset,
				this.boardSize - 1 - this.tankSize,
			),
		};
	}

	private createMap(): number[][] {
		const playerSpawns = Array.from({ length: MAX_PLAYERS }, (_, index) =>
			this.getPlayerSpawn(index),
		).map((spawn) => ({
			x: Math.floor(spawn.x),
			y: Math.floor(spawn.y),
		}));
		const enemySpawns = this.getEnemySpawns();

		const map = Array.from({ length: this.boardSize }, (_, y) =>
			Array.from({ length: this.boardSize }, (_, x) => {
				if (
					x === 0 ||
					y === 0 ||
					x === this.boardSize - 1 ||
					y === this.boardSize - 1
				)
					return 2;
				const roll = Math.random();
				if (roll < 0.14) return 1;
				if (roll < 0.17) return 3;
				return 0;
			}),
		);

		const clearTiles = [...playerSpawns, ...enemySpawns];
		for (const tile of clearTiles) {
			for (let oy = -1; oy <= 1; oy++) {
				for (let ox = -1; ox <= 1; ox++) {
					const x = tile.x + ox;
					const y = tile.y + oy;
					if (!this.isInsideCell(x, y)) continue;
					map[y]![x] = 0;
				}
			}
		}

		return map;
	}

	private damageTile(x: number, y: number) {
		if (!this.isInsideCell(x, y)) return;
		const cell = this.map[y]![x]!;
		if (cell === 1) this.map[y]![x] = 0;
	}

	private damageTileAtBullet(x: number, y: number) {
		const cx = x + 0.5;
		const cy = y + 0.5;
		this.damageTile(Math.floor(cx), Math.floor(cy));
	}

	private isInsideCell(x: number, y: number): boolean {
		return x >= 0 && y >= 0 && x < this.boardSize && y < this.boardSize;
	}

	private isInsideRect(x: number, y: number, size: number): boolean {
		return (
			x >= 0 &&
			y >= 0 &&
			x + size <= this.boardSize &&
			y + size <= this.boardSize
		);
	}

	private isSolidCell(x: number, y: number): boolean {
		if (!this.isInsideCell(x, y)) return true;
		const cell = this.map[y]![x]!;
		return cell === 1 || cell === 2 || cell === 3;
	}

	private rectHitsSolid(x: number, y: number, size: number): boolean {
		const epsilon = 0.0001;
		const minX = Math.floor(x + epsilon);
		const minY = Math.floor(y + epsilon);
		const maxX = Math.floor(x + size - epsilon);
		const maxY = Math.floor(y + size - epsilon);

		for (let iy = minY; iy <= maxY; iy++) {
			for (let ix = minX; ix <= maxX; ix++) {
				if (this.isSolidCell(ix, iy)) return true;
			}
		}

		return false;
	}

	private rectOverlap(
		ax: number,
		ay: number,
		as: number,
		bx: number,
		by: number,
		bs: number,
	): boolean {
		return ax < bx + bs && ax + as > bx && ay < by + bs && ay + as > by;
	}

	private isBulletInside(x: number, y: number): boolean {
		const cx = x + 0.5;
		const cy = y + 0.5;
		return cx >= 0 && cy >= 0 && cx < this.boardSize && cy < this.boardSize;
	}

	private bulletHitsSolid(x: number, y: number): boolean {
		const cx = x + 0.5;
		const cy = y + 0.5;
		return this.isSolidCell(Math.floor(cx), Math.floor(cy));
	}

	private bulletHitsTank(x: number, y: number, tank: TankUnit): boolean {
		const cx = x + 0.5;
		const cy = y + 0.5;
		return (
			cx >= tank.x &&
			cx <= tank.x + tank.size &&
			cy >= tank.y &&
			cy <= tank.y + tank.size
		);
	}

	private syncCanvas(reason: string) {
		this.emit("canvas", {
			channel: this.channel,
			reason,
			state: this.getCanvasState(),
		});
	}

	private getCanvasState() {
		const players = this.getSortedPlayerIds().map((id) => {
			const player = this.players[id]!;
			return {
				id: player.id,
				name: player.name,
				color: player.color,
				x: player.x,
				y: player.y,
				dir: player.dir,
				size: player.size,
				speed: player.speed,
				cooldown: player.cooldown,
				score: player.score,
				lives: player.lives,
			};
		});

		const fallbackPlayer =
			players.find((player) => player.id === this.currentPlayerId) ||
			players[0] ||
			null;

		return {
			boardSize: this.boardSize,
			tileSize: this.tileSize,
			map: this.map.map((row) => row.slice()),
			player: fallbackPlayer,
			players,
			currentPlayerId: this.currentPlayerId,
			enemies: this.enemies.map((enemy) => ({ ...enemy })),
			bullets: this.bullets.map((bullet) => ({ ...bullet })),
			onlinePlayers: this.onlinePlayers,
			score: this.score,
			lives: this.lives,
			wave: this.wave,
			tickCount: this.tickCount,
			status: this.status,
			gameOver: this.gameOver,
			spectator: this.spectator,
		};
	}
}
