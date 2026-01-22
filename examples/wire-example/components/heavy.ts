import { WireComponent } from "@kirejs/wire";

export default class Heavy extends WireComponent {
    public data: string[] = [];

    async mount(params: any) {
        // Simulate heavy work
        await new Promise(r => setTimeout(r, 2000));
        this.data = ["Result A", "Result B", "Result C", "Params: " + JSON.stringify(params)];
    }

    render() {
        return `
        <div style="padding: 20px; border: 1px solid green; margin-top: 10px;">
            <h3>Heavy Component (Lazy Loaded)</h3>
            <ul>
                @for(item of data)
                    <li>{{ item }}</li>
                @end
            </ul>
        </div>
        `;
    }
}
