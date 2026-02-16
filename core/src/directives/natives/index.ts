import type { Kire } from "../../kire";
import ifDirectives from "./if";
import loopDirectives from "./loop";
import checkDirectives from "./checks";
import attrDirectives from "./attributes";
import switchDirectives from "./switch";
import miscDirectives from "./misc";

export default (kire: Kire) => {
    kire.kireSchema({
        name: "kire-core",
        author: "Drysius",
        repository: "https://github.com/drysius/kire",
        version: "0.1.2"
    });

    ifDirectives(kire);
    loopDirectives(kire);
    checkDirectives(kire);
    attrDirectives(kire);
    switchDirectives(kire);
    miscDirectives(kire);
};
