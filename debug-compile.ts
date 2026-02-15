import { Kire } from "./core/src/kire";

async function debugComponent() {
    const kire = new Kire();
    const cardContent = "<div class='card'>@yield('header')<div class='body'>{{ slots.default }}</div></div>";
    const compiled = await kire.compile(cardContent, "card.kire");
    
    console.log("--- CARD COMPONENT CODE ---");
    console.log(compiled.code);
    console.log("---------------------------");

    const template = '<x-card><x-slot name="header">Head</x-slot>Main Content</x-card>';
    kire.$vfiles[kire.resolve("card")] = cardContent;
    
    const result = await kire.render(template);
    console.log("RESULT:", JSON.stringify(result));
}

debugComponent();
