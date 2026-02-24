import { Kire } from "./core/src/kire";

const kire = new Kire({
    production: true,
    silent: true,
    files: {
        "test.kire": `
<html>
<body>
    <h1>Hello World</h1>
    <?js 
        // Erro proposital aqui
        const x = it.user.nested.property; 
    ?>
</body>
</html>`
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
            return new Response(kire.renderError(e), { 
                status: 500,
                headers: { "Content-Type": "text/html" }
            });
        }
    }
});
