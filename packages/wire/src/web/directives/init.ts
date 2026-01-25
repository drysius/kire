import { parseAction } from "../core/parser";
import { directive } from "../core/registry";

directive("init", (el, dir, component) => {
	const { method, params } = parseAction(dir.value);
	// Execute immediately on load/init
	component.call(method, params);
});
