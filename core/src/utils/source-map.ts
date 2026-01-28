/**
 * Minimal Source Map Generator (VLQ Encoder)
 * Based on Source Map Revision 3
 */

const BASE64_CHARS =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function encodeVLQ(value: number): string {
	let res = "";
	let vlq = value < 0 ? (-value << 1) | 1 : value << 1;
	do {
		let digit = vlq & 0x1f;
		vlq >>>= 5;
		if (vlq > 0) digit |= 0x20;
		res += BASE64_CHARS[digit];
	} while (vlq > 0);
	return res;
}

function decodeVLQ(str: string, index: number): [number, number] {
	let result = 0;
	let shift = 0;
	let continuation = true;
	let i = index;

	while (continuation) {
		const char = str[i++];
		if (!char) throw new Error("Invalid VLQ");
		const digit = BASE64_CHARS.indexOf(char);
		if (digit === -1) throw new Error(`Invalid Base64 char: ${char}`);

		continuation = (digit & 0x20) !== 0;
		result += (digit & 0x1f) << shift;
		shift += 5;
	}

	const value = result & 1 ? -(result >>> 1) : result >>> 1;
	return [value, i];
}

export interface SourceMapMapping {
	genLine: number;
	genCol: number;
	sourceLine: number;
	sourceCol: number;
	sourceIndex?: number;
}

export class SourceMapGenerator {
	private mappings: SourceMapMapping[] = [];
	private sources: string[] = [];

	constructor(private file: string) {}

	public addSource(source: string) {
		const index = this.sources.indexOf(source);
		if (index === -1) {
			this.sources.push(source);
			return this.sources.length - 1;
		}
		return index;
	}

	public addMapping(mapping: SourceMapMapping) {
		this.mappings.push(mapping);
	}

	public toString(): string {
		let lastGenLine = 1;
		let lastGenCol = 0;
		let lastSourceIndex = 0;
		let lastSourceLine = 0;
		let lastSourceCol = 0;

		const encodedMappings = [];
		let lineMappings = [];

		// Sort mappings by generated line and column
		this.mappings.sort((a, b) => {
			if (a.genLine !== b.genLine) return a.genLine - b.genLine;
			return a.genCol - b.genCol;
		});

		for (const m of this.mappings) {
			while (m.genLine > lastGenLine) {
				encodedMappings.push(lineMappings.join(","));
				lineMappings = [];
				lastGenLine++;
				lastGenCol = 0;
			}

			let segment = "";
			segment += encodeVLQ(m.genCol - lastGenCol);
			lastGenCol = m.genCol;

			if (m.sourceLine !== undefined) {
				const sourceIndex = m.sourceIndex ?? 0;
				segment += encodeVLQ(sourceIndex - lastSourceIndex);
				lastSourceIndex = sourceIndex;

				segment += encodeVLQ(m.sourceLine - 1 - lastSourceLine);
				lastSourceLine = m.sourceLine - 1;

				segment += encodeVLQ(m.sourceCol - 1 - lastSourceCol);
				lastSourceCol = m.sourceCol - 1;
			}

			lineMappings.push(segment);
		}

		encodedMappings.push(lineMappings.join(","));

		const map = {
			version: 3,
			file: this.file,
			sources: this.sources,
			names: [],
			mappings: encodedMappings.join(";"),
		};

		return JSON.stringify(map);
	}

	public toDataUri(): string {
		const base64 = Buffer.from(this.toString()).toString("base64");
		return `data:application/json;charset=utf-8;base64,${base64}`;
	}
}

export function resolveSourceLocation(
	map: any,
	genLine: number,
	genCol: number,
): { line: number; column: number; source: string } | null {
	if (!map || !map.mappings) return null;

	const lines = map.mappings.split(";");
	// If generated line is out of bounds
	if (genLine > lines.length || genLine < 1) return null;

	let stateGenCol = 0;
	let stateSourceIndex = 0;
	let stateSourceLine = 0;
	let stateSourceCol = 0;

	let bestMatch = null;

	for (let l = 0; l < genLine; l++) {
		const line = lines[l];
		stateGenCol = 0;

		if (!line) continue;

		let i = 0;
		while (i < line.length) {
			// 1. Gen Col
			const [dCol, nextI1] = decodeVLQ(line, i);
			i = nextI1;
			stateGenCol += dCol;

			// 2. Source Index
			if (i >= line.length || line[i] === ",") {
				// 1-length segment (only genCol) - usually not mapping to source
				if (l === genLine - 1 && stateGenCol <= genCol) {
					// It's a match but no source info?
				}
			} else {
				const [dSrcIdx, nextI2] = decodeVLQ(line, i);
				i = nextI2;
				stateSourceIndex += dSrcIdx;

				// 3. Source Line
				const [dSrcLine, nextI3] = decodeVLQ(line, i);
				i = nextI3;
				stateSourceLine += dSrcLine;

				// 4. Source Col
				const [dSrcCol, nextI4] = decodeVLQ(line, i);
				i = nextI4;
				stateSourceCol += dSrcCol;

				// 5. Name Index (skip)
				if (i < line.length && line[i] !== ",") {
					const [_, nextI5] = decodeVLQ(line, i);
					i = nextI5;
				}

				if (l === genLine - 1) {
					if (stateGenCol <= genCol) {
						bestMatch = {
							line: stateSourceLine + 1, // 1-based
							column: stateSourceCol + 1, // 1-based
							source: map.sources[stateSourceIndex] || "",
						};
					} else {
						// We passed the target column, stop for this line
						break;
					}
				}
			}

			if (i < line.length && line[i] === ",") i++;
		}
	}

	return bestMatch;
}