export interface ActionRequest {
	id: string;
	method: string;
	params?: any[];
	pageId?: string;
	requestId?: string;
}

export interface ComponentState {
	id: string;
	state: Record<string, any>;
	html: string;
	effects: Array<EffectPacket>;
	revision: number;
}

export interface EffectPacket {
	type: string;
	payload: any;
}

export interface AdapterTransport {
	getClientUrl(): string;
	getUploadUrl(): string;
	handleRequest(
		req: { method: string; url: string; body?: any; signal?: AbortSignal },
		userId: string,
		sessionId: string,
	): Promise<{
		status?: number;
		headers?: Record<string, string>;
		result?: any;
	}>;
}

