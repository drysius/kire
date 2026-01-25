export interface ClientAdapter {
	request(payload: any): Promise<any>;
}

export class HttpAdapter implements ClientAdapter {
	constructor(
		private endpoint: string,
		private csrf?: string,
	) {}

	async request(payload: any) {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open("POST", this.endpoint, true);

			xhr.setRequestHeader("Accept", "application/json");
			if (this.csrf) xhr.setRequestHeader("X-CSRF-TOKEN", this.csrf);

			// Extract Component ID
			let componentId = null;
			if (payload.snapshot) {
				try {
					const snap = JSON.parse(payload.snapshot);
					componentId = snap.memo?.id;
				} catch (e) {}
			}

			// Handle FormData if Files are present
			let body: any = JSON.stringify(payload);
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
				if (obj && typeof obj === "object") {
					const newObj: any = {};
					for (const key in obj) {
						newObj[key] = scanForFiles(obj[key]);
					}
					return newObj;
				}
				return obj;
			};

			const processedPayload = scanForFiles(payload);

			if (files.size > 0) {
				const fd = new FormData();
				fd.append("_wired_payload", JSON.stringify(processedPayload));
				files.forEach((file, id) => {
					fd.append(id, file);
				});
				body = fd;
				// Do not set Content-Type header for FormData, browser does it with boundary
			} else {
				xhr.setRequestHeader("Content-Type", "application/json");
			}

			if (xhr.upload && componentId) {
				xhr.upload.onprogress = (e) => {
					if (e.lengthComputable) {
						const percent = Math.round((e.loaded / e.total) * 100);
						window.dispatchEvent(
							new CustomEvent("wire:upload-progress", {
								detail: { id: componentId, progress: percent },
							}),
						);
					}
				};
			}

			// ... rest of onload/onerror/send
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					try {
						resolve(JSON.parse(xhr.responseText));
					} catch (e) {
						reject(new Error("Invalid JSON response"));
					}
				} else {
					reject(new Error(`HTTP Error ${xhr.status}`));
				}
			};

			xhr.onerror = () => reject(new Error("Network Error"));

			xhr.send(body);
		});
	}
}
