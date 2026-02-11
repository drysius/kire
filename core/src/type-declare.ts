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
        variable: "$ctx",
        type: "context",
        comment:
            "The runtime context object ($ctx) used during template execution. Contains helpers like $add, $resolve, $require, etc.",
        tstype: "import('kire').KireContext",
    });

    kire.type({
        variable: "it",
        type: "context",
        comment:
            "Reference to the local variables (props) passed to the template. Alias for $props.",
        tstype: "Record<string, any>",
    });

    kire.type({
        variable: "$ctx.$props",
        type: "context",
        comment: "Local variables passed to the template.",
        tstype: "Record<string, any>",
    });

    kire.type({
        variable: "$ctx.$globals",
        type: "context",
        comment: "Global variables accessible in all templates.",
        tstype: "Record<string, any>",
    });

    kire.type({
        variable: "$ctx.$add",
        type: "context",
        comment: "Appends a string to the output buffer.",
        tstype: "(content: string) => void",
    });

    kire.type({
        variable: "$ctx.$require",
        type: "context",
        comment: "Imports and renders another template file.",
        tstype: "['path:filepath', 'locals?:object']",
    });

    kire.type({
        variable: "$ctx.$resolve",
        type: "context",
        comment: "Resolves a template path using namespaces and aliases.",
        tstype: "['path:filepath']",
    });
};
