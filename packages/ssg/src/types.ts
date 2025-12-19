import type { Kire } from "kire";

export interface SsgBuilder {
	routes: string[];
	add: (path: string, content: string) => Promise<void>;
	rem: (path: string) => Promise<void>;
}

export interface SsgOptions {
	assetsPrefix?: string;
	routes?: string;
	public?: string;
	poshandler?: (builder: SsgBuilder) => void | Promise<void>;
}

export interface BuildOptions {
	out: string;
	dir?: string; // Source directory relative to root, defaults to root
}

export interface SsgState {
    options: SsgOptions;
    dynamicRoutesMap: Map<string, any[]>;
    fileAccessHistory: Array<{
        file: string;
        timestamp: Date;
        type: 'read' | 'write' | 'compile' | 'cache';
        duration?: number;
    }>;
    routeCompilationChain: Map<string, string[]>;
    currentRoute: string | null;
}

// Global reference to the active Kire instance for static methods (build/dev)
export let activeKire: Kire | null = null;

export function setActiveKire(kire: Kire) {
    activeKire = kire;
}