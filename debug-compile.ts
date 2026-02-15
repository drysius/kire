
import { Kire } from "./core/src/kire";

async function debug() {
    const k = new Kire({
        production: false,
        vfiles: {
            'card.kire': `
                <div class='card'>
                    @yield('header')
                    <div class='body'>
                        {{ slots.default }}
                    </div>
                </div>
            `
        }
    });

    const template = `
        <x-card>
            <x-slot name="header"><h1>Header</h1></x-slot>
            Main Content
        </x-card>
    `;

    console.log("--- Compilando Template Principal ---");
    try {
        const compiled = await k.compileFn(template, 'main.kire');
        console.log("CÓDIGO GERADO (main.kire):");
        console.log(compiled.code);

        console.log("\n--- Compilando Componente (card.kire) ---");
        const cardCompiled = await k.viewCompiled('card.kire');
        console.log("CÓDIGO GERADO (card.kire):");
        console.log(cardCompiled.code);

        console.log("\n--- Executando Renderização ---");
        const result = await k.run(compiled, {});
        console.log("RESULTADO FINAL:");
        console.log(result);
    } catch (e) {
        console.error("ERRO:", e);
    }
}

debug();
