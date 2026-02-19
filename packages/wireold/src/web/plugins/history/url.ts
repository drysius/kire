import historyCoordinator from "./coordinator";

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

	const url = urlFromQueryParams(queryParams);

    // Usa o coordenador central em vez de window.history diretamente
	historyCoordinator.replaceState(new URL(url), {});
}

function urlFromQueryParams(params: URLSearchParams) {
	const queryString = Array.from(params.entries()).length > 0
		? '?' + params.toString()
		: '';

	return window.location.origin + window.location.pathname + queryString + window.location.hash;
}
