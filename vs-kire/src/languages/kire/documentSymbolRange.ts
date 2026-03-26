export interface SymbolPoint {
	line: number;
	character: number;
}

export interface SymbolSpan {
	start: SymbolPoint;
	end: SymbolPoint;
}

function comparePoints(left: SymbolPoint, right: SymbolPoint) {
	if (left.line !== right.line) {
		return left.line - right.line;
	}
	return left.character - right.character;
}

function minPoint(left: SymbolPoint, right: SymbolPoint) {
	return comparePoints(left, right) <= 0 ? left : right;
}

function maxPoint(left: SymbolPoint, right: SymbolPoint) {
	return comparePoints(left, right) >= 0 ? left : right;
}

export function ensureRangeContainsSelection(
	range: SymbolSpan,
	selectionRange: SymbolSpan,
): SymbolSpan {
	return {
		start: minPoint(range.start, selectionRange.start),
		end: maxPoint(range.end, selectionRange.end),
	};
}
