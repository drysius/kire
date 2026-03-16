import { randomUUID } from "node:crypto";
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

export interface ActivePageEntry {
	userId: string;
	pageId: string;
	session: WireSession;
	page: WirePage;
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
	private cleanupTimer: ReturnType<typeof setInterval>;

	constructor(private expireMs: number) {
		// Run cleanup every minute
		this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
		if (typeof (this.cleanupTimer as any)?.unref === "function") {
			(this.cleanupTimer as any).unref();
		}
	}

	public getSession(userId: string): WireSession {
		let session = this.sessions.get(userId);
		if (!session) {
			const publicId = randomUUID();
			session = {
				publicId,
				pages: new Map(),
				expireAt: Date.now() + this.expireMs,
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
				lastSeen: Date.now(),
			};
			session.pages.set(pageId, page);
		}
		page.lastSeen = Date.now();
		return page;
	}

	public hasActiveSession(userId: string): boolean {
		const session = this.sessions.get(userId);
		if (!session) return false;
		if (session.expireAt && Date.now() > session.expireAt) return false;
		return true;
	}

	public hasActivePage(userId: string, pageId: string): boolean {
		const session = this.sessions.get(userId);
		if (!session) return false;
		if (session.expireAt && Date.now() > session.expireAt) return false;
		return session.pages.has(pageId);
	}

	public getUserIdByPublicId(publicId: string): string | undefined {
		return this.findByPublicId.get(publicId);
	}

	public getActivePages(): ActivePageEntry[] {
		const entries: ActivePageEntry[] = [];
		for (const [userId, session] of this.sessions.entries()) {
			for (const [pageId, page] of session.pages.entries()) {
				entries.push({ userId, pageId, session, page });
			}
		}
		return entries;
	}

	private async cleanup() {
		const now = Date.now();
		for (const [userId, session] of this.sessions.entries()) {
			if (session.expireAt && now > session.expireAt) {
				// Session expired, unmount all components in all pages
				for (const [_pageId, page] of session.pages.entries()) {
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

	public async destroy() {
		clearInterval(this.cleanupTimer);
		for (const session of this.sessions.values()) {
			for (const page of session.pages.values()) {
				await this.unmountPage(page);
			}
		}
		this.sessions.clear();
		this.findByPublicId.clear();
	}
}
