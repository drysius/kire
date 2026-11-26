import type { Kire } from "../kire";
import type { CompilerApi } from "../types";

const NO_LOCALS = "new this.NullProtoObj()";

// Compile-time check: does the view resolve to a file that exists on disk?
function viewExists(api: CompilerApi, rawPath: string): boolean {
	const clean = String(rawPath).replace(/['"`]/g, "").trim();
	if (!clean) return false;
	try {
		const resolved = api.kire.resolvePath(clean);
		return api.kire.$platform.exists(resolved);
	} catch {
		return false;
	}
}

// Emits the inline-include codegen for a single view. Returns false when the
// view cannot be resolved at compile time (used by the conditional variants).
function emitInclude(
	api: CompilerApi,
	rawPath: string,
	localsExpr: string,
): boolean {
	// Let path-resolution/security errors propagate (e.g. traversal outside root).
	const depId = api.depend(rawPath);
	const dep = api.getDependency(rawPath);
	api.write(`{
        const _oldProps = $props;
        $props = { ..._oldProps, ...(${localsExpr}) };
        const res = ${depId}($props);
        ${dep.meta.async ? `$kire_response += await res;` : `$kire_response += res;`}
        $props = _oldProps;
    }`);
	return true;
}

export default (kire: Kire<any>) => {
	const pathDependency = (args: any[]) => {
		const rawPath = args[0];
		if (typeof rawPath === "string") return [rawPath.replace(/['"]/g, "")];
		return [];
	};

	kire.directive({
		name: `include`,
		signature: [`path:string`, `locals:object`],
		children: false,
		description:
			"Includes another Kire view inline and optionally merges additional locals for that render.",
		example: `@include("partials.alert", { type: "success" })`,
		isDependency: pathDependency,
		onCall: (api) => {
			const rawPath = api.getArgument(0) || api.getAttribute("path");
			const locals =
				api.getArgument(1) || api.getAttribute("locals") || NO_LOCALS;
			if (!rawPath) return;
			emitInclude(api, rawPath, locals);
		},
	});

	// @includeIf(view, locals?) — include only if the view exists; silent otherwise.
	kire.directive({
		name: `includeIf`,
		signature: [`path:string`, `locals:object`],
		children: false,
		description:
			"Includes a view only if it exists; renders nothing when the view is missing.",
		example: `@includeIf("partials.sidebar")`,
		isDependency: () => [],
		onCall: (api) => {
			const rawPath = api.getArgument(0) || api.getAttribute("path");
			const locals =
				api.getArgument(1) || api.getAttribute("locals") || NO_LOCALS;
			if (!rawPath || !viewExists(api, rawPath)) return;
			emitInclude(api, rawPath, locals);
		},
	});

	// @includeWhen(cond, view, locals?) — include when the condition is truthy.
	kire.directive({
		name: `includeWhen`,
		signature: [`cond:any`, `path:string`, `locals:object`],
		children: false,
		description: "Includes a view only when the condition is truthy.",
		example: `@includeWhen(user.isAdmin, "partials.admin")`,
		isDependency: (args) => {
			const rawPath = args[1];
			if (typeof rawPath === "string") return [rawPath.replace(/['"]/g, "")];
			return [];
		},
		onCall: (api) => {
			const cond = api.getArgument(0) ?? api.getAttribute("cond");
			const rawPath = api.getArgument(1) || api.getAttribute("path");
			const locals =
				api.getArgument(2) || api.getAttribute("locals") || NO_LOCALS;
			if (!rawPath || cond == null) return;
			api.write(`if (${cond}) {`);
			emitInclude(api, rawPath, locals);
			api.write(`}`);
		},
	});

	// @includeUnless(cond, view, locals?) — include when the condition is falsy.
	kire.directive({
		name: `includeUnless`,
		signature: [`cond:any`, `path:string`, `locals:object`],
		children: false,
		description: "Includes a view only when the condition is falsy.",
		example: `@includeUnless(user, "partials.guest")`,
		isDependency: (args) => {
			const rawPath = args[1];
			if (typeof rawPath === "string") return [rawPath.replace(/['"]/g, "")];
			return [];
		},
		onCall: (api) => {
			const cond = api.getArgument(0) ?? api.getAttribute("cond");
			const rawPath = api.getArgument(1) || api.getAttribute("path");
			const locals =
				api.getArgument(2) || api.getAttribute("locals") || NO_LOCALS;
			if (!rawPath || cond == null) return;
			api.write(`if (!(${cond})) {`);
			emitInclude(api, rawPath, locals);
			api.write(`}`);
		},
	});

	// @includeFirst([a, b, c], locals?) — include the first view that exists.
	kire.directive({
		name: `includeFirst`,
		signature: [`paths:array`, `locals:object`],
		children: false,
		description:
			"Includes the first view in the list that exists at compile time.",
		example: `@includeFirst(["custom.alert", "partials.alert"])`,
		isDependency: () => [],
		onCall: (api) => {
			const rawList = api.getArgument(0) || api.getAttribute("paths") || "";
			const locals =
				api.getArgument(1) || api.getAttribute("locals") || NO_LOCALS;
			const candidates = String(rawList).match(/["'`]([^"'`]+)["'`]/g) || [];
			for (const candidate of candidates) {
				if (viewExists(api, candidate) && emitInclude(api, candidate, locals))
					return;
			}
		},
	});
};
