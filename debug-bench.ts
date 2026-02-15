import { Kire } from "./core/src/kire";

async function debug() {
    const k = new Kire({ production: false });
    
    k.$virtualFiles[k.resolvePath("user.kire")] = "<li>{{ name }}</li>";

    const tplComponents = `
        <ul>
            @each(user in users)
                <x-user name="{{ user.name }}" />
            @endeach
        </ul>
    `.trim();

    try {
        const compiled = await k.compileFn(tplComponents, "debug-bench.kire");
        console.log("--- COMPILED CODE ---");
        console.log(compiled.code);
        console.log("--- END CODE ---");
    } catch (e) {
        console.error("Compilation failed:");
        console.error(e);
    }
}

debug();
