import type { Kire } from "../../kire";
import type { DirectiveDefinition } from "../../types";

export default (kire: Kire) => {
    kire.directive({
        name: `for`,
        params: [`loop:$lhs {op:in/of} $rhs|statement:string`],
        children: true,
        type: `html`,
        description: `Iterates over an array or object. Supports @empty block if no iterations occur. Provides a $loop helper.`,
        example: `@for(user of users)
  {{ $loop.index }}: {{ user.name }}
@empty
  No users found
@endfor`,
        parents: [
            {
                name: `empty`,
                children: true,
                type: `html`,
                description: `Renders if the loop had no iterations.`,
                async onCall(compiler) {
                    compiler.raw(`} if ($__empty) {`);
                    if (compiler.children) await compiler.set(compiler.children);
                },
            }
        ],
        async onCall(compiler) {
            const lhs = compiler.param("lhs");
            const rhs = compiler.param("rhs");
            const op = compiler.param("op");
            const statement = compiler.param("statement");
            const id = compiler.count("loop");

            compiler.raw(`{ 
                const $__rhs_${id} = ${rhs || "[]"};
                const $__items_${id} = Array.isArray($__rhs_${id}) ? $__rhs_${id} : Object.entries($__rhs_${id} || {});
                const $__total_${id} = $__items_${id}.length;
                let $__empty_${id} = $__total_${id} === 0;
            `);

            if (lhs && rhs && op) {
                const needsLoop = compiler.node.children?.some(c => c.content?.includes('$loop'));
                compiler.raw(`for (let $__i_${id} = 0; $__i_${id} < $__total_${id}; $__i_${id}++) {
                    const $__entry_${id} = $__items_${id}[$__i_${id}];
                    const ${lhs.trim()} = Array.isArray($__rhs_${id}) ? $__entry_${id} : $__entry_${id}[0];
                `);
                if (needsLoop) {
                    compiler.raw(`
                    const $loop = {
                        index: $__i_${id},
                        iteration: $__i_${id} + 1,
                        count: $__total_${id},
                        first: $__i_${id} === 0,
                        last: $__i_${id} === $__total_${id} - 1
                    };`);
                }
            } else if (statement) {
                compiler.raw(`for (${statement}) {`);
            } else {
                compiler.error(`Invalid for loop syntax`);
            }

            compiler.raw(`$__empty_${id} = false;`);
            if (compiler.children) await compiler.set(compiler.children);
            compiler.raw(`}`);
            
            if (compiler.parents) {
                for (const p of compiler.parents) {
                    if (p.name === 'empty' || p.name === 'else') {
                        compiler.raw(`if ($__empty_${id}) {`);
                        if (p.children) await compiler.set(p.children);
                        compiler.raw(`}`);
                    }
                }
            }
            compiler.raw(`}`);
        },
    });

    kire.directive({
        name: `each`,
        params: [`loop:$lhs {op:in/of} $rhs`],
        children: true,
        type: `html`,
        description: `Alias for @for focusing on simple iterations.`,
        example: `@each(item of items)
  <li>{{ item }}</li>
@endeach`,
        async onCall(compiler) {
            const directive = kire.getDirective("for");
            if (directive) await directive.onCall(compiler);
        }
    });

    kire.directive({
        name: `forelse`,
        params: [`loop:$lhs {op:in/of} $rhs`],
        children: true,
        type: `html`,
        description: `A combined directive for loops with a built-in @empty fallback.`,
        example: `@forelse(user of users)
  <li>{{ user.name }}</li>
@empty
  No users.
@endforelse`,
        async onCall(compiler) {
            const directive = kire.getDirective("for");
            if (directive) await directive.onCall(compiler);
        }
    });
};
