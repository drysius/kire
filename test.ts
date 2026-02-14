import { Kire } from "./core/src/kire";
import { consumeStream } from "./core/src/utils/stream";

async function runTest() {
    const kire = new Kire({
        production: false,
        root: process.cwd().replace(/\\/g, '/')
    });

    // Mock users data
    const users = [{ name: "Alice", active: true, isAdmin: true }];
    kire.$global("users", users);

    // Using escaped @{{ because user is provided by kire:for element later
    const tplElements = `
        <div>
            <kire:for loop="users" as="user">
                <p>@{{ user.name }}</p>
                <kire:if cond="user.isAdmin">
                    <span>Admin</span>
                </kire:if>
            </kire:for>
        </div>
    `.trim();

    console.log("--- 1. Regex Test ---");
    const regex = kire.$elementRegex;
    console.log("Regex Source:", regex?.source);
    
    if (regex) {
        const matches = [...tplElements.matchAll(new RegExp(regex.source, 'g'))];
        console.log("Matches found:", matches.length);
    }

    console.log("\n--- 2. Compiler Test ---");
    const compiled = await kire.compileFn(tplElements);
    console.log("Used Elements:", Array.from(compiled.usedElements || []));

    console.log("\n--- 3. Render Test ---");
    const result = await consumeStream(await kire.render(tplElements));
    console.log("Final Output:");
    console.log(result.trim());
    
    console.log("\n--- 4. Manual Handler Test ---");
    const elDef = Array.from(kire.$elements).find(e => e.name === 'kire');
    if (elDef && elDef.run) {
        let manualOutput = "";
        const mockCtx: any = kire.fork();
        // Crucial: el handlers need $kire, $globals, $props
        mockCtx.$kire = kire;
        mockCtx.$globals = kire.$globals;
        mockCtx.$props = { users: [{ name: "Manual", isAdmin: true }] };
        mockCtx.element = { parent: 'for', attributes: { loop: 'users', as: 'user' }, inner: '<p>{{ user.name }}</p>' };
        mockCtx.replace = (s: string) => manualOutput = s;
        await elDef.run(mockCtx);
        console.log("Manual kire:for result success:", manualOutput.includes("Manual"));
    }

    if (result.includes("kire:for")) {
        console.log("\n❌ FAILED: Element tag still present in output.");
    } else if (result.includes("Alice")) {
        console.log("\n✅ SUCCESS: Alice was rendered.");
    } else {
        console.log("\n❓ Tag was removed but content is empty/incorrect.");
    }
}

runTest().catch(console.error);
