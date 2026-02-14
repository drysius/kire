import { Kire } from "./core/src/kire";
import { consumeStream } from "./core/src/utils/stream";
import { resolve } from "node:path";

async function test() {
    const kire = new Kire({ production: false, root: resolve('./') });
    
    const tpl = `
        <div>
            <kire:if cond="true">
                <p>Hello from element</p>
            </kire:if>
        </div>
    `.trim();

    console.log("--- 1. Compilation Analysis ---");
    const compiled = await kire.compileFn(tpl);
    console.log("Used Elements:", Array.from(compiled.usedElements || []));
    
    console.log("\n--- 2. Regex Analysis ---");
    console.log("Registered Elements:", Array.from(kire.$elements).map(e => `${e.name}${e.parent || ''}`));
    console.log("Matchers:", kire.$elementMatchers.map(m => m.prefix));
    const regex = kire.$elementRegex;
    console.log("Element Regex:", regex ? regex.source : "NULL");
    
    if (regex) {
        const matches = [...tpl.matchAll(new RegExp(regex.source, 'g'))];
        console.log(`Regex Matches found: ${matches.length}`);
    }

    console.log("\n--- 3. Execution Analysis ---");
    const result = await consumeStream(await kire.render(tpl));
    console.log("Final Output:");
    console.log(result.trim());
    
    if (result.includes("kire:if")) {
        console.log("\n❌ FAILED: <kire:if> tag still present in output.");
    } else if (result.includes("Hello from element")) {
        console.log("\n✅ SUCCESS: Element was correctly swapped.");
    } else {
        console.log("\n❓ UNKNOWN: Tag removed but content missing.");
    }
}

test().catch(console.error);
