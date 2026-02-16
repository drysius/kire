import { Kire } from "./core/src/kire";

async function debugNativeElements() {
    console.log("\n--- DEBUG NATIVE ELEMENTS ---");
    const kire = new Kire({ silent: true });

    const template = `
        <kire:if cond="val === 1">
            One
        </kire:if>
        <kire:elseif cond="val === 2">
            Two
        </kire:elseif>
        <kire:else>
            Other
        </kire:else>
    `;

    try {
        const result = await kire.compile(template, "elements.kire");
        console.log("COMPILED CODE:");
        console.log(result.meta.code);

        const html1 = await kire.render(template, { val: 1 });
        console.log("VAL=1:", JSON.stringify(html1.trim()));

        const html2 = await kire.render(template, { val: 2 });
        console.log("VAL=2:", JSON.stringify(html2.trim()));

        const html3 = await kire.render(template, { val: 3 });
        console.log("VAL=3:", JSON.stringify(html3.trim()));
    } catch (e) {
        console.error("ERROR:", e);
    }
}

async function debugXSlot() {
    console.log("\n--- DEBUG X-SLOT ---");
    const kire = new Kire({ 
        silent: true,
        vfiles: {
            "card.kire": `
                <div class="card">
                    <div class="header">@yield('header')</div>
                    <div class="body">@yield('default')</div>
                </div>
            `
        }
    });

    const template = `
        <x-card>
            <x-slot name="header">My Header</x-slot>
            Main Content
        </x-card>
    `;

    try {
        const result = await kire.compile(template, "xslot.kire");
        console.log("COMPILED CODE:");
        console.log(result.meta.code);

        const html = await kire.render(template);
        console.log("RENDERED HTML:");
        console.log(html);
    } catch (e) {
        console.error("ERROR:", e);
    }
}

await debugNativeElements();
await debugXSlot();
