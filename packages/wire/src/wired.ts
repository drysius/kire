import { createHmac, randomUUID } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, parse, resolve } from "node:path";
import type { Kire } from "kire";
import { WireAttributes } from "./core/attrs-declarations";
import { ChecksumManager } from "./core/checksum";
import { attachContext } from "./core/context";
import { registerDirectives } from "./core/directives";
import { processRequest } from "./core/process";
import { registry } from "./core/registry";
import { WireFileCaching, WireMemoryCaching } from "./core/cache";
import type {
	WireContext,
	WiredRequest,
	WireOptions,
    WireCacheDriver,
} from "./types";
import { JWT } from "./utils/crypto";

export class Wired {
	public static options: WireOptions = {
		route: "/_wired",
		adapter: "http",
		secret: randomUUID(),
		expire: "10m",
	};

    public static cache: WireCacheDriver;

    public static async storeTempFile(buffer: Buffer | any, mime: string, name: string): Promise<string> {
        const id = randomUUID();
        // Fire and forget auto-expire logic if needed, but cache driver usually handles persistence.
        // For FS cache, we might want a cleanup job, but simple setTimeout is fine for prototype.
        await Wired.cache.set(id, buffer, mime);
        setTimeout(() => Wired.cache.del(id), 1000 * 60 * 60);
        return id;
    }

    public static async getTempFile(id: string) {
        return await Wired.cache.get(id);
    }

	public static invalid = { code: 400, error: "Invalid Request", data: {} };
	public static checksum: ChecksumManager;
	private static kire: Kire;

	public static plugin = {
		name: "@kirejs/wire",
		options: {},
		load: (kire: Kire, opts: Record<string, string> = {}) => {
			Wired.kire = kire;
			Wired.options = { ...Wired.options, ...opts };
			if (!Wired.options.secret) Wired.options.secret = randomUUID();

			Wired.checksum = new ChecksumManager(() => Wired.options.secret!);

            // Initialize Cache
            if (Wired.options.cache) {
                Wired.cache = Wired.options.cache;
            } else {
                Wired.cache = new WireMemoryCaching(kire);
            }

			// Expose Wired on Kire instance
			kire.$ctx("Wired", Wired);
			kire.$ctx("$wire", Wired); // Alias for directives
			kire.$ctx("kire", kire); // Ensure kire instance is available in context

			// Register attributes schema
			kire.schematic("attributes.global", WireAttributes);

			// Register standard Alpine.js elements
			kire.schematic("elements", {
				template: {
					description:
						"Standard HTML template element, heavily used by Alpine.js for x-for and x-if directives.",
					attributes: {
						"x-for": {
							type: "string",
							comment:
								"Iterates over an array or object. Must be used on a <template> tag.",
							example: 'x-for="item in items"',
						},
						"x-if": {
							type: "string",
							comment:
								"Conditionally renders content. Must be used on a <template> tag.",
							example: 'x-if="open"',
						},
					},
				},
			});

			// Register directives
			registerDirectives(kire, Wired.options);

			// Extend Kire with .wired()
			(kire as any).wired = async (pattern: string) => {
				const root = process.cwd();
				// Basic glob support: 'components/*.{js,ts}' or 'components'
				let searchDir = root;
				const fileExts = [".js", ".ts"];

				// Very basic pattern parsing
				if (pattern.includes("*")) {
					const parts = pattern.split("/");
					const wildIndex = parts.findIndex((p) => p.includes("*"));
					searchDir = resolve(root, parts.slice(0, wildIndex).join("/"));
					// Extension parsing could be improved
				} else {
					searchDir = resolve(root, pattern);
				}

				if (existsSync(searchDir)) {
					const files = Wired.walk(searchDir);
					for (const file of files) {
						if (
							fileExts.some((ext) => file.endsWith(ext)) &&
							!file.endsWith(".d.ts")
						) {
							try {
								const mod = await import(file);
								// Find component class
								const Comp =
									mod.default ||
									Object.values(mod).find(
										(e: any) =>
											typeof e === "function" &&
											e.prototype &&
											e.prototype.render,
									);

								if (Comp) {
									// Name strategy: relative path from searchDir, dot notation
									// e.g. /abs/path/components/auth/Login.ts -> auth.login
									const relPath = file.slice(searchDir.length + 1);
									const parsed = parse(relPath);
									const dirParts = parsed.dir ? parsed.dir.split(/[\\/]/) : [];
									const name = [...dirParts, parsed.name].join(".");

									registry.register(name, Comp);
                                    if (!Wired.kire.$silent) {
                                        console.log(`[Wired] loaded wire component ${name}`);
                                    }
								}
							} catch (e) {
								if (!Wired.kire.production)
									console.error(`[Wired] Failed to load component: ${file}`, e);
							}
						}
					}
				}
			};
		},
	};

	private static walk(dir: string): string[] {
		let results: string[] = [];
		try {
			const list = readdirSync(dir);
			for (const file of list) {
				const path = join(dir, file);
				const stat = statSync(path);
				if (stat && stat.isDirectory()) {
					results = results.concat(Wired.walk(path));
				} else {
					results.push(path);
				}
			}
		} catch (e) {
			// ignore
		}
		return results;
	}

	public static keystore(...keys: string[]): string {
		const content = keys.join("|");
		// Use HMAC to ensure key cannot be forged without secret
		return createHmac("sha256", Wired.options.secret!)
			.update(content)
			.digest("hex");
	}

	public static getComponentClass(name: string) {
		return registry.get(name);
	}

	public static register(name: string, component: any) {
		registry.register(name, component);
	}

	public static validate(body: any): boolean {
		return (
			body &&
			typeof body === "object" &&
			(Boolean(body.component) ||
				Boolean(body.snapshot) ||
				Boolean(body._wired_payload))
		);
	}

	public static async payload(
		wirekey: string,
		body: any,
		contextOverrides: Partial<WireContext> = {},
		kire: Kire = Wired.kire,
	) {
		// Handle Multipart/FormData
		// Expects body to be parsed by framework (e.g. Elysia)
		if (body && typeof body === "object" && body._wired_payload) {
			try {
                let payloadData = body._wired_payload;
                
                if (Array.isArray(payloadData)) {
                    payloadData = payloadData[payloadData.length - 1]; // Take last if multiple?
                }

                // Fastify multipart might wrap field values in objects { value: '...' }
                if (typeof payloadData === 'object' && payloadData !== null && 'value' in payloadData) {
                    payloadData = payloadData.value;
                }

                if (typeof payloadData !== 'string') {
                    return Wired.invalid;
                }

				const originalPayload = JSON.parse(payloadData);

				// Recursively restore files
				const restoreFiles = async (obj: any): Promise<any> => {
					if (obj && typeof obj === "object") {
						if (obj._wire_file) {
							const fileId = obj._wire_file;
							let file = body[fileId];
                            
                            // Fastify array of files support (though usually one per id here)
                            if (Array.isArray(file)) file = file[0];

							if (file) {
                                let buffer: Buffer;
                                let mime = file.mimetype || file.type || "application/octet-stream";
                                let name = file.filename || file.name || "unknown";
                                let size = file.size || 0;
                                let lastModified = file.lastModified || Date.now();

                                if (typeof file.toBuffer === 'function') {
                                    // Fastify / Busboy MultipartFile
                                    buffer = await file.toBuffer();
                                    size = buffer.length;
                                } else if (typeof file.arrayBuffer === 'function') {
                                    // Standard Blob/File
                                    const arrayBuffer = await file.arrayBuffer();
                                    buffer = Buffer.from(arrayBuffer);
                                } else if (file.data && Buffer.isBuffer(file.data)) {
                                    // Fastify / Busboy
                                    buffer = file.data;
                                    if (file.mimetype) mime = file.mimetype;
                                    if (file.filename) name = file.filename;
                                    size = buffer.length;
                                } else if (Buffer.isBuffer(file)) {
                                    // Raw Buffer
                                    buffer = file;
                                    size = buffer.length;
                                } else {
                                    // Unknown or invalid file format
                                    return null;
                                }

								const base64 = buffer.toString("base64");

								return {
									name: name,
									size: size,
									type: mime,
									lastModified: lastModified,
									content: `data:${mime};base64,${base64}`,
								};
							}
							return null;
						}

						if (Array.isArray(obj)) {
							return Promise.all(obj.map(restoreFiles));
						}

						const newObj: any = {};
						for (const key in obj) {
							newObj[key] = await restoreFiles(obj[key]);
						}
						return newObj;
					}
					return obj;
				};

				body = await restoreFiles(originalPayload);
			} catch (e) {
				if (!Wired.kire.production) {
					console.error("Failed to parse multipart wired payload", e);
				} else {
					console.warn("Failed to parse multipart wired payload");
				}
				return Wired.invalid;
			}
		}

		// Construct WiredRequest for hooks
		const now = Math.floor(Date.now() / 1000);
		let expire = 600; // 10m default

		if (Wired.options.expire) {
			const match = Wired.options.expire.match(/(\d+)([ms]+)/);
			if (match) {
				const val = parseInt(match[1]!);
				const unit = match[2];
				if (unit === "m") expire = val * 60;
				else if (unit === "s") expire = val;
			}
		}

		// Validate Token if exists
		let isValidToken = false;
		if (body._token) {
			const payload = JWT.verify(body._token, Wired.options.secret!);
			if (payload && payload.key === wirekey) {
				isValidToken = true;
			} else {
				if (!Wired.kire.production) {
					console.warn("[Wired] Invalid Token:", {
						received: body._token,
						payload,
						expectedKey: wirekey,
					});
				} else {
					console.warn("[Wired] Invalid Token!");
				}
			}
		} else {
			// console.log("[Wired] No token provided in payload");
		}

		const wireReq: WiredRequest = {
			identifiers: [wirekey],
			payload: body,
			expire,
			created: now,
			renew: () => {
				const newToken = JWT.sign(
					{ key: wirekey },
					Wired.options.secret!,
					expire,
				);
				wireReq.token = newToken;
			},
			token: isValidToken ? body._token : undefined,
			csrftoken: body._token,
		};

		if (Wired.options.onPayload) {
			Wired.options.onPayload(wireReq);
		}

		// Use the wirekey as the identifier for checksum validation
		// This ensures the user who generated the snapshot is the one mutating it
		const mockReq = { body };
		attachContext(mockReq, wirekey);

		return processRequest(
			mockReq,
			kire,
			registry,
			Wired.checksum,
			contextOverrides,
		);
	}
}
