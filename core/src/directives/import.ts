import type { Kire } from "../kire";

export default (kire: Kire) => {
	kire.directive({
		name: `include`,
		params: [`path:filepath`, `locals?:object`],
		children: false,
		type: `html`,
		description: `Includes and renders a template from a given path, optionally passing local variables.`,
		example: `@include('partials/card', { title: 'Hello' })`,
		onCall(compiler) {
			const pathExpr = compiler.param("path");
			const localsExpr = compiler.param("locals") || "{}";
			const isAsync = kire.isAsync(pathExpr);

			compiler.raw(
				`$ctx.$response += ${
					isAsync ? "await " : ""
				}$ctx.$require(${JSON.stringify(pathExpr)}, ${localsExpr}) || "";`,
			);
		},
	});
};
