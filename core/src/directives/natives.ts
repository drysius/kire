import type { Kire } from "../kire";
import registerNatives from "./natives/index";

export default (kire: Kire) => {
    registerNatives(kire);
};
