import type { Kire, KirePlugin } from "kire";
import { build } from "./build";
import { dev } from "./dev";
import {
	activeKire,
	type SsgOptions,
	type SsgState,
	setActiveKire,
} from "./types";
import { getSsgState, trackFileAccess } from "./utils";

declare module "kire" {
	interface Kire {
		parseMarkdown?(content: string): Promise<string>;
	}
}

export const KireSsg: KirePlugin<SsgOptions> & {
	build: typeof build;
	dev: typeof dev;
	getFileAccessHistory: () => SsgState["fileAccessHistory"];
	getRouteCompilationChain: () => SsgState["routeCompilationChain"];
} = {
	name: "@kirejs/ssg",
	options: {},
	load(kire: Kire, opts) {
		setActiveKire(kire);

		const state: SsgState = {
			options: opts || {},
			dynamicRoutesMap: new Map(),
			fileAccessHistory: [],
			routeCompilationChain: new Map(),
			currentRoute: null,
		};

		if (state.options.assetsPrefix) {
			state.options.assetsPrefix = state.options.assetsPrefix
				.replace(/^\//, "")
				.replace(/\/$/, "");
		}

		const cache = kire.cached<SsgState>("@kirejs/ssg");
		cache.set("ROOT", state);

		trackFileAccess(kire);

		kire.$ctx("__ssg_register_routes", (routes: any[]) => {
			try {
				const ssgState = getSsgState(kire);
				if (ssgState.currentRoute) {
					ssgState.dynamicRoutesMap.set(ssgState.currentRoute, routes);
				}
			} catch (_e) {}
		});

		kire.directive({
			name: "dynamicroutes",
			params: ["routes:expression"],
			onCall(compiler) {
				const expr = compiler.param("routes");
				compiler.raw(`$ctx.__ssg_register_routes(${expr});`);
			},
		});
	},

	build,
	dev,

	getFileAccessHistory() {
		if (!activeKire) return [];
		try {
			return getSsgState(activeKire).fileAccessHistory;
		} catch (_e) {
			return [];
		}
	},

	getRouteCompilationChain() {
		if (!activeKire) return new Map();
		try {
			return getSsgState(activeKire).routeCompilationChain;
		} catch (_e) {
			return new Map();
		}
	},
};

export default KireSsg;
