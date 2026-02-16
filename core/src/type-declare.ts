import type { Kire } from "./kire";

export default (kire: Kire) => {
    kire.kireSchema({
        name: "kire",
        author: "Drysius",
        version: "0.1.2",
        repository: "https://github.com/drysius/kire",
    });

    kire.type({
        variable: "kire",
        type: "global",
        comment: "The Kire template engine instance.",
        tstype: "import('kire').Kire",
    });

    kire.type({
        variable: "$props",
        type: "context",
        comment: "Local variables passed to the template.",
        tstype: "Record<string, any>",
    });

    kire.type({
        variable: "it",
        type: "context",
        comment: "Reference to the local variables (props). Alias for $props.",
        tstype: "Record<string, any>",
    });

    kire.type({
        variable: "$globals",
        type: "context",
        comment: "Global variables accessible in all templates.",
        tstype: "Record<string, any>",
    });

    kire.type({
        variable: "$kire_response",
        type: "context",
        comment: "The output buffer string. Can be modified directly.",
        tstype: "string",
    });

    kire.type({
        variable: "$escape",
        type: "context",
        comment: "Function to escape HTML content.",
        tstype: "(v: any) => string",
    });
};
