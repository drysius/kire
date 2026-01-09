import type { Kire } from "kire";
import { randomUUID } from "node:crypto";
import type { WireContext } from "./types";

export abstract class WireComponent {
  public __id: string = randomUUID();
  public __name = "";
  public __events: Array<{ name: string; params: any[] }> = [];
  public __redirect: string | null = null;
  public __errors: Record<string, string> = {};
  
  public kire!: Kire;
  public context: WireContext = { kire: undefined as any };

  public async mount(...args: unknown[]): Promise<void> {}
  public async updated(name: string, value: unknown): Promise<void> {}
  public async hydrated(): Promise<void> {}
  public async rendered(): Promise<void> {}

  public abstract render(): Promise<string>;

  protected async view(path: string, locals: Record<string, unknown> = {}): Promise<string> {
    if (!this.kire) throw new Error("Kire instance not injected");
    const data = { ...this.getPublicProperties(), errors: this.__errors, ...locals };
    return this.kire.view(path, data);
  }

  /**
   * Emite um evento para o navegador.
   */
  public emit(event: string, ...params: any[]) {
    this.__events.push({ name: event, params });
  }

  /**
   * Redireciona o usuário para uma nova URL.
   */
  public redirect(url: string) {
    this.__redirect = url;
  }

  /**
   * Adiciona um erro de validação.
   */
  public addError(field: string, message: string) {
    this.__errors[field] = message;
  }

  /**
   * Limpa os erros.
   */
  public clearErrors(field?: string) {
    if (field) {
        delete this.__errors[field];
    } else {
        this.__errors = {};
    }
  }

  /**
   * Retorna as propriedades públicas que devem ser persistidas no snapshot.
   */
  public getPublicProperties(): Record<string, unknown> {
    const props: Record<string, unknown> = {};
    const keys = Object.getOwnPropertyNames(this);
    for (const key of keys) {
      if (key.startsWith('_') || key === 'kire' || key === 'context') continue;
      
      const val = (this as any)[key];
      if (typeof val !== 'function') {
        props[key] = val;
      }
    }
    return props;
  }

  /**
   * Preenche as propriedades do componente com o estado vindo do snapshot.
   */
  public fill(state: Record<string, unknown>) {
    for (const [key, value] of Object.entries(state)) {
      if (key in this && !key.startsWith('_') && key !== 'jti' && key !== 'iat' && key !== 'exp') {
        (this as any)[key] = value;
      }
    }
  }
}
