import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface ClientConfig {
	route?: string;
	adapter?: string;
	csrf?: string;
	token?: string;
	[key: string]: any;
}

let cachedScript: string | null = null;

export const getClientScript = (config: ClientConfig, production = true) => {
	const jsFilename = production ? "kirewire.min.js" : "kirewire.js";
    const cssFilename = production ? "kirewire.min.css" : "kirewire.css";
    const route = config.route || "/_wired";

	return `
<link rel="stylesheet" href="${route}/${cssFilename}">
<script src="${route}/${jsFilename}"></script>
`;
};
