import { Kire } from "./core/src/kire";

async function debugAST() {
    const kire = new Kire();
    const cardContent = "<div class='card'>@yield('header')<div class='body'>{{ slots.default }}</div></div>";
    const parser = new (kire as any).$parser(cardContent, kire);
    const nodes = parser.parse();
    console.log("--- AST ---");
    console.log(JSON.stringify(nodes, (k,v) => k === 'kire' ? undefined : v, 2));
}

debugAST();
