import type { Kire } from "../kire";
import type { ElementDefinition } from "../types";

export default (kire: Kire<any>) => {
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
        onCall: (ctx) => {
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
        onCall: (ctx) => {
            const cond = ctx.attribute("cond");
            ctx.raw(`if (!(${cond})) {`);
            if (ctx.children) ctx.set(ctx.children);
            ctx.raw(`}`);
        }
    });

    kire.element({
        name: 'kire:for',
        attributes: [`items:any`, `as:string`, `index:string`],
        onCall: (ctx) => {
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
        onCall: (ctx) => {
            const value = ctx.attribute("value") || ctx.attribute("on") || ctx.attribute("expr");
            ctx.raw(`switch (${value}) {`);
            if (ctx.children) ctx.set(ctx.children);
            ctx.raw(`}`);
        }
    });

    kire.element({
        name: 'kire:case',
        attributes: [`value:any`],
        onCall: (ctx) => {
            const value = ctx.attribute("value") || ctx.attribute("is");
            ctx.raw(`case ${value}: {`);
            if (ctx.children) ctx.set(ctx.children);
            ctx.raw(`  break; }`);
        }
    });

    kire.element({
        name: 'kire:default',
        onCall: (ctx) => {
            ctx.raw(`default: {`);
            if (ctx.children) ctx.set(ctx.children);
            ctx.raw(`}`);
        }
    });

    kire.element({
        name: 'kire:define',
        attributes: [`name:string`],
        onCall: (ctx) => {
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
        onCall: (ctx) => {
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
        onCall: (ctx) => {
            const name = ctx.attribute("name") || ctx.attribute("value");
            ctx.raw(`$ctx.$add("<!-- KIRE:stack(" + ${JSON.stringify(name)} + ") -->");`);
        }
    });

    kire.element({
        name: 'kire:push',
        attributes: [`name:string`],
        onCall: (ctx) => {
            const name = ctx.attribute("name") || ctx.attribute("value") || ctx.attribute("to");
            ctx.raw(`if(!$ctx['~stacks']) $ctx['~stacks'] = new $ctx.$kire.NullProtoObj();`);
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
        onCall: (ctx) => {
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
        onCall: (ctx) => {
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
        onCall: (ctx) => {
            const m = ctx.attribute("value") || ctx.attribute("method") || "POST";
            ctx.res(`<input type="hidden" name="_method" value="${m}">`);
        }
    });

    kire.element({
        name: 'kire:include',
        attributes: [`path:string`],
        onCall: (ctx) => {
            const path = ctx.attribute("path") || ctx.attribute("view");
            if (!path) return;

            const extraGlobals = Object.keys(ctx.attributes).filter(k => k !== 'path' && k !== 'view');
            const id = ctx.depend(path, extraGlobals);
            const ctxId = ctx.count('ctx');
            ctx.raw(`const ${ctxId} = $ctx;`);
            ctx.raw(`{
                const $ctx = ${ctxId}.$fork().$emptyResponse();
                Object.assign($ctx.$props, { ...${ctxId}.$props, ...${JSON.stringify(ctx.attributes)} });
                await ${id}.execute.call($ctx.$props, $ctx, ${id}.dependencies);
                ${ctxId}.$response += $ctx.$response;
            }`);
        }
    });

    // 2. Generic Component System (<x-name>)
    const xSlot: ElementDefinition = {
        name: 'slot',
        attributes: ['name:string'],
        onCall: (ctx) => {
            const slotName = ctx.attribute('name') || 'default';
            ctx.merge((c) => {
                if (c.children) c.set(c.children);
                c.raw(`  if ($ctx.slots) $ctx.slots[${JSON.stringify(slotName)}] = $ctx.$response;`);
                c.raw(`  $ctx.$response = '';`);
            });
        }
    };

    kire.element({
        name: 'x-*',
        parents: [xSlot],
        onCall: (ctx) => {
            const componentName = ctx.wildcard;
            if (!componentName) return;

            let viewPath = componentName;
            if (kire.$namespaces.has('components') && kire.$existFile(`components.${componentName}`)) {
                viewPath = `components.${componentName}`;
            } else if (kire.$namespaces.has('layouts') && kire.$existFile(`layouts.${componentName}`)) {
                viewPath = `layouts.${componentName}`;
            }

            const id = ctx.count('comp');
            const hasContent = (ctx.children && ctx.children.length > 0) || (ctx.node.related && ctx.node.related.length > 0);
            const extraGlobals = Object.keys(ctx.attributes);
            const tplId = ctx.depend(viewPath, extraGlobals);
            const ctxId = ctx.count('ctx');

            ctx.raw(`const ${ctxId} = $ctx;`);
            ctx.raw(`{`);
            ctx.raw(`  const $ctx = ${ctxId}.$fork().$emptyResponse();`);
            ctx.raw(`  const $slots = new ${ctxId}.$kire.NullProtoObj();`);
            if (hasContent) {
                ctx.raw(`  const $parentSlots${id} = ${ctxId}.slots;`);
                ctx.raw(`${ctxId}.slots = $slots;`);
                ctx.merge((c) => {
                    if (c.children) c.set(c.children);
                    if (c.node.related) c.set(c.node.related);
                    c.raw(`    if (!$slots.default) $slots.default = $ctx.$response;`);
                    c.raw(`    $ctx.$response = '';`);
                });
            }

            ctx.raw(`  const props${id} = { ...${ctxId}.$props, ...${JSON.stringify(ctx.attributes)}, slots: $slots };`);
            ctx.raw(`  $ctx.slots = $slots;`);
            ctx.raw(`  Object.assign($ctx.$props, props${id});`);
            ctx.raw(`  await ${tplId}.execute.call($ctx.$props, $ctx, ${tplId}.dependencies);`);
            ctx.raw(`  ${ctxId}.$response += $ctx.$response;`);
            if (hasContent) ctx.raw(`  ${ctxId}.slots = $parentSlots${id};`);
            ctx.raw(`}`);
        }
    });
};
