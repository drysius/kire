export function wildcardToRegExp(
	pattern: string,
	wildcardSource: string,
): RegExp {
	const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`^${escaped.replace(/\\\*/g, wildcardSource)}$`);
}

export function wildcardSpecificityScore(pattern: string): number {
	const wildcardCount = (pattern.match(/\*/g) || []).length;
	const literalLength = pattern.replace(/\*/g, "").length;
	const segmentCount = pattern.split(/[:./-]+/).filter(Boolean).length;
	return literalLength * 20 + segmentCount * 5 - wildcardCount * 7;
}

export function findBestWildcardMatch<T>(
	entries: Iterable<[string, T]>,
	value: string,
	wildcardSource: string,
): { name: string; value: T } | undefined {
	let bestMatch:
		| {
				name: string;
				value: T;
				score: number;
		  }
		| undefined;

	for (const [name, entry] of entries) {
		if (!name.includes("*")) continue;
		const pattern = wildcardToRegExp(name, wildcardSource);
		if (!pattern.test(value)) continue;

		const score = wildcardSpecificityScore(name);
		if (!bestMatch || score > bestMatch.score) {
			bestMatch = { name, value: entry, score };
		}
	}

	if (!bestMatch) return undefined;
	return {
		name: bestMatch.name,
		value: bestMatch.value,
	};
}
