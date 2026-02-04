export interface ClientAdapter {
	request(payload: any, options?: RequestInit, onProgress?: (percent: number) => void): Promise<any>;
}

export class HttpAdapter implements ClientAdapter {
	constructor(
		private endpoint: string,
		private csrf?: string,
	) {}

	async request(payload: any, options: RequestInit = {}, onProgress?: (percent: number) => void) {
		const files = new Map<string, File>();

		const scanForFiles = (obj: any): any => {
			// Handle our reactive wrapper (created in model.ts)
            if (obj && obj._is_upload_wrapper && obj.rawFile) {
                const id = `file_${Math.random().toString(36).substr(2, 9)}`;
				files.set(id, obj.rawFile);
				return { _wire_file: id };
            }

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

		const headers: Record<string, string> = {
			"Accept": "application/json",
		};

		if (this.csrf) {
			headers["X-CSRF-TOKEN"] = this.csrf;
		}

		if (files.size > 0) {
            // Use XHR for upload progress support
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", this.endpoint, true);
                
                // Add headers
                Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
                if (options.headers) {
                    Object.entries(options.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v as string));
                }
                
                xhr.withCredentials = true;

                // Upload Progress
                if (xhr.upload && onProgress) {
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            const percent = (e.loaded / e.total) * 100;
                            onProgress(percent);
                        }
                    };
                }

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

                const fd = new FormData();
                fd.append("_wired_payload", JSON.stringify(processedPayload));
                files.forEach((file, id) => {
                    fd.append(id, file);
                });

                xhr.send(fd);
            });
		} else {
            // Standard Fetch for non-file requests
			headers["Content-Type"] = "application/json";
			const body = JSON.stringify(payload);

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
}
