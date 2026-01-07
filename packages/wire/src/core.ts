import type { Kire } from "kire";
import { WireComponent } from "./component";
import type { WireContext, WireOptions, WirePayload, WireResponse } from "./types";
import { WireCrypto } from "./utils/crypto";
import { randomUUID } from "node:crypto";

export class WireCore {
  private static instance: WireCore;
  private options: WireOptions;
  private crypto: WireCrypto;
  private components: Map<string, new () => WireComponent> = new Map();
  private kireInstance?: Kire;

  private constructor() {
    this.options = {
      method: 'http',
      route: '/_kirewire',
      cookiename: '.kirewire',
      cookieexpire: '15m',
      cookiehttp: true,
      secret: randomUUID(),
    };
    this.crypto = new WireCrypto(this.options.secret!);
  }

  public static get(): WireCore {
    if (!WireCore.instance) {
      WireCore.instance = new WireCore();
    }
    return WireCore.instance;
  }

  public init(kire: Kire, options: WireOptions) {
    this.kireInstance = kire;
    this.options = { ...this.options, ...options };
    this.crypto = new WireCrypto(this.options.secret || randomUUID());
  }

  public getKire(): Kire {
    if (!this.kireInstance) throw new Error("WireCore not initialized");
    return this.kireInstance;
  }

  public registerComponent(name: string, componentClass: new () => WireComponent) {
    this.components.set(name, componentClass);
  }

  public getComponentClass(name: string) {
    return this.components.get(name);
  }

  public getCrypto() {
    return this.crypto;
  }

  public getOptions() {
    return this.options;
  }

  public async handleRequest(payload: WirePayload, contextOverrides: Partial<WireContext> = {}): Promise<WireResponse> {
    const { component, snapshot, method, params } = payload;
    
    let state: Record<string, unknown> = {};
    if (snapshot) {
      try {
        state = this.crypto.verify(snapshot);
      } catch (e) {
        return { error: 'Invalid snapshot signature' };
      }
    }

    const ComponentClass = this.components.get(component);
    if (!ComponentClass) {
      return { error: 'Component not found' };
    }

    const instance = new ComponentClass();
    instance.kire = this.getKire();
    instance.context = { kire: this.getKire(), ...contextOverrides };

    instance.fill(state);
    await instance.hydrated();

    if (method && typeof (instance as any)[method] === 'function') {
      const args = Array.isArray(params) ? params : [];
      await (instance as any)[method](...args);
      await instance.updated(method, args[0]); 
    }

    const html = await instance.render();
    await instance.rendered();

    const newState = instance.getPublicProperties();
    const newSnapshot = this.crypto.sign(newState, this.options.cookieexpire!);
    const events = instance.__events;

    return {
      html,
      snapshot: newSnapshot,
      updates: newState,
      events: events.length > 0 ? events : undefined
    };
  }
}
