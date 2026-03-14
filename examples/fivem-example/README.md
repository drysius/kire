# KireWire FiveM Example

This example is a minimal end-to-end test for the `FiveMAdapter` transport.

## What it does

- Serves a small NUI page at `/fivem-example/`
- Loads `/_wire/kirewire.js`
- Uses `transport: "fivem"` on the client
- Sends wire calls through FiveM events:
  - inbound: `kirewire:call`
  - outbound: `kirewire:push`
- Keeps HTTP basic endpoints (`/_wire/kirewire.js`, `/_wire/upload`, etc.)
- Uses a local build pipeline for the example itself:
  - `server.ts` -> `server/server.js`
  - `packages/wire/fivem/client.ts` -> `client/fivem-client.js`
- Enables NUI mouse focus by default (`client/focus-client.js`)

## Files

- `fxmanifest.lua`
- `server.ts`
- `build.ts`
- `server/server.js` (generated)
- `client/focus-client.js`
- `client/fivem-client.js` (generated)
- `client/kirewire.js` (generated)

## Quick test

1. Build the example bundles:
   - `cd examples/fivem-example`
   - `bun build.ts`
2. Start your FiveM resource with this example enabled.
3. Open the NUI page configured in `fxmanifest.lua`:
   - `http://localhost:30120/fivem-example/`
4. Click `+` / `-` / `Reset`.
5. Confirm the counter updates in real time without POST/SSE action flow.

## Focus helpers

- UI starts hidden and without focus.
- Press `M` to open/close the UI (toggles focus + cursor).
- Commands:
  - `kirewire_open_ui`
  - `kirewire_close_ui`
  - `kirewire_toggle_ui`
