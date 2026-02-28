import type { FileStore } from "./file-store";

export class FileUpload {
    public id: string;
    public name: string;
    public size: number;
    public mime: string;

    constructor(data: { id: string, name: string, size: number, mime: string }) {
        this.id = data.id;
        this.name = data.name;
        this.size = data.size;
        this.mime = data.mime;
    }

    /**
     * Get the real file path from the store.
     */
    public getPath(store: FileStore): string | null {
        return store.get(this.id);
    }
}

export const fileUploadMiddleware = (store: FileStore) => (ctx: any) => {
    // Middleware logic to detect FileUpload instances in component state
    if (ctx['component:create'] || ctx['component:update']) {
        const data = ctx['component:create'] || ctx['component:update'];
        const component = data.component || data.instance;
        
        if (component) {
            for (const key of Object.keys(component)) {
                if (component[key] && component[key].__is_wire_file) {
                    component[key] = new FileUpload(component[key]);
                }
            }
        }
    }
};
