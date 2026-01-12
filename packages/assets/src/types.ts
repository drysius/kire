declare module "kire" {
	export interface KireContext {
		_assets?: {
			scripts: string[]; // List of hashes
			styles: string[]; // List of hashes
			// SVGs are handled directly via img src, so we don't necessarily need a list here 
			// unless we want to preload them, but for now typical usage is direct reference.
		};
	}
}

export interface KireAsset {
	hash: string;
	content: string;
	type: "js" | "css" | "mjs" | "svg";
}

export interface KireAssetsOptions {
	prefix?: string;
	domain?: string;
}
