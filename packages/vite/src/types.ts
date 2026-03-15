export type KireViteInput = string | string[];

export interface KireViteBaseOptions {
	publicDirectory?: string;
	buildDirectory?: string;
	manifestFilename?: string;
	hotFile?: string;
	assetUrl?: string;
	cwd?: string;
}

export interface KireVitePluginAssetOptions extends KireViteBaseOptions {
	input?: KireViteInput;
	refresh?: boolean | string[];
	devServerUrl?: string;
	kire?: false;
}

export interface KireVitePluginTemplateOptions extends KireViteBaseOptions {
	kire: true;
	root?: string;
	namespaces?: Record<string, string | string[]>;
	directories?: string[];
	outfile?: string;
	refresh?: boolean | string[];
}

export type KireVitePluginOptions =
	| KireVitePluginAssetOptions
	| KireVitePluginTemplateOptions;

export interface KireViteRenderOptions extends KireViteBaseOptions {
	input?: KireViteInput;
	devServerUrl?: string;
	throwOnMissingEntry?: boolean;
}

export interface ViteManifestChunk {
	file: string;
	src?: string;
	isEntry?: boolean;
	imports?: string[];
	dynamicImports?: string[];
	css?: string[];
	assets?: string[];
}

export type ViteManifest = Record<string, ViteManifestChunk>;

export interface ViteConfigEnv {
	command: string;
	mode: string;
}

export interface ViteUserConfig {
	root?: string;
	build?: {
		outDir?: string;
		manifest?: string | boolean;
		emptyOutDir?: boolean;
		rollupOptions?: {
			input?: unknown;
		};
	};
	server?: {
		host?: string | boolean;
		port?: number;
		https?: boolean | Record<string, unknown>;
		origin?: string;
	};
}

export interface ViteResolvedConfig extends ViteUserConfig {
	root: string;
	command?: string;
}

export interface ViteWatcher {
	on(event: string, callback: (file: string) => void): unknown;
	off?(event: string, callback: (file: string) => void): unknown;
}

export interface ViteWebSocket {
	send(payload: any): void;
}

export interface ViteHttpServer {
	once(event: string, callback: () => void): unknown;
	address?: () => any;
}

export interface ViteDevServer {
	ws: ViteWebSocket;
	watcher: ViteWatcher;
	httpServer?: ViteHttpServer;
	resolvedUrls?: {
		local?: string[];
		network?: string[];
	};
}

export interface ViteHotUpdateContext {
	file: string;
	server: ViteDevServer;
}

export interface VitePlugin {
	name: string;
	enforce?: "pre" | "post";
	config?: (config: ViteUserConfig, env: ViteConfigEnv) => ViteUserConfig | void;
	configResolved?: (config: ViteResolvedConfig) => void | Promise<void>;
	configureServer?: (
		server: ViteDevServer,
	) => void | (() => void) | Promise<void | (() => void)>;
	handleHotUpdate?: (ctx: ViteHotUpdateContext) => void | Promise<void>;
	buildStart?: () => void | Promise<void>;
}
