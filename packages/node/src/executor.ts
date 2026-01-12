import vm from "node:vm";
import type { NodePluginOptions } from "./types";

/**
 * Creates a VM-based executor for isolated execution.
 */
export function createExecutor(options: NodePluginOptions) {
	const isolation = options.isolation;
	if (!isolation) return undefined;

	const config =
		typeof isolation === "object"
			? isolation
			: { imports: false, globals: false };
	const allowImports = config.imports ?? false;
	const allowGlobals = config.globals ?? false;
	const getContext =
		typeof isolation === "object" ? isolation.getContext : undefined;

	// Prepare the sandbox context
	const sandbox: Record<string, any> = {};

	if (allowGlobals) {
		sandbox.console = console;
		sandbox.setTimeout = setTimeout;
		sandbox.clearTimeout = clearTimeout;
		sandbox.setInterval = setInterval;
		sandbox.clearInterval = clearInterval;
		sandbox.URL = URL;
		sandbox.Buffer = Buffer;
	}

	if (allowImports) {
		sandbox.require = require;
	}

	const context = vm.createContext(sandbox);

	return (code: string, params: string[]) => {
		const compiledFn = vm.compileFunction(code, params, {
			parsingContext: context,
		});

		return async function (this: any, ...args: any[]) {
			const $ctx = args[0];

			if (getContext && $ctx) {
				try {
					const extra = getContext($ctx);
					if (extra && typeof extra === "object") {
						Object.assign($ctx, extra);
					}
				} catch (e) {
					console.error("Error in isolation.getContext:", e);
				}
			}

			return compiledFn.apply(this, args);
		};
	};
}
