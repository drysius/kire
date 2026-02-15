import { Kire } from "./core/src/kire";

async function debug() {
    const kire = new Kire({ production: true });
    
    const tplElements = `
        <div class="container">
            <kire:for items="users" as="user">
                <li>{{ user.name }}</li>
            </kire:for>
        </div>
    `.trim();

    console.log("=== Debugging Elements Compilation ===");
    
    try {
        const compiled = await kire.compile(tplElements, "bench-elements.kire");
        console.log("--- GENERATED CODE ---");
        console.log(compiled.code);
        console.log("----------------------");

        const users = [{ name: "Alice" }, { name: "Bob" }];
        const result = await kire.render(tplElements, { users });
        console.log("RESULT:", JSON.stringify(result));
    } catch (e: any) {
        console.log("ERROR:", e.message);
        if (e.stack) {
            // console.log(e.stack);
        }
    }
}

debug();
