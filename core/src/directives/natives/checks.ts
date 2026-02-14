import type { Kire } from "../../kire";
import type { DirectiveDefinition } from "../../types";

export default (kire: Kire) => {
    kire.directive({
        name: `isset`,
        params: [`expr:any`],
        children: true,
        type: `html`,
        description: `Checks if a variable is defined and not null.`,
        example: `@isset($user)
  User is set.
@endisset`,
        onCall(compiler) {
            const expr = compiler.param("expr");
            compiler.raw(`if (typeof ${expr} !== 'undefined' && ${expr} !== null) {`);
            if (compiler.children) compiler.set(compiler.children);
            compiler.raw(`}`);
        },
    });

    kire.directive({
        name: `empty`,
        params: [`expr:any`],
        children: true,
        type: `html`,
        description: `Checks if a variable is empty (null, undefined, empty array, or empty string).`,
        example: `@empty($records)
  No records found.
@endempty`,
        onCall(compiler) {
            const expr = compiler.param("expr");
            compiler.raw(`if (!${expr} || (Array.isArray(${expr}) && ${expr}.length === 0)) {`);
            if (compiler.children) compiler.set(compiler.children);
            compiler.raw(`}`);
        },
    });
};
