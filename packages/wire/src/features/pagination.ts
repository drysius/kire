/**
 * Lightweight, ORM-agnostic pagination. A component keeps a `page` property and
 * calls `paginate(items, this.page, perPage)` in its view data. Pair with `@url`
 * on `page` to reflect the page in the query string.
 */
export interface Page<T> {
	data: T[];
	total: number;
	perPage: number;
	currentPage: number;
	lastPage: number;
	from: number;
	to: number;
	hasMore: boolean;
	hasPrevious: boolean;
}

export function paginate<T>(
	items: readonly T[],
	page: number,
	perPage: number,
): Page<T> {
	const total = items.length;
	const lastPage = Math.max(1, Math.ceil(total / perPage));
	const currentPage = Math.min(Math.max(1, Math.floor(page) || 1), lastPage);
	const start = (currentPage - 1) * perPage;
	const data = items.slice(start, start + perPage);
	return {
		data,
		total,
		perPage,
		currentPage,
		lastPage,
		from: total === 0 ? 0 : start + 1,
		to: start + data.length,
		hasMore: currentPage < lastPage,
		hasPrevious: currentPage > 1,
	};
}
