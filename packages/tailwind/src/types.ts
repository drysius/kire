import type { compile } from "tailwindcss";

export type TailwindCompileOptions = NonNullable<Parameters<typeof compile>[1]>;
