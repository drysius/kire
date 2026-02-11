import { createHmac, randomUUID } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, parse, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
    WireRequestOptions,
    WireRequestResponse,
} from "./types";
import { JWT } from "./utils/crypto";
import { getClientScript } from "./utils/client-script";

export class Wired {
	public static options: WireOptions = {
		route: "/_wired",
		adapter: "http",
		secret: randomUUID(),
		expire: "10m",
	};

    public static cache: WireCacheDriver;
	public static invalid = { code: 400, error: "Invalid Request", data: {} };
	public static checksum: ChecksumManager;
	private static kire: Kire;

    public static async storeTempFile(buffer: Buffer | any, mime: string, name: string): Promise<string> {
        const id = randomUUID();
        await Wired.cache.set(id, buffer, mime);
        setTimeout(() => Wired.cache.del(id), 1000 * 60 * 60);
        return id;
    }

    public static async getTempFile(id: string) {
        return await Wired.cache.get(id);
    }

    private static async getAssetContent(filename: string): Promise<string | null> {
        const pathsToTry = [
            resolve(dirname(fileURLToPath(import.meta.url)), "../../client", filename),
            resolve(dirname(fileURLToPath(import.meta.url)), "../../dist/client", filename),
            resolve(dirname(fileURLToPath(import.meta.url)), "../../../dist/client", filename),
            join(process.cwd(), "packages/wire/dist/client", filename),
            join(process.cwd(), "../../packages/wire/dist/client", filename),
            join(process.cwd(), "node_modules/@kirejs/wire/dist/client", filename),
        ];

        for (const p of pathsToTry) {
            if (existsSync(p)) {
                try {
                    const { readFileSync } = await import("node:fs");
                    return readFileSync(p, "utf-8");
                } catch (e) {
                    console.error(`[Wired] Failed to read asset ${filename} from ${p}`, e);
                }
            }
        }
        return null;
    }

	public static plugin = {
		name: "@kirejs/wire",
		options: {},
		load: (kire: Kire, opts: Record<string, string> = {}) => {
			Wired.kire = kire;
			Wired.options = { ...Wired.options, ...opts };
			if (!Wired.options.secret) Wired.options.secret = randomUUID();

			Wired.checksum = new ChecksumManager(() => Wired.options.secret!);

            if (Wired.options.cache) {
                Wired.cache = Wired.options.cache;
            } else {
                Wired.cache = new WireMemoryCaching(kire);
            }

			// Expose Wired on Kire instance
			kire.$ctx("Wired", Wired);
			kire.$ctx("$wire", Wired); 
			kire.$ctx("kire", kire);

            kire.Wired = Wired;
            kire.WireRequest = (opts: WireRequestOptions) => Wired.handleRequest(kire, opts);

            kire.onFork((fork) => {
                fork.Wired = Wired;
                fork.WireRequest = (opts: WireRequestOptions) => Wired.handleRequest(fork, opts);
            });

            kire.kireSchema({
                name: "@kirejs/wire",
                author: "Drysius",
                repository: "https://github.com/drysius/kire",
                version: "0.1.2"
            });

            // Register Attributes
            for (const [key, value] of Object.entries(WireAttributes)) {
                kire.type({
                    variable: key,
                    type: "element",
                    comment: value.comment,
                    example: value.example,
                    tstype: "string"
                });
            }

            // Register Template Element
            kire.element({
                name: "template",
                description: "Standard HTML template element, heavily used by Alpine.js for x-for and x-if directives.",
            });
            // Register template attributes manually as kire.element() strictly registers the element tag now
            kire.type({
                variable: "x-for",
                type: "element",
                comment: "Iterates over an array or object.",
                example: 'x-for="item in items"',
                tstype: "string"
            });
            kire.type({
                variable: "x-if",
                type: "element",
                comment: "Conditionally renders content.",
                example: 'x-if="open"',
                tstype: "string"
            });

			registerDirectives(kire, Wired.options);

			(kire as any).wired = async (pattern: string) => Wired.discoverComponents(pattern);
		},
	};

    public static async handleRequest(kire: Kire, options: WireRequestOptions): Promise<WireRequestResponse> {
        const { path, method, body, query, locals, token } = options;
        const route = Wired.options.route || "/_wired";

        if (!path.startsWith(route)) {
            return { code: "not_wired" };
        }

        const subPath = path.slice(route.length);

        // Assets
        if (method === "GET") {
            const assetMatch = subPath.match(/^\/(kirewire\.(?:min\.)?(?:js|css))$/);
            if (assetMatch) {
                const filename = assetMatch[1];
                const extension = filename!.split('.').pop();
                const contentType = extension === 'js' ? 'application/javascript' : 'text/css';
                
                const fileContent = await Wired.getAssetContent(filename!);
                if (fileContent) {
                    return {
                        status: 200,
                        headers: { 
                            "Content-Type": contentType,
                            "Cache-Control": "public, max-age=604800, immutable" // 7 days
                        },
                        body: fileContent,
                    };
                }
            }

            if (subPath === "/preview") {
                const id = query?.id;
                if (!id) return { status: 404, body: "File ID required" };
                
                const file = await Wired.getTempFile(id as string);
                if (!file) return { status: 404, body: "File not found or expired" };

                return {
                    status: 200,
                    headers: { "Content-Type": file.mime },
                    body: file.stream,
                };
            }
        }

        // Component Request
        if (method === "POST" && (subPath === "" || subPath === "/")) {
            return await Wired.processComponentRequest(kire, body, locals, token);
        }

        return { status: 404, body: "Not Found" };
    }

    private static async processComponentRequest(kire: Kire, body: any, contextOverrides: Partial<WireContext> = {}, token?: string): Promise<WireRequestResponse> {
        let processedBody = body;

        // Handle Multipart/FormData
        if (body && typeof body === "object" && body._wired_payload) {
            try {
                let payloadData = body._wired_payload;
                if (Array.isArray(payloadData)) payloadData = payloadData[payloadData.length - 1];
                if (typeof payloadData === 'object' && payloadData !== null && 'value' in payloadData) payloadData = payloadData.value;
                
                if (typeof payloadData !== 'string') return { status: 400, body: Wired.invalid };

                const originalPayload = JSON.parse(payloadData);
                processedBody = await Wired.restoreFiles(originalPayload, body);
            } catch (e) {
                if (!kire.production) console.error("Failed to parse multipart wired payload", e);
                return { status: 400, body: Wired.invalid };
            }
        }

        // Validate payload structure
        const isBatch = processedBody && Array.isArray(processedBody.components);
        const isValid = isBatch || (processedBody && (processedBody.component || processedBody.snapshot || processedBody._wired_payload));

        if (!processedBody || typeof processedBody !== "object" || !isValid) {
             return { status: 400, body: Wired.invalid };
        }

        // Extract identifiers/keys
        const wireProp = (kire as any).$props;
        const autoToken = wireProp?.get ? wireProp.get('$wireToken') : wireProp?.$wireToken;
        
        const wireKey = token || contextOverrides.wireToken || autoToken || processedBody.fingerprint?.name || processedBody.component || (isBatch ? processedBody.components[0].component : "unknown");

        // Setup Request Context
        const now = Math.floor(Date.now() / 1000);
        let expire = 600;
        if (Wired.options.expire) {
			const match = Wired.options.expire.match(/(\d+)([ms]+)/);
			if (match) {
				const val = parseInt(match[1]!);
				const unit = match[2];
				if (unit === "m") expire = val * 60;
				else if (unit === "s") expire = val;
                else if (unit === "h") expire = val * 60 * 60;
			}
		}

        let isValidToken = false;
        if (processedBody._token) {
            const payload = JWT.verify(processedBody._token, Wired.options.secret!);
            // Relaxed validation: just check if valid JWT signed by us
            if (payload) isValidToken = true;
        }

        const wireReq: WiredRequest = {
            identifiers: [wireKey],
            payload: processedBody,
            expire,
            created: now,
            renew: () => {
                const newToken = JWT.sign({ key: wireKey }, Wired.options.secret!, expire);
                wireReq.token = newToken;
            },
            token: isValidToken ? processedBody._token : undefined,
            csrftoken: processedBody._token,
        };

        if (Wired.options.onPayload) {
            Wired.options.onPayload(wireReq);
        }

        const mockReq = { body: processedBody };
        attachContext(mockReq, wireKey);

        const result = await processRequest(
            mockReq,
            kire,
            registry,
            Wired.checksum,
            contextOverrides
        );

        return {
            status: result.code,
            headers: { "Content-Type": "application/json" },
            body: result.data
        };
    }

    private static async restoreFiles(obj: any, body: any): Promise<any> {
        if (obj && typeof obj === "object") {
            if (obj._wire_file) {
                const fileId = obj._wire_file;
                let file = body[fileId];
                if (Array.isArray(file)) file = file[0];

                if (file) {
                    let buffer: Buffer;
                    let mime = file.mimetype || file.type || "application/octet-stream";
                    let name = file.filename || file.name || "unknown";
                    let size = file.size || 0;
                    let lastModified = file.lastModified || Date.now();

                    if (typeof file.toBuffer === 'function') {
                        buffer = await file.toBuffer();
                        size = buffer.length;
                    } else if (typeof file.arrayBuffer === 'function') {
                        const arrayBuffer = await file.arrayBuffer();
                        buffer = Buffer.from(arrayBuffer);
                    } else if (file.data && Buffer.isBuffer(file.data)) {
                        buffer = file.data;
                        if (file.mimetype) mime = file.mimetype;
                        if (file.filename) name = file.filename;
                        size = buffer.length;
                    } else if (Buffer.isBuffer(file)) {
                        buffer = file;
                        size = buffer.length;
                    } else {
                        return null;
                    }

                    const base64 = buffer.toString("base64");
                    return {
                        name, size, type: mime, lastModified,
                        content: `data:${mime};base64,${base64}`,
                    };
                }
                return null;
            }

            if (Array.isArray(obj)) {
                return Promise.all(obj.map(item => Wired.restoreFiles(item, body)));
            }

            const newObj: any = {};
            for (const key in obj) {
                newObj[key] = await Wired.restoreFiles(obj[key], body);
            }
            return newObj;
        }
        return obj;
    }

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
		} catch (e) { }
		return results;
	}

    public static keystore(...keys: string[]): string {
		const content = keys.join("|");
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

    /** @deprecated Use WireRequest */
    public static async payload(wirekey: string, body: any, contextOverrides: Partial<WireContext> = {}, kire: Kire = Wired.kire) {
        const res = await Wired.handleRequest(kire, {
            path: Wired.options.route,
            method: "POST",
            body,
            locals: { ...contextOverrides, wireToken: wirekey }
        });
        let data = res.body;
        if (data && data.components && data.components.length === 1) {
            if (data.components[0].error) {
                // Compatibility for error message
                if (data.components[0].error.startsWith("Component not found")) {
                    data = { error: "Component not found" };
                } else {
                    data = data.components[0];
                }
            }
        }
        return { code: res.status, data: data };
    }

    private static async discoverComponents(pattern: string) {
        const root = process.cwd();
        let searchDir = root;
        const fileExts = [".js", ".ts"];

        if (pattern.includes("*")) {
            const parts = pattern.split("/");
            const wildIndex = parts.findIndex((p) => p.includes("*"));
            searchDir = resolve(root, parts.slice(0, wildIndex).join("/"));
        } else {
            searchDir = resolve(root, pattern);
        }

        if (existsSync(searchDir)) {
            const files = Wired.walk(searchDir);
            for (const file of files) {
                if (fileExts.some((ext) => file.endsWith(ext)) && !file.endsWith(".d.ts")) {
                    try {
                        const mod = await import(file);
                        const Comp = mod.default || Object.values(mod).find((e: any) => typeof e === "function" && e.prototype && e.prototype.render);

                        if (Comp) {
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
                        if (!Wired.kire.production) console.error(`[Wired] Failed to load component: ${file}`, e);
                    }
                }
            }
        }
    }
}
