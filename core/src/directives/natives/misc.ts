import type { Kire } from "../../kire";

export default (kire: Kire) => {
    kire.directive({
        name: `once`,
        children: true,
        type: `html`,
        description: `Ensures that a block of content is rendered only once per request.`,
        example: `@once
  <script src="one-time-script.js"></script>
@endonce`,
        onCall(compiler) {
            const id = compiler.count("once");
            compiler.raw(`if (!$ctx['~once']) $ctx['~once'] = new Set();`);
            compiler.raw(`if (!$ctx['~once'].has('${id}')) { 
                $ctx['~once'].add('${id}');`);
            if (compiler.children) compiler.set(compiler.children);
            compiler.raw(`}`);
        },
    });

    kire.directive({
        name: `inject`,
        params: [`varName:string`, `modulePath:string`],
        type: `js`,
        description: `Injects a module or service into the template.`,
        example: `@inject('metrics', './services/metrics')`,
        onCall(compiler) {
            const varName = compiler.param("varName");
            const path = compiler.param("modulePath");
            compiler.raw(`const ${varName} = await import('${path}');`);
        },
    });

    kire.directive({
        name: `error`,
        params: [`field:string`],
        children: true,
        type: `html`,
        description: `Renders content if there is a validation error for the specified field.`,
        example: `@error('email')
  <span class="error">{{ $message }}</span>
@enderror`,
        onCall(compiler) {
            const field = compiler.param("field");
            compiler.raw(`if ($ctx.$props.errors && $ctx.$props.errors[${JSON.stringify(field)}]) {
                const $message = $ctx.$props.errors[${JSON.stringify(field)}];`);
            if (compiler.children) compiler.set(compiler.children);
            compiler.raw(`}`);
        },
    });

    kire.directive({
        name: `csrf`,
        type: `html`,
        description: `Renders a CSRF token input field.`,
        example: `@csrf`,
        onCall(compiler) {
            compiler.raw(`
                if (typeof $ctx.$globals.csrf === 'undefined') {
                    throw new Error("CSRF token not defined. Please define it using kire.$global('csrf', 'token')");
                }
                $ctx.$add(\`<input type="hidden" name="_token" value="\${$ctx.$globals.csrf}">\`);
            `);
        },
    });

    kire.directive({
        name: `method`,
        params: [`method:string`],
        type: `html`,
        description: `Spoofs an HTTP method using a hidden input.`,
        example: `@method('PUT')`,
        onCall(compiler) {
            const method = compiler.param("method");
            compiler.res(`<input type="hidden" name="_method" value="${method}">`);
        },
    });

    kire.directive({
        name: `const`,
        params: [`expr:string`],
        type: `html`,
        description: `Declares a block-scoped constant.`,
        example: `@const(myVar = 'hello')`,
        onCall(compiler) {
            compiler.raw(`const ${compiler.param("expr")};`);
        },
    });

    kire.directive({
        name: `let`,
        params: [`expr:string`],
        type: `html`,
        description: `Declares a block-scoped local variable.`,
        example: `@let(counter = 0)`,
        onCall(compiler) {
            compiler.raw(`let ${compiler.param("expr")};`);
        },
    });

    kire.directive({
        name: `defer`,
        children: true,
        type: `html`,
        description: `Defers rendering of a block until the main content is loaded.`,
        example: `@defer
  <p>Loading slow content...</p>
@enddefer`,
        onCall(compiler) {
            compiler.raw(`{
                const deferredRender = async ($ctx) => {`);
            if (compiler.children) compiler.set(compiler.children);
            compiler.raw(`};
                if ($ctx.$kire.$stream) {
                    const deferId = 'defer-' + Math.random().toString(36).substr(2, 9);
                    $ctx.$add(\`<div id="\${deferId}"></div>\`);
                    if (!$ctx.$deferred) $ctx.$deferred = [];
                    $ctx.$deferred.push(async () => {
                        const $parentCtx = $ctx;
                        {
                            const $ctx = $parentCtx.$fork().$emptyResponse();
                            await deferredRender($ctx);
                            const content = $ctx.$response;
                            $ctx.$emptyResponse();
                            const templateId = 'tpl-' + deferId;
                            $ctx.$add(\`
                                <template id="\${templateId}">\${content}</template>
                                <script>
                                    (function() {
                                        var src = document.getElementById('\${templateId}');
                                        var dest = document.getElementById('\${deferId}');
                                        if (src && dest) {
                                            dest.replaceWith(src.content);
                                            src.remove();
                                        }
                                    })();
                                </script>
                            \`);
                        }
                    });
                } else {
                    await deferredRender($ctx);
                }
            }`);
        },
    });
};
