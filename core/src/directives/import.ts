import type { Kire } from "../kire";

export default (kire: Kire<any>) => {
	kire.directive({
		name: `include`,
		params: [`path:filepath`, `locals?:object`],
		children: false,
		type: `html`,
		description: `Includes and renders a template from a given path, optionally passing local variables.`,
		example: `@include('partials/card', { title: 'Hello' })`,
		onCall: (compiler) => {
			const pathExpr = compiler.param("path");
			const localsExpr = compiler.param("locals") || "{}";

            if (typeof pathExpr === 'string') {
                let extraGlobals: string[] = [];
                if (localsExpr.startsWith('{') && localsExpr.endsWith('}')) {
                    // Very basic extraction of keys from a static object literal { a: 1, b: 2 }
                    const content = localsExpr.slice(1, -1);
                    extraGlobals = content.split(',').map(p => p.split(':')[0].trim()).filter(k => k && JS_IDENTIFIER_REGEX.test(k));
                }

                const id = compiler.depend(pathExpr, extraGlobals);
                const ctxId = compiler.count('ctx');
                compiler.raw(`const ${ctxId} = $ctx;`);
                compiler.raw(`{
                    const $ctx = ${ctxId}.$fork().$emptyResponse();
                    if (${localsExpr}) Object.assign($ctx.$props, ${localsExpr});
                    await ${id}.execute.call($ctx.$props, $ctx, ${id}.dependencies);
                    ${ctxId}.$response += $ctx.$response;
                }`);
            } else {
                const isAsync = kire.isAsync(pathExpr);
                compiler.raw(
                    `$ctx.$response += ${
                        isAsync ? "await " : ""
                    }$ctx.$require(${JSON.stringify(pathExpr)}, ${localsExpr}) || "";`,
                );
            }
		},
	});
};
