export interface ClientAdapter {
    request(payload: any): Promise<any>;
}

export class HttpAdapter implements ClientAdapter {
    constructor(private endpoint: string, private csrf?: string) {}

    async request(payload: any) {
        const headers: any = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        };
        if (this.csrf) headers["X-CSRF-TOKEN"] = this.csrf;

        const res = await fetch(this.endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });
        
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        return await res.json();
    }
}
