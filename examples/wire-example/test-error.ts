import { Kire } from "kire";
import { wirePlugin, WireComponent } from "@kirejs/wire";

const kire = new Kire({
    production: false,
    silent: true,
});

// Setup plugin before registering components
kire.plugin(wirePlugin);

// Mocking components
kire.wireRegister('success', class extends WireComponent {
    async render() { return "<div>I am working fine!</div>"; }
});

kire.wireRegister('error-js', class extends WireComponent {
    async render() { 
        // @ts-ignore
        const fail = this.notExistentMethod();
        return "<div>Should not reach here</div>"; 
    }
});

kire.wireRegister('error-tpl', class extends WireComponent {
    async render() { return "<div>{{ it.missing.nested.prop }}</div>"; }
});

const mainTpl = `
<html>
<body style="padding: 50px; background: #111; color: white;">
    <h1>Wire Multiple Errors Test</h1>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="border: 1px solid #333; padding: 20px;">
            <h3>Component 1 (Success)</h3>
            @wire('success')
        </div>

        <div style="border: 1px solid #333; padding: 20px;">
            <h3>Component 2 (Error JS)</h3>
            @wire('error-js')
        </div>

        <div style="border: 1px solid #333; padding: 20px;">
            <h3>Component 3 (Error Template)</h3>
            @wire('error-tpl')
        </div>

        <div style="border: 1px solid #333; padding: 20px;">
            <h3>Component 4 (Success)</h3>
            @wire('success')
        </div>
    </div>
</body>
</html>`;

console.log("Wire error preview server running at http://localhost:3001");

Bun.serve({
    port: 3001,
    async fetch(req) {
        try {
            const html = await kire.render(mainTpl);
            return new Response(html as string, {
                headers: { "Content-Type": "text/html" }
            });
        } catch (e: any) {
            return new Response(e.toString(), { status: 500 });
        }
    }
});
