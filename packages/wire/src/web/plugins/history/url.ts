export function hasQueryParam(param: string) {
	const queryParams = new URLSearchParams(window.location.search);
	return queryParams.has(param);
}

export function getQueryParam(param: string) {
	const queryParams = new URLSearchParams(window.location.search);
	return queryParams.get(param);
}

export function setQueryParam(param: string, value: string) {
	const queryParams = new URLSearchParams(window.location.search);
	queryParams.set(param, value);

	// Reconstruct URL
	const queryString =
		Array.from(queryParams.entries()).length > 0
			? "?" + queryParams.toString()
			: "";
	const url =
		window.location.origin +
		window.location.pathname +
		queryString +
		window.location.hash;

	window.history.replaceState(window.history.state, "", url);
}
