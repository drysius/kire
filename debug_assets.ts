import { Kire } from "./core/src/kire";
import { KireAssets } from "./packages/assets/src/index";

const kire = new Kire({
    silent: false,
    plugins: [KireAssets]
});

const template = `
<html>
<head>
    @assets()
    <style>body { color: red; }</style>
</head>
<body>
    <h1>Hello</h1>
    <script>console.log('test');</script>
</body>
</html>
`;

async function run() {
    try {
        console.log("--- PARSING AST ---");
        const ast = kire.parse(template);
        console.log(JSON.stringify(ast, null, 2));
        
        console.log("\n--- RENDERING ---");
        const result = await kire.render(template);
        console.log("--- RESULT ---");
        console.log(result);
    } catch (e) {
        console.error(e);
    }
}

run();
