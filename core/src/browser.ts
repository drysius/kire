import { setDefaultKirePlatform } from "./kire";
import { platform as browserPlatform } from "./utils/browser";

// Browser entrypoint uses browser-safe platform APIs by default.
setDefaultKirePlatform(browserPlatform);

export * from "./public";

