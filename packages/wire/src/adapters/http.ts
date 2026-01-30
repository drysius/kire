export interface ClientAdapter {
	request(payload: any, options?: RequestInit): Promise<any>;
}

export class HttpAdapter implements ClientAdapter {
	constructor(
		private endpoint: string,
		private csrf?: string,
	) {}

	async request(payload: any, options: RequestInit = {}) {
		const files = new Map<string, File>();

		const scanForFiles = (obj: any): any => {
			if (obj instanceof File) {
				const id = `file_${Math.random().toString(36).substr(2, 9)}`;
				files.set(id, obj);
				return { _wire_file: id };
			}
			if (obj instanceof FileList) {
				return Array.from(obj).map(scanForFiles);
			}
			if (Array.isArray(obj)) {
				return obj.map(scanForFiles);
			}
			if (obj && typeof obj === "object" && obj !== null) {
				const newObj: any = {};
				for (const key in obj) {
					newObj[key] = scanForFiles(obj[key]);
				}
				return newObj;
			}
			return obj;
		};

		const processedPayload = scanForFiles(payload);

		let body: BodyInit;
		const headers: HeadersInit = {
			"Accept": "application/json",
		};

		if (this.csrf) {
			// @ts-ignore
			headers["X-CSRF-TOKEN"] = this.csrf;
		}

		if (files.size > 0) {
			const fd = new FormData();
			fd.append("_wired_payload", JSON.stringify(processedPayload));
			files.forEach((file, id) => {
				fd.append(id, file);
			});
			body = fd;
		} else {
			// @ts-ignore
			headers["Content-Type"] = "application/json";
			body = JSON.stringify(payload);
		}

		const response = await fetch(this.endpoint, {
			method: "POST",
			headers,
			body,
			credentials: "include",
            ...options,
		});

		if (!response.ok) {
			throw new Error(`HTTP Error ${response.status}`);
		}

		return await response.json();
	}
}