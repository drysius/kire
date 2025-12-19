import { watch } from "node:fs";
import { createServer, type ServerResponse } from "node:http";
import { join, relative, resolve } from "node:path";
import type { KireAsset } from "@kirejs/assets";
import { renderErrorPage } from "./error-page";
import { Logger, colors } from "./logger";
import { getFiles, getSsgState } from "./utils";
import { activeKire, type SsgBuilder, type SsgState } from "./types";

const devGeneratedFiles = new Map<string, string>();

export async function dev(opts: { port?: number } = {}) {
    const kireInstance = activeKire;
    if (!kireInstance) throw new Error("KireSsg plugin not registered.");

    const state = getSsgState(kireInstance);
    const pluginOptions = state.options;

    const port = opts.port || 3000;
    const clients: ServerResponse[] = [];
    const rootDir = resolve(kireInstance.root);
    const routesDir = resolve(rootDir, pluginOptions.routes || ".");
    const assetsPrefix = pluginOptions.assetsPrefix || "_kire";

    async function scanRoutes(): Promise<string[]> {
        const ext = kireInstance!.extension.startsWith(".")
            ? kireInstance!.extension
            : `.${kireInstance!.extension}`;
        
        const files = await getFiles(routesDir);
        const routes: string[] = [];
        
        for (const file of files) {
            if (!file.endsWith(ext)) continue;
            const relativePath = relative(routesDir, file);
            if (relativePath.split("/").some((p) => p.startsWith("_"))) continue;
            
            const nameWithoutExt = relativePath.slice(0, -ext.length);
            let routeUrl = "";
            if (nameWithoutExt === "index" || nameWithoutExt.endsWith("/index")) {
                routeUrl = nameWithoutExt.replace(/\/index$/, "") || "index";
            } else {
                routeUrl = nameWithoutExt;
            }
            routes.push(routeUrl === "index" ? "/" : "/" + routeUrl);
        }
        return routes;
    }

    if (pluginOptions.poshandler) {
        const routes = await scanRoutes();
        const builder: SsgBuilder = {
            routes,
            add: async (path: string, content: string) => {
                devGeneratedFiles.set(path, content);
                devGeneratedFiles.set("/" + path, content);
                Logger.info(`[DEV] Generated in-memory file: ${path}`);
            },
            rem: async (path: string) => {
                devGeneratedFiles.delete(path);
                devGeneratedFiles.delete("/" + path);
            }
        };
        await pluginOptions.poshandler(builder);
    }

    let fsWait: Timer | boolean = false;
    watch(rootDir, { recursive: true }, (_event, filename) => {
        if (filename) {
            if (fsWait) return;
            fsWait = setTimeout(() => {
                fsWait = false;
            }, 100);

            Logger.info(`File changed: ${filename}. Reloading...`);
            kireInstance!.cacheClear();

            clients.forEach(res => {
                res.write(`data: reload\n\n`);
            });
            
            if (pluginOptions.poshandler) {
                scanRoutes().then(routes => {
                    const builder: SsgBuilder = {
                        routes,
                        add: async (path, content) => {
                            devGeneratedFiles.set(path, content);
                            devGeneratedFiles.set("/" + path, content);
                        },
                        rem: async (path) => {
                            devGeneratedFiles.delete(path);
                            devGeneratedFiles.delete("/" + path);
                        }
                    };
                    pluginOptions.poshandler!(builder);
                });
            }
        }
    });

    const server = createServer(async (req, res) => {
        const url = req.url || "/";
        const start = Date.now();

        if (url === "/kire-livereload") {
            res.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            });
            res.write("data: connected\n\n");
            clients.push(res);

            req.on("close", () => {
                const idx = clients.indexOf(res);
                if (idx !== -1) clients.splice(idx, 1);
            });
            return;
        }

        try {
            const cleanPath = url.split('?')[0]!;
            if (devGeneratedFiles.has(cleanPath)) {
                const content = devGeneratedFiles.get(cleanPath)!;
                res.setHeader("Content-Type", cleanPath.endsWith(".xml") ? "application/xml" : "text/plain");
                res.end(content);
                Logger.request(req.method!, url, 200, Date.now() - start);
                return;
            }

            const prefixPath = `/${assetsPrefix}/`;
            if (url.startsWith(prefixPath)) {
                const match = url.match(/\/([a-f0-9]{8})\.(js|css|mjs)$/);
                if (match) {
                    const hash = match[1];
                    const ext = match[2] as "js" | "css" | "mjs";
                    const assetsCache = kireInstance!.cached<KireAsset>("@kirejs/assets");
                    const asset = assetsCache.get(hash!);
                    if (asset && asset.type === ext) {
                        res.setHeader(
                            "Content-Type",
                            ext === "css" ? "text/css" : "application/javascript",
                        );
                        res.end(asset.content);
                        Logger.request(req.method!, url, 200, Date.now() - start);
                        return;
                    } else {
                        const keys = Array.from(assetsCache.keys());
                        Logger.warn(`[DEV] Asset 404. Hash: ${hash}. Cache has ${keys.length} items: ${keys.join(', ')}`);
                    }
                }
                res.statusCode = 404;
                res.end("Asset Not Found");
                Logger.request(req.method!, url, 404, Date.now() - start);
                return;
            }

            let cleanUrl = url.split('?')[0];
            if (cleanUrl?.endsWith("/")) cleanUrl = cleanUrl.slice(0, -1);
            if (!cleanUrl) cleanUrl = "index";
            else cleanUrl = cleanUrl.substring(1); 
            
            const candidates = [
                cleanUrl,
                `${cleanUrl}/index`,
            ];
            
            const routesRelPath = pluginOptions.routes || ".";
            const ext = kireInstance!.extension.startsWith(".") ? kireInstance!.extension : `.${kireInstance!.extension}`;

            let html: string | null | undefined = null;
            let servedCandidate = "";
            let params: Record<string, string> = {};

            for (const candidate of candidates) {
                try {
                    const kirePath = join(routesRelPath, candidate);
                    html = await kireInstance?.view(kirePath, { $params: {} });
                    servedCandidate = kirePath;
                    break;
                } catch (e: any) {
                    if (
                        e.message.includes("No resolver") ||
                        e.message.includes("ENOENT") ||
                        e.message.includes("Template not found")
                    ) {
                        continue;
                    }
                    throw e;
                }
            }

            if (html === null) {
                const allFiles = await getFiles(routesDir);
                const dynamicTemplates = allFiles.filter(f => f.includes('[') && f.endsWith(ext));

                for (const template of dynamicTemplates) {
                    const relTemplatePath = relative(routesDir, template);
                    const match = relTemplatePath.match(/\[([^\]]+)\]/);
                    const paramName = match ? match[1] : null;

                    if (paramName) {
                        // Create regex from template path: packages.[package].kire -> ^packages/([^/]+)/?$
                        const pattern = relTemplatePath
                            .slice(0, -ext.length)
                            .replace(`[${paramName}]`, "([^/]+)")
                            .replace(/\.$/, "") // Remove trailing dot if it was before [param]
                            .replace(/\\/g, '/'); // Normalize slashes for regex
                        
                        const regex = new RegExp(`^${pattern}/?$`);
                        const urlMatch = cleanUrl.match(regex);

                        if (urlMatch) {
                            params[paramName] = urlMatch[1]!;
                            
                            const kirePath = join(routesRelPath, relTemplatePath.slice(0, -ext.length)); // View expects path without ext? No, view expects relative path usually with ext or resolved.
                            // Kire view needs path relative to root? Or resolved?
                            // In build.ts: kireInstance.view(kireResolvePath, ...)
                            // Here kirePath is relative to routesDir.
                            // Let's pass the full relative path from root.
                            const rootRelPath = relative(rootDir, template);
                            
                            html = await kireInstance?.view(rootRelPath, { $params: params });
                            servedCandidate = rootRelPath;
                            break;
                        }
                    }
                }
            }

            if (html !== null) {
                res.setHeader("Content-Type", "text/html");

                const liveReloadScript = `
                    <script>
                        (() => {
                            const evtSource = new EventSource("/kire-livereload");
                            evtSource.onmessage = (event) => {
                                if (event.data === "reload") {
                                    window.location.reload();
                                }
                            };
                        })();
                    </script>
                `;

                if (html!.includes("</body>")) {
                    html = html!.replace("</body>", `${liveReloadScript}</body>`);
                } else {
                    html += liveReloadScript;
                }

                res.end(html);
                Logger.request(req.method!, url, 200, Date.now() - start);
            } else {
                try {
                    const notFoundPath = join(routesRelPath, "_not_found");
                    let notFoundHtml = await kireInstance?.view(notFoundPath);
                    
                    if (notFoundHtml) {
                        res.statusCode = 404;
                        res.setHeader("Content-Type", "text/html");

                        const liveReloadScript = `
                            <script>
                                (() => {
                                    const evtSource = new EventSource("/kire-livereload");
                                    evtSource.onmessage = (event) => {
                                        if (event.data === "reload") {
                                            window.location.reload();
                                        }
                                    };
                                })();
                            </script>
                        `;

                        if (notFoundHtml.includes("</body>")) {
                            notFoundHtml = notFoundHtml.replace("</body>", `${liveReloadScript}</body>`);
                        } else {
                            notFoundHtml += liveReloadScript;
                        }

                        res.end(notFoundHtml);
                        Logger.request(req.method!, url, 404, Date.now() - start);
                        return;
                    }
                } catch (e) {
                    // Ignore
                }

                const isNoise = url.includes("favicon.ico") || url.includes(".well-known") || url.includes(".map");
                res.statusCode = 404;
                res.end(`Not Found: ${req.url}`);
                if (!isNoise) Logger.request(req.method!, url, 404, Date.now() - start);
            }
        } catch (e: any) {
            res.statusCode = 500;
            res.end(renderErrorPage({
                error: e,
                req,
                files: [],
                kire: kireInstance!
            }));
            Logger.error(`500 ${req.url}`, e);
            Logger.request(req.method!, url, 500, Date.now() - start);
        }
    });

    server.listen(port, () => {
        Logger.success(`Server running at ${colors.brightWhite}http://localhost:${port}${colors.reset}`);
    });

    return new Promise(() => { });
}