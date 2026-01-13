export const WireErrors = {
	invalid_request: { code: 400, error: "Invalid Request" },
	expired_session: { code: 419, error: "Page Expired" },
	not_found: { code: 404, error: "Component not found" },
	forbidden: { code: 403, error: "Forbidden Action" },
	method_not_allowed: { code: 405, error: "Method not allowed" },
	incomplete_snapshot: { code: 400, error: "Incomplete snapshot data" },
	invalid_checksum: { code: 403, error: "Invalid snapshot checksum" },
	server_error: { code: 500, error: "Internal Server Error" },
};
