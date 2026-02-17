import { Kire } from "./core/src/kire";

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
        const result = kire.compile(template, "xslot.kire");
        console.log("COMPILED CODE:");
        console.log(result.toString());

        const html = await kire.render(template);
        console.log("RENDERED HTML:");
        console.log(html);
    } catch (e) {
        console.error("ERROR:", e);
    }
}

await debugXSlot();
