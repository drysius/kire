import { directive } from "../core/registry";

directive('stream', (el, dir, component) => {
    // Only a marker directive. The logic is handled by Component.processStream
    // reacting to server responses.
    // We could add connection logic here if using true SSE in the future.
});
