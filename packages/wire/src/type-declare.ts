import type { Kire } from "kire";

export default (kire: Kire) => {
    kire.type({
        variable: "Wired",
        type: "global",
        comment: "KireWire main class for component management and request handling.",
        tstype: "any",
    });

    kire.type({
        variable: "$wire",
        type: "global",
        comment: "Alias for Wired. Allows interacting with KireWire components.",
        tstype: "any",
    });
};
