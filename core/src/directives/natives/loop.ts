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
                onCall(compiler) {
                    compiler.raw(`} if ($__empty) {`);
                    if (compiler.children) compiler.set(compiler.children);
                },
            }
        ],
        onCall(compiler) {
            const lhs = compiler.param("lhs");
            const rhs = compiler.param("rhs");
            const op = compiler.param("op");
            const statement = compiler.param("statement");
            const id = compiler.count("i");

            if (lhs && rhs && op) {
                const needsLoop = compiler.node.children?.some(c => c.content?.includes('$loop'));
                compiler.raw(`{ 
                    const _r${id} = ${rhs || "[]"};
                    const _it${id} = Array.isArray(_r${id}) ? _r${id} : Object.entries(_r${id} || {});
                    const _len${id} = _it${id}.length;
                    for (let ${id} = 0; ${id} < _len${id}; ${id}++) {
                        const _e${id} = _it${id}[${id}];
                        const ${lhs.trim()} = Array.isArray(_r${id}) ? _e${id} : _e${id}[0];`);
                
                if (needsLoop) {
                    compiler.raw(`
                        const $loop = {
                            index: ${id},
                            iteration: ${id} + 1,
                            count: _len${id},
                            first: ${id} === 0,
                            last: ${id} === _len${id} - 1
                        };`);
                }
            } else if (statement) {
                compiler.raw(`for (${statement}) {`);
            } else {
                compiler.error(`Invalid for loop syntax`);
            }

            if (compiler.children) compiler.set(compiler.children);
            compiler.raw(`}`); // Fecha o for
            
            if (compiler.parents) {
                const emptyNode = compiler.parents.find(p => p.name === 'empty' || p.name === 'else');
                if (emptyNode) {
                    compiler.raw(`if (!${rhs || "[]"} || (Array.isArray(${rhs || "[]"}) ? ${rhs || "[]"}.length === 0 : Object.keys(${rhs || "[]"}).length === 0)) {`);
                    if (emptyNode.children) compiler.set(emptyNode.children);
                    compiler.raw(`}`);
                }
            }
            compiler.raw(`}`); // Fecha o bloco externo
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
        onCall(compiler) {
            const directive = kire.getDirective("for");
            if (directive) directive.onCall(compiler);
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
        onCall(compiler) {
            const directive = kire.getDirective("for");
            if (directive) directive.onCall(compiler);
        }
    });
};
