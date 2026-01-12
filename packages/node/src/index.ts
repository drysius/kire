import { createHash } from "node:crypto";
import type { Kire, KirePlugin } from "kire";
import { createExecutor } from "./executor";
import { createReadDir, createResolver } from "./resolver";
import type { NodePluginOptions } from "./types";

export * from "./types";
export * from "./resolver";
export * from "./executor";
export * from "./utils";
export * from "./adapters";

export const KireNode: KirePlugin<NodePluginOptions> = {
	name: "@kirejs/node",
	options: {},
	load(kire: Kire, opts) {
		const options = opts || {};

		// Assign the new resolver
		kire.$resolver = createResolver(options);
		kire.$readdir = createReadDir(options);

		// Set the executor if isolation is requested
		const executor = createExecutor(options);
		if (executor) {
			kire.$executor = executor;
		}

		// Register helpers
		kire.$ctx("$readdir", kire.$readdir);
		kire.$ctx("$md5", (str: string) =>
			createHash("md5").update(str).digest("hex"),
		);
	},
};

export default KireNode;