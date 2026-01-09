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

    try {
        instance.fill(state);
        await instance.hydrated();

        if (method) {
          const args = Array.isArray(params) ? params : [];
          
          if (method === '$set' && args.length === 2) {
            const [prop, value] = args;
            if (prop && typeof prop === 'string' && !prop.startsWith('_')) {
               (instance as any)[prop] = value;
               instance.clearErrors(prop); // Clear error on update
               await instance.updated(prop, value);
            }
          } else if (method === '$refresh') {
            await instance.updated('$refresh', null);
          } else if (typeof (instance as any)[method] === 'function') {
            await (instance as any)[method](...args);
            await instance.updated(method, args[0]); 
          } else {
             // Method not found or not a function
             // We generally ignore this for security or return error
             console.warn(`Method ${method} not found on component ${component}`);
          }
        }

        const html = await instance.render();
        await instance.rendered();

        const newState = instance.getPublicProperties();
        const newSnapshot = this.crypto.sign(newState, this.options.cookieexpire!);
        const events = instance.__events;
        const redirect = instance.__redirect;
        const errors = instance.__errors;

        return {
          html,
          snapshot: newSnapshot,
          updates: newState,
          events: events.length > 0 ? events : undefined,
          redirect: redirect || undefined,
          errors: Object.keys(errors).length > 0 ? errors : undefined
        };
    } catch (e: any) {
        console.error(`Error processing component ${component}:`, e);
        return { error: e.message || 'Internal Server Error' };
    }
  }
}