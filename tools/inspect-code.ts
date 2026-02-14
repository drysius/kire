import { Kire } from "../core/src/kire";

async function inspect() {
    const kire = new Kire({ production: true });
    kire.namespace("components", ".");
    kire.$virtualFiles[kire.resolvePath("components.item")] = `{{ i }}`;

    const tplElements = `<kire:for loop="{{ items }}" as="i">@{{ i }}</kire:for>`;
    const tplComponents = `@each(i in items)<x-item i="{{ i }}" />@endeach`;

    console.log("--- ELEMENTS CODE ---");
    const codeElements = kire.compile(tplElements, "elements.kire", ["items"]);
    console.log(codeElements);

    console.log("\n--- COMPONENTS CODE ---");
    const codeComponents = kire.compile(tplComponents, "components.kire", ["items"]);
    console.log(codeComponents);
}

inspect().catch(console.error);
