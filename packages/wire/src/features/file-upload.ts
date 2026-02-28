import type { FileStore } from "./file-store";

export class WireFile {
    public id: string = '';
    public name: string = '';
    public size: number = 0;
    public mime: string = '';
    public __is_wire_file = true;

    constructor(data?: { id: string, name: string, size: number, mime: string }) {
        if (data) {
            this.id = data.id;
            this.name = data.name;
            this.size = data.size;
            this.mime = data.mime;
        }
    }

    public get file() {
        return this.id ? this : null;
    }

    /**
     * Get the real file path from the store.
     */
    public getPath(store: FileStore): string | null {
        return store.get(this.id);
    }
}

export class Rule {
    static file(msg?: string) { return new Rule(); }
    min(val: number, msg?: string) { return this; }
    max(val: number, msg?: string) { return this; }
}

export const fileUploadMiddleware = (store: FileStore) => (ctx: any) => {
    // Middleware logic to detect WireFile instances in component state
    if (ctx['component:create'] || ctx['component:update']) {
        const data = ctx['component:create'] || ctx['component:update'];
        const component = data.component || data.instance;
        
        if (component) {
            for (const key of Object.keys(component)) {
                if (component[key] && component[key].__is_wire_file) {
                    component[key] = new WireFile(component[key]);
                }
            }
        }
    }
};
