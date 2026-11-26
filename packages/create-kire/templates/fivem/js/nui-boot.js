// Bundled to nui/client.js and loaded by nui/index.html.
// Uses the FiveM NUI transport (fetch to https://<resource>/_wire).
import { FiveMTransport, start } from "@kirejs/wire/client";

start({ transport: new FiveMTransport() });
