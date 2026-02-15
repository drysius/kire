import { Kire } from "./core/src/kire";

async function debugFailures() {
    const kire = new Kire();
    
    const scenarios = [
        {
            name: "Nested Elements (Buffer Stack)",
            template: "<outer><inner>Text</inner></outer>",
            locals: {},
            setup: (k: Kire) => {
                k.element({ name: "outer", onCall: (api) => { api.write('$ctx.$add("<div>");'); api.renderChildren(); api.write('$ctx.$add("</div>");'); } });
                k.element({ name: "inner", onCall: (api) => { api.write('$ctx.$add("<span>");'); api.renderChildren(); api.write('$ctx.$add("</span>");'); } });
            }
        },
        {
            name: "Class Directive (Syntax Error Check)",
            template: '<div @class(["a", show ? "b" : ""])></div>',
            locals: { show: true }
        },
        {
            name: "Stack/Push (Content Capture)",
            template: '@stack("scripts") @push("scripts")<script>1</script>@endpush',
            locals: {}
        },
        {
            name: "Define/Defined (Partial Content)",
            template: '@define("header")<h1>Title</h1>@enddefine @defined("header")Fallback@enddefined',
            locals: {}
        },
        {
            name: "Error Directive (Local Var)",
            template: "@error('email'){{ $message }}@enderror",
            locals: { errors: { email: "Invalid" } }
        },
        {
            name: "Let/Const (Visibility)",
            template: "@let(x = 10){{ x }}",
            locals: {}
        },
        {
            name: "Kire:If/Else Element (Boolean Keyword)",
            template: '<kire:if cond="true">YES<kire:else>NO</kire:if>',
            locals: {}
        },
        {
            name: "X-Component with Slots",
            template: '<x-card><x-slot name="header">Head</x-slot>Body</x-card>',
            locals: {},
            setup: (k: Kire) => {
                k.$vfiles[k.resolve("card")] = "DIV: {{ slots.header }} - {{ slots.default }}";
            }
        }
    ];

    for (const s of scenarios) {
        console.log(`
=== DEBUG: ${s.name} ===`);
        if (s.setup) s.setup(kire);
        
        try {
            const compiled = await kire.compile(s.template, "debug.kire");
            console.log("--- GENERATED CODE ---");
            console.log(compiled.code);
            console.log("----------------------");
            
            const result = await kire.render(s.template, s.locals);
            console.log("RESULT:", JSON.stringify(result));
        } catch (e: any) {
            console.log("ERROR:", e.message);
        }
    }
}

debugFailures();
