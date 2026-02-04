// Export types and core classes
import 'kire';

declare module 'kire' {
    interface Kire {
        wired(path: string): Promise<void>;
    }
}

export * from "./component";
export * from "./page-component";
export * from "./traits/pagination";
export * from "./core/file";
export * from "./core/rule";
export * from "./core/cache";
export * from "./types";
export * from "./wired";

import { Wired } from "./wired";
export default Wired;
export {};