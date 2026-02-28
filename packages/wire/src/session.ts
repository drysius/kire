import type { Component } from "./component";

export interface WirePage {
    components: Map<string, Component>;
    lastSeen: number;
}

export interface WireSession {
    publicId: string;
    pages: Map<string, WirePage>;
    expireAt: number | null;
}

export class SessionManager {
    /**
     * Map of UserId -> Session
     */
    private sessions = new Map<string, WireSession>();

    /**
     * Reverse lookup: PublicId -> UserId
     */
    private findByPublicId = new Map<string, string>();

    constructor(private expireMs: number) {
        // Run cleanup every minute
        setInterval(() => this.cleanup(), 60000);
    }

    public getSession(userId: string): WireSession {
        let session = this.sessions.get(userId);
        if (!session) {
            const publicId = Math.random().toString(36).substring(2, 15);
            session = {
                publicId,
                pages: new Map(),
                expireAt: Date.now() + this.expireMs
            };
            this.sessions.set(userId, session);
            this.findByPublicId.set(publicId, userId);
        }
        session.expireAt = Date.now() + this.expireMs;
        return session;
    }

    public getPage(userId: string, pageId: string): WirePage {
        const session = this.getSession(userId);
        let page = session.pages.get(pageId);
        if (!page) {
            page = {
                components: new Map(),
                lastSeen: Date.now()
            };
            session.pages.set(pageId, page);
        }
        page.lastSeen = Date.now();
        return page;
    }

    public getUserIdByPublicId(publicId: string): string | undefined {
        return this.findByPublicId.get(publicId);
    }

    private async cleanup() {
        const now = Date.now();
        for (const [userId, session] of this.sessions.entries()) {
            if (session.expireAt && now > session.expireAt) {
                // Session expired, unmount all components in all pages
                for (const [pageId, page] of session.pages.entries()) {
                    await this.unmountPage(page);
                }
                this.sessions.delete(userId);
                this.findByPublicId.delete(session.publicId);
            }
        }
    }

    public async unmountPage(page: WirePage) {
        for (const component of page.components.values()) {
            try {
                await component.unmount();
            } catch (e) {
                console.error(`Error unmounting component ${component.$id}:`, e);
            }
        }
        page.components.clear();
    }
}
