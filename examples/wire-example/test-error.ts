import { Kire } from "kire";
import { Wired } from "@kirejs/wire";
import { registerDirectives } from "@kirejs/wire/src/core/directives";

const kire = new Kire({
    production: false,
    silent: true,
    resolver: async (path) => {
        if (path === "main.kire") {
            return `
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
        }
        if (path === "components.success") return "<div>I am working fine!</div>";
        if (path === "components.error-tpl") return "<div>{{ it.missing.nested.prop }}</div>";
        return "";
    }
});

// Mocking components
Wired.register('success', class extends (await import("@kirejs/wire")).WireComponent {
    render() { return this.view('components.success'); }
});

Wired.register('error-js', class extends (await import("@kirejs/wire")).WireComponent {
    render() { 
        // @ts-ignore
        const fail = this.notExistentMethod();
        return "<div>Should not reach here</div>"; 
    }
});

Wired.register('error-tpl', class extends (await import("@kirejs/wire")).WireComponent {
    render() { return this.view('components.error-tpl'); }
});

// Load Wired plugin
kire.plugin(Wired.plugin);

console.log("Wire error preview server running at http://localhost:3001");

Bun.serve({
    port: 3001,
    async fetch(req) {
        try {
            const html = await kire.render(await kire.$resolver("main.kire"));
            return new Response(html as string, {
                headers: { "Content-Type": "text/html" }
            });
        } catch (e: any) {
            return new Response(e.toString(), { status: 500 });
        }
    }
});
