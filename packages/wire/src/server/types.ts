import type { Kire } from "kire";

export interface WireOptions {
  components?: string;
  method?: 'http' | 'socket';
  secret?: string;
  cookiename?: string;
  cookieexpire?: string;
  cookiehttp?: boolean;
  route?: string;
}

export interface WirePayload {
  component: string;
  snapshot: string;
  method?: string;
  params?: unknown[];
  updates?: Record<string, unknown>;
}

export interface WireResponse {
  html?: string;
  snapshot?: string;
  updates?: Record<string, unknown>;
  events?: Array<{ name: string; params: any[] }>;
  redirect?: string;
  error?: string;
  errors?: Record<string, string>; // Validation errors
}

export interface WireContext {
  kire: Kire;
  user?: unknown;
  req?: unknown;
  res?: unknown;
  socket?: unknown;
  [key: string]: unknown;
}