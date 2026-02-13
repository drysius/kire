import type { Kire } from "../../kire";

export default (kire: Kire) => {
    kire.directive({
        name: `switch`,
        params: [`expr:any`],
        children: true,
        type: `html`,
        description: `Provides a control flow statement similar to a JavaScript switch block.`,
        example: `@switch($value)
  @case(1)
    One
  @endcase
  @default
    Other
@endswitch`,
        async onCall(compiler) {
            compiler.raw(`switch (${compiler.param("expr")}) {`);
            if (compiler.children) {
                const cases = compiler.children.filter(
                    (n) => n.name === "case" || n.name === "default",
                );
                await compiler.set(cases);
            }
            compiler.raw(`}`);
        },
    });

    kire.directive({
        name: `case`,
        params: [`val:any`],
        children: true,
        type: `html`,
        description: `A case clause for a @switch statement.`,
        example: `@case('A')
  Value is A
@endcase`,
        async onCall(c) {
            c.raw(`case ${JSON.stringify(c.param("val"))}: {`);
            if (c.children) await c.set(c.children);
            c.raw(`break; }`);
        },
    });

    kire.directive({
        name: `default`,
        children: true,
        type: `html`,
        description: `The default clause for a @switch statement.`,
        example: `@default
  Value is something else
@enddefault`,
        async onCall(c) {
            c.raw(`default: {`);
            if (c.children) await c.set(c.children);
            c.raw(`}`);
        },
    });
};
