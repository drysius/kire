import { createHmac, randomUUID } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, parse, resolve } from "node:path";
import type { Kire } from "kire";
import { ChecksumManager } from "./core/checksum";
import { attachContext } from "./core/context";
import { registerDirectives } from "./core/directives";
import { processRequest } from "./core/process";
import { registry } from "./core/registry";
import { JWT } from "./utils/crypto";
import type { WireOptions, WirePayload, WiredRequest } from "./types";

export class Wired {
	public static options: WireOptions = {
		route: "/_wired",
		adapter: "http",
		secret: randomUUID(),
		expire: "10m",
	};

	public static invalid = { code: 400, error: "Invalid Request" };
	public static checksum: ChecksumManager;
	private static kire: Kire;
    // Internal cache for WeakMap if needed, though with strings it's not applicable directly.
    // Maybe for caching keys?
    private static keyCache = new Map<string, string>(); 

	public static plugin(kire: Kire, opts: Partial<WireOptions> = {}) {
		Wired.kire = kire;
		Wired.options = { ...Wired.options, ...opts };
		if (!Wired.options.secret) Wired.options.secret = randomUUID();

		Wired.checksum = new ChecksumManager(() => Wired.options.secret!);
        
        // Expose Wired on Kire instance
        kire.$ctx("Wired", Wired);
        kire.$ctx("$wire", Wired); // Alias for directives
        kire.$ctx("kire", kire); // Ensure kire instance is available in context

		// Register directives
		registerDirectives(kire, Wired.options);

		// Extend Kire with .wired() 
		(kire as any).wired = async (pattern: string) => {
            const root = process.cwd();
            // Basic glob support: 'components/*.{js,ts}' or 'components'
            let searchDir = root;
            let fileExts = ['.js', '.ts'];
            
            // Very basic pattern parsing
            if (pattern.includes('*')) {
                const parts = pattern.split('/');
                const wildIndex = parts.findIndex(p => p.includes('*'));
                searchDir = resolve(root, parts.slice(0, wildIndex).join('/'));
                // Extension parsing could be improved
            } else {
                searchDir = resolve(root, pattern);
            }

            if (existsSync(searchDir)) {
                const files = Wired.walk(searchDir);
                for (const file of files) {
                    if (fileExts.some(ext => file.endsWith(ext)) && !file.endsWith('.d.ts')) {
                        try {
                            const mod = await import(file);
                            // Find component class
                            const Comp = mod.default || Object.values(mod).find((e: any) => typeof e === 'function' && e.prototype && e.prototype.render);
                            
                            if (Comp) {
                                // Name strategy: relative path from searchDir, dot notation
                                // e.g. /abs/path/components/auth/Login.ts -> auth.login
                                const relPath = file.slice(searchDir.length + 1);
                                const parsed = parse(relPath);
                                const dirParts = parsed.dir ? parsed.dir.split(/[\\/]/) : [];
                                const name = [...dirParts, parsed.name].join('.').toLowerCase();
                                
                                registry.register(name, Comp);
                            }
                        } catch (e) {
                            console.error(`[Wired] Failed to load component: ${file}`, e);
                        }
                    }
                }
            }
		};
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
        } catch(e) {
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
		return body && typeof body === 'object' && (Boolean(body.component) || Boolean(body.snapshot));
	}

	public static async payload(wirekey: string, body: WirePayload, contextOverrides: Partial<WireContext> = {}) {
        // Construct WiredRequest for hooks
        const now = Math.floor(Date.now() / 1000);
        let expire = 600; // 10m default
        
        if (Wired.options.expire) {
            const match = Wired.options.expire.match(/(\d+)([ms]+)/);
            if (match) {
                const val = parseInt(match[1]!);
                const unit = match[2];
                if (unit === 'm') expire = val * 60;
                else if (unit === 's') expire = val;
            }
        }

        // Validate Token if exists
        let isValidToken = false;
        if (body._token) {
            const payload = JWT.verify(body._token, Wired.options.secret!);
            if (payload && payload.key === wirekey) {
                isValidToken = true;
            }
        }

        const wireReq: WiredRequest = {
            identifiers: [wirekey],
            payload: body,
            expire,
            created: now,
            renew: () => {
                const newToken = JWT.sign({ key: wirekey }, Wired.options.secret!, expire);
                wireReq.token = newToken;
            },
            token: isValidToken ? body._token : undefined,
            csrftoken: body._token
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
            Wired.kire, 
            registry, 
            Wired.checksum,
            contextOverrides
        );
	}
}
