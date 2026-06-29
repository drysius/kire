/** Wrap rendered HTML in a Response with the right content type. */
export function html(body: string, status = 200): Response {
	return new Response(body, {
		status,
		headers: { "content-type": "text/html; charset=utf-8" },
	});
}
