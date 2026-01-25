export function parseAction(actionString: string): {
	method: string;
	params: any[];
} {
	let method = actionString;
	let params: any[] = [];

	if (actionString.includes("(")) {
		const match = actionString.match(/([^(]+)\((.*)\)/);
		if (match) {
			method = match[1].trim();
			const argsContent = match[2];
			if (argsContent.trim()) {
				params = argsContent.split(",").map((a) => {
					const clean = a.trim();
					if (clean.startsWith("'") || clean.startsWith('"'))
						return clean.slice(1, -1);
					if (clean === "true") return true;
					if (clean === "false") return false;
					if (clean === "null") return null;
					if (!isNaN(Number(clean))) return Number(clean);
					return clean;
				});
			}
		}
	}
	return { method, params };
}
