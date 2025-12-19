// Cores ANSI para terminal
export const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	underscore: "\x1b[4m",

	// Cores de texto
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",

	// Cores bright
	brightRed: "\x1b[91m",
	brightGreen: "\x1b[92m",
	brightYellow: "\x1b[93m",
	brightBlue: "\x1b[94m",
	brightMagenta: "\x1b[95m",
	brightCyan: "\x1b[96m",
	brightWhite: "\x1b[97m",
};

function getTimestamp(): string {
	const now = new Date();
	const h = now.getHours().toString().padStart(2, "0");
	const m = now.getMinutes().toString().padStart(2, "0");
	const s = now.getSeconds().toString().padStart(2, "0");
	return `${colors.dim}${h}:${m}:${s}${colors.reset}`;
}

function formatPrefix(level: string, color: string): string {
	return `${color}[${level}]${colors.reset}`;
}

const kirePrefix = `${colors.brightRed}[kire]${colors.reset}`;

export const Logger = {
	info: (message: string) => {
		console.log(
			`${getTimestamp()} ${kirePrefix} ${formatPrefix("INFO", colors.brightCyan)} ${message}`,
		);
	},

	success: (message: string) => {
		console.log(
			`${getTimestamp()} ${kirePrefix} ${formatPrefix("SUCCESS", colors.green)} ${message}`,
		);
	},

	warn: (message: string) => {
		console.warn(
			`${getTimestamp()} ${kirePrefix} ${formatPrefix("WARN", colors.brightYellow)} ${message}`,
		);
	},

	error: (message: string, error?: any) => {
		console.error(
			`${getTimestamp()} ${kirePrefix} ${formatPrefix("ERROR", colors.brightRed)} ${message}`,
		);
		if (error) {
			console.error(error);
		}
	},

	log: (message: string) => {
		console.log(`${getTimestamp()} ${kirePrefix} ${message}`);
	},

	request: (method: string, path: string, status: number, duration?: number) => {
		const methodColor =
			{
				GET: colors.brightGreen,
				POST: colors.brightBlue,
				PUT: colors.brightYellow,
				DELETE: colors.brightRed,
				PATCH: colors.brightMagenta,
				OPTIONS: colors.brightCyan,
			}[method] || colors.brightWhite;

		const statusColor =
			status >= 500
				? colors.brightRed
				: status >= 400
					? colors.brightYellow
					: status >= 300
						? colors.brightCyan
						: colors.brightGreen;

		const durationStr = duration
			? `${colors.dim}(${Math.round(duration)}ms)${colors.reset}`
			: "";

		console.log(
			`${getTimestamp()} ${kirePrefix} ${methodColor}${method.padEnd(7)}${colors.reset} ${colors.brightWhite}${path}${colors.reset} ${colors.dim}→${colors.reset} ${statusColor}${status}${colors.reset} ${durationStr}`,
		);
	},

	build: (path: string, type: "page" | "asset" | "gen" = "page") => {
		const icon = type === "page" ? "📄" : type === "asset" ? "📦" : "⚡";
		const typeColor =
			type === "page"
				? colors.brightWhite
				: type === "asset"
					? colors.cyan
					: colors.magenta;
		console.log(
			`${getTimestamp()} ${kirePrefix} ${colors.green}✓${colors.reset} ${icon} ${typeColor}${path}${colors.reset}`,
		);
	},
};
