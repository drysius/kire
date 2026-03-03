import { setDefaultKirePlatform } from "./kire";
import { platform as nodePlatform } from "./utils/node";

// Node entrypoint uses Node platform APIs by default.
setDefaultKirePlatform(nodePlatform);

export * from "./public";

