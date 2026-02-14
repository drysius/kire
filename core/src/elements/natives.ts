import type { Kire } from "../kire";
import type { ElementDefinition } from "../types";

export default (kire: Kire) => {
    const elseElement: ElementDefinition = {
        name: 'else',
        onCall: (ctx) => {
            ctx.raw(`} else {`);
            if (ctx.children) ctx.set(ctx.children);
        }
    };

    const elseifElement: ElementDefinition = {
        name: 'elseif',
        attributes: [`cond:any`],
        onCall: (ctx) => {
            const cond = ctx.attribute("cond");
            ctx.raw(`} else if (${cond}) {`);
            if (ctx.children) ctx.set(ctx.children);
        }
    };

    // 1. Kire Control Flow & Utility Elements (<kire:if>, <kire:for>, etc.)
    kire.element({
        name: 'kire:if',
        attributes: [`cond:any`],
        parents: [elseifElement, elseElement],
        onCall: async (ctx) => {
            const cond = ctx.attribute("cond");
            ctx.raw(`if (${cond}) {`);
            if (ctx.children) ctx.set(ctx.children);
            if (ctx.node.related) ctx.set(ctx.node.related);
            ctx.raw(`}`);
        }
    });

    kire.element({
        name: 'kire:unless',
        attributes: [`cond:any`],
        onCall: async (ctx) => {
            const cond = ctx.attribute("cond");
            ctx.raw(`if (!(${cond})) {`);
            if (ctx.children) ctx.set(ctx.children);
            ctx.raw(`}`);
        }
    });

    kire.element({
        name: 'kire:for',
        attributes: [`items:any`, `as:string`, `index:string`],
        onCall: async (ctx) => {
            const expr = ctx.attribute("items") || ctx.attribute("loop") || ctx.attribute("each") || "[]";
            const as = ctx.attribute("as") || 'item';
            const indexAs = ctx.attribute("index") || 'index';
            const id = ctx.count('i');

            ctx.raw(`{`);
            ctx.raw(`  const _r${id} = ${expr};`);
            ctx.raw(`  const _it${id} = Array.isArray(_r${id}) ? _r${id} : Object.entries(_r${id} || {});`);
            ctx.raw(`  const _len${id} = _it${id}.length;`);
            ctx.raw(`  for (let ${id} = 0; ${id} < _len${id}; ${id}++) {`);
            ctx.raw(`    const _e${id} = _it${id}[${id}];`);
            ctx.raw(`    const ${as} = Array.isArray(_r${id}) ? _e${id} : _e${id}[0];`);
            ctx.raw(`    const ${indexAs} = ${id};`);
            if (ctx.children) ctx.set(ctx.children);
            ctx.raw(`  }`);
            ctx.raw(`}`);
        }
    });

    kire.element({
        name: 'kire:switch',
        attributes: [`value:any`],
        onCall: async (ctx) => {
            const value = ctx.attribute("value") || ctx.attribute("on") || ctx.attribute("expr");
            ctx.raw(`switch (${value}) {`);
            if (ctx.children) ctx.set(ctx.children);
            ctx.raw(`}`);
        }
    });

    kire.element({
        name: 'kire:case',
        attributes: [`value:any`],
        onCall: async (ctx) => {
            const value = ctx.attribute("value") || ctx.attribute("is");
            ctx.raw(`case ${value}: {`);
            if (ctx.children) ctx.set(ctx.children);
            ctx.raw(`  break; }`);
        }
    });

    kire.element({
        name: 'kire:default',
        onCall: async (ctx) => {
            ctx.raw(`default: {`);
            if (ctx.children) ctx.set(ctx.children);
            ctx.raw(`}`);
        }
    });

    kire.element({
        name: 'kire:define',
        attributes: [`name:string`],
        onCall: async (ctx) => {
            const name = ctx.attribute("name") || ctx.attribute("value");
            ctx.raw(`{`);
            ctx.raw(`  const _origRes = $ctx.$response;`);
            ctx.raw(`  $ctx.$response = "";`);
            if (ctx.children) ctx.set(ctx.children);
            ctx.raw(`  $ctx.$globals['~defines'][${JSON.stringify(name)}] = $ctx.$response;`);
            ctx.raw(`  $ctx.$response = _origRes;`);
            ctx.raw(`}`);
        }
    });

    kire.element({
        name: 'kire:defined',
        attributes: [`name:string`],
        onCall: async (ctx) => {
            const name = ctx.attribute("id") || ctx.attribute("name") || ctx.attribute("value");
            ctx.raw(`if ($ctx.$globals['~defines'][${JSON.stringify(name)}] !== undefined) {`);
            ctx.raw(`  $ctx.$add($ctx.$globals['~defines'][${JSON.stringify(name)}]);`);
            if (ctx.children?.length) {
                ctx.raw(`} else {`);
                ctx.set(ctx.children);
            }
            ctx.raw(`}`);
        }
    });

    kire.element({
        name: 'kire:stack',
        attributes: [`name:string`],
        onCall: async (ctx) => {
            const name = ctx.attribute("name") || ctx.attribute("value");
            ctx.raw(`$ctx.$add("<!-- KIRE:stack(" + ${JSON.stringify(name)} + ") -->");`);
        }
    });

    kire.element({
        name: 'kire:push',
        attributes: [`name:string`],
        onCall: async (ctx) => {
            const name = ctx.attribute("name") || ctx.attribute("value") || ctx.attribute("to");
            ctx.raw(`if(!$ctx['~stacks']) $ctx['~stacks'] = {};`);
            ctx.raw(`if (!$ctx['~stacks'][${JSON.stringify(name)}]) $ctx['~stacks'][${JSON.stringify(name)}] = [];`);
            ctx.merge((c) => {
                if (c.children) c.set(c.children);
                c.raw(`  $ctx['~stacks'][${JSON.stringify(name)}].push($ctx.$response);`);
                c.raw(`  $ctx.$response = '';`);
            });
        }
    });

    kire.element({
        name: 'kire:yield',
        attributes: [`name:string`, `default:string`],
        onCall: async (ctx) => {
            const name = ctx.attribute("name") || ctx.attribute("value");
            ctx.raw(`{`);
            ctx.raw(`  const content = ($ctx.slots && $ctx.slots[${JSON.stringify(name)}]) || ($ctx.$props.slots && $ctx.$props.slots[${JSON.stringify(name)}]);`);
            ctx.raw(`  if (typeof content === 'function') {`);
            ctx.raw(`    await content();`);
            ctx.raw(`  } else if (content) {`);
            ctx.raw(`    $ctx.$add(content);`);
            if (ctx.attribute("default")) {
                ctx.raw(`  } else {`);
                ctx.raw(`    $ctx.$add(${JSON.stringify(ctx.attribute("default"))});`);
            }
            ctx.raw(`  }`);
            ctx.raw(`}`);
        }
    });

    kire.element({
        name: 'kire:csrf',
        onCall: async (ctx) => {
            ctx.raw(`
                if (typeof $ctx.$globals.csrf === 'undefined') {
                    throw new Error("CSRF token not defined. Please define it using kire.$global('csrf', 'token')");
                }
                $ctx.$add(\`<input type="hidden" name="_token" value="\${$ctx.$globals.csrf}">\`);
            `);
        }
    });

    kire.element({
        name: 'kire:method',
        attributes: [`value:string`],
        onCall: async (ctx) => {
            const m = ctx.attribute("value") || ctx.attribute("method") || "POST";
            ctx.res(`<input type="hidden" name="_method" value="${m}">`);
        }
    });

    kire.element({
        name: 'kire:include',
        attributes: [`path:string`],
        onCall: async (ctx) => {
            const path = ctx.attribute("path") || ctx.attribute("view");
            if (!path) return;
            ctx.raw(`$ctx.$response += await $ctx.$require(${JSON.stringify(path)}, { ...$ctx.$props, ...${JSON.stringify(ctx.attributes)} }) || "";`);
        }
    });

    // 2. Generic Component System (<x-name>)
    kire.element({
        name: 'x-*',
        onCall: async (ctx) => {
            const componentName = ctx.wildcard;
            if (!componentName || componentName === 'slot') return;

            ctx.raw(`await (async () => {`);
            ctx.raw(`  const $slots = {};`);
            
            ctx.merge((c) => {
                c.raw(`    $ctx.slots = $slots;`);
                if (c.children) c.set(c.children);
                c.raw(`    if (!$slots.default) $slots.default = $ctx.$response;`);
                c.raw(`    $ctx.$response = '';`);
            });

            ctx.raw(`  let viewPath = ${JSON.stringify(componentName)};`);
            ctx.raw(`  if ($ctx.$kire.$namespaces.has('components')) { viewPath = 'components.' + viewPath; }`);
            ctx.raw(`  const props = { ...$ctx.$props, ...${JSON.stringify(ctx.attributes)} };`);
            ctx.raw(`  props.slots = $slots;`);
            ctx.raw(`  try {`);
            ctx.raw(`    $ctx.$response += await $ctx.$kire.view(viewPath, props) || "";`);
            ctx.raw(`  } catch (e) {`);
            ctx.raw(`    $ctx.$add(\`<!-- Error rendering \${viewPath}: \${e.message} -->\`);`);
            ctx.raw(`  }`);
            ctx.raw(`})();`);
        }
    });
};
