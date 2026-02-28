import { createHash } from "node:crypto";
import type { Kire } from "kire";
import { SessionManager } from "./session";
import type { Component } from "./component";

export interface KirewireOptions {
    secret: string;
    busDelay?: number;
    expireSession?: string | number;
    adapter?: any;
}

export class Kirewire {
    public components = new Map<string, typeof Component>();
    public sessions: SessionManager;
    private middlewares: Array<(ctx: any) => void> = [];
    private events = new Map<string, Array<(data: any) => void>>();
    public secret: string;

    constructor(options: KirewireOptions) {
        this.secret = options.secret;
        const expireMs = typeof options.expireSession === 'string' 
            ? this.parseDuration(options.expireSession) 
            : (options.expireSession || 60000);
        
        this.sessions = new SessionManager(expireMs);
    }

    public generateChecksum(state: any, sessionId: string): string {
        const data = JSON.stringify(state) + sessionId + this.secret;
        return createHash("sha256").update(data).digest("hex");
    }

    public async $emit(event: string, data: any) {
        const handlers = this.events.get(event);
        const ctx = { [event]: data, kirewire: this };
        for (const mw of this.middlewares) { mw(ctx); }
        if (handlers) {
            for (const handler of handlers) { await handler(data); }
        }
    }

    public $on(event: string, callback: (data: any) => void) {
        const names = event.split(',').map(n => n.trim());
        for (const name of names) {
            if (!this.events.has(name)) this.events.set(name, []);
            this.events.get(name)!.push(callback);
        }
    }

    public use(fn: (ctx: any) => void) {
        this.middlewares.push(fn);
    }

    private parseDuration(duration: string): number {
        const match = duration.match(/^(\d+)([smh])$/);
        if (!match) return 60000;
        const val = parseInt(match[1]!);
        const unit = match[2];
        switch (unit) {
            case 's': return val * 1000;
            case 'm': return val * 60000;
            case 'h': return val * 3600000;
            default: return val;
        }
    }
}
