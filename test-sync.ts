import { Kire } from "./core/src/kire";

const kire = new Kire({ production: false });

kire.element('my-tag', (ctx) => {
    ctx.replace('REPLACED');
});

async function test() {
    console.log("--- SYNC TEST ---");
    const syncTemplate = "Hello {{ name }}";
    const syncResult = kire.render(syncTemplate, { name: "World" });
    
    if (syncResult instanceof Promise) {
        console.log("FAIL: syncResult is a Promise");
        console.log("Result:", await syncResult);
    } else {
        console.log("SUCCESS: syncResult is a string");
        console.log("Result:", syncResult);
        
    }

    console.log("\n--- ASYNC TEST (with await) ---");
    const asyncTemplate = "Hello {{ await Promise.resolve(name) }}";
    const asyncResult = kire.render(asyncTemplate, { name: "World" });

    if (asyncResult instanceof Promise) {
        console.log("SUCCESS: asyncResult is a Promise");
        console.log("Result:", await asyncResult);
    } else {
        console.log("FAIL: asyncResult is a string");
        console.log("Result:", asyncResult);
    }

    console.log("\n--- ELEMENT TEST (used) ---");
    const usedTemplate = "<my-tag></my-tag>";
    const usedResult = kire.render(usedTemplate);
    console.log("Used Result:", usedResult instanceof Promise ? await usedResult : usedResult);

    console.log("\n--- ELEMENT TEST (unused) ---");
    const unusedTemplate = "<div></div>";
    const unusedResult = kire.render(unusedTemplate);
    console.log("Unused Result:", unusedResult instanceof Promise ? await unusedResult : unusedResult);
}

test().catch(console.error);
