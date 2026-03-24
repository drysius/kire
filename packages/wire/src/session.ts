import { randomUUID } from "node:crypto";
import type { Component } from "./component";

export interface WirePage {
	components: Map<string, Component>;
	lastSeen: number;
}

export interface WireSession {
	key: string;
	publicId: string;
	pages: Map<string, WirePage>;
	userIds: Set<string>;
	expireAt: number | null;
}

export interface ActivePageEntry {
	userId: string;
	sessionId: string;
	pageId: string;
	session: WireSession;
	page: WirePage;
}

export class SessionManager {
	/**
	 * Map of SessionKey -> Session
	 */
	private sessions = new Map<string, WireSession>();
	private sessionKeyByUserId = new Map<string, string>();

	/**
	 * Reverse lookup: PublicId -> SessionKey
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

	public getSession(userId: string, sessionId?: string): WireSession {
		const normalizedUserId = this.normalizeUserId(userId);
		const sessionKey = this.resolveSessionKey(normalizedUserId, sessionId);
		let session = this.sessions.get(sessionKey);
		if (!session) {
			const publicId = randomUUID();
			session = {
				key: sessionKey,
				publicId,
				pages: new Map(),
				userIds: new Set<string>(),
				expireAt: Date.now() + this.expireMs,
			};
			this.sessions.set(sessionKey, session);
			this.findByPublicId.set(publicId, sessionKey);
		}
		session.userIds.add(normalizedUserId);
		this.sessionKeyByUserId.set(normalizedUserId, sessionKey);
		session.expireAt = Date.now() + this.expireMs;
		return session;
	}

	public getPage(userId: string, pageId: string, sessionId?: string): WirePage {
		const session = this.getSession(userId, sessionId);
		const normalizedPageId = this.normalizePageId(pageId);
		let page = session.pages.get(normalizedPageId);
		if (!page) {
			page = {
				components: new Map(),
				lastSeen: Date.now(),
			};
			session.pages.set(normalizedPageId, page);
		}
		page.lastSeen = Date.now();
		return page;
	}

	public hasActiveSession(userIdOrSessionId: string): boolean {
		const session = this.findSession(userIdOrSessionId);
		if (!session) return false;
		if (session.expireAt && Date.now() > session.expireAt) return false;
		return true;
	}

	public hasActivePage(userIdOrSessionId: string, pageId: string): boolean {
		const session = this.findSession(userIdOrSessionId);
		if (!session) return false;
		if (session.expireAt && Date.now() > session.expireAt) return false;
		return session.pages.has(this.normalizePageId(pageId));
	}

	public getUserIdByPublicId(publicId: string): string | undefined {
		const sessionKey = this.findByPublicId.get(String(publicId || "").trim());
		if (!sessionKey) return undefined;

		const session = this.sessions.get(sessionKey);
		if (!session || session.userIds.size === 0) return undefined;
		return session.userIds.values().next().value;
	}

	public getActivePages(): ActivePageEntry[] {
		const entries: ActivePageEntry[] = [];
		for (const [sessionId, session] of this.sessions.entries()) {
			const userId = session.userIds.values().next().value || "guest";
			for (const [pageId, page] of session.pages.entries()) {
				entries.push({ userId, sessionId, pageId, session, page });
			}
		}
		return entries;
	}

	private async cleanup() {
		const now = Date.now();
		for (const [sessionKey, session] of this.sessions.entries()) {
			if (session.expireAt && now > session.expireAt) {
				// Session expired, unmount all components in all pages
				for (const [_pageId, page] of session.pages.entries()) {
					await this.unmountPage(page);
				}
				this.deleteSession(sessionKey, session);
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
		this.sessionKeyByUserId.clear();
		this.findByPublicId.clear();
	}

	private findSession(userIdOrSessionId: string): WireSession | undefined {
		const raw = String(userIdOrSessionId || "").trim();
		if (!raw) return undefined;

		const direct = this.sessions.get(raw);
		if (direct) return direct;

		const mapped = this.sessionKeyByUserId.get(raw);
		if (!mapped) return undefined;
		return this.sessions.get(mapped);
	}

	private resolveSessionKey(userId: string, sessionId?: string): string {
		const explicit = String(sessionId || "").trim();
		if (explicit) {
			const explicitSession = this.sessions.get(explicit);
			if (explicitSession) return explicit;

			const mapped = this.sessionKeyByUserId.get(userId);
			if (!mapped) return explicit;
			if (mapped === explicit) return explicit;

			const mappedSession = this.sessions.get(mapped);
			if (!mappedSession) return explicit;

			// Keep backward compatibility for flows that first seed by userId
			// and only later start sending explicit sessionId.
			this.rekeySession(mapped, explicit, mappedSession);
			return explicit;
		}

		const mapped = this.sessionKeyByUserId.get(userId);
		if (mapped) return mapped;
		return userId || "guest";
	}

	private normalizeUserId(userId: string): string {
		const value = String(userId || "").trim();
		return value || "guest";
	}

	private normalizePageId(pageId: string): string {
		const value = String(pageId || "").trim();
		return value || "default-page";
	}

	private deleteSession(sessionKey: string, session: WireSession) {
		this.sessions.delete(sessionKey);
		this.findByPublicId.delete(session.publicId);
		for (const userId of session.userIds.values()) {
			if (this.sessionKeyByUserId.get(userId) === sessionKey) {
				this.sessionKeyByUserId.delete(userId);
			}
		}
	}

	private rekeySession(fromKey: string, toKey: string, session: WireSession) {
		if (fromKey === toKey) return;

		this.sessions.delete(fromKey);
		session.key = toKey;
		this.sessions.set(toKey, session);
		this.findByPublicId.set(session.publicId, toKey);

		for (const userId of session.userIds.values()) {
			this.sessionKeyByUserId.set(userId, toKey);
		}
	}
}
