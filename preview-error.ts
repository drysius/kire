import { Kire } from "./core/src/kire";

const kire = new Kire({
    production: false,
    silent: true,
    resolver: async (path) => {
        if (path === "test.kire") {
            return `
<html>
<body>
    <h1>Hello World</h1>
    <?js 
        // Erro proposital aqui
        const x = it.user.nested.property; 
    ?>
</body>
</html>`;
        }
        return "";
    }
});

console.log("Error preview server running at http://localhost:3000");

Bun.serve({
    port: 3000,
    async fetch(req) {
        try {
            const html = await kire.view("test.kire", { user: {} });
            return new Response(html as string, {
                headers: { "Content-Type": "text/html" }
            });
        } catch (e: any) {
            // O kire.view já chama renderError internamente se houver erro no runtime,
            // mas aqui capturamos caso algo falhe na chamada em si.
            return new Response(e.toString(), { status: 500 });
        }
    }
});
