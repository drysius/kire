export interface NodePluginOptions {
	adapter?: "node" | "bun" | "deno" | "fetch";
	isolation?:
		| boolean
		| {
				imports?: boolean; // Default: false (if isolation is true)
				globals?: boolean; // Default: false (if isolation is true)
				getContext?: ($ctx: any) => Record<string, any>;
		  };
}
