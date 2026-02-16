import type { Kire } from "../kire";
import type { ElementDefinition } from "../types";
import { NullProtoObj } from "../utils/regex";

export default (kire: Kire<any>) => {
    
    kire.element({
        name: 'kire:else',
        onCall: (api) => {
            api.write(`} else {`);
            api.renderChildren();
        }
    });

    kire.element({
        name: 'kire:elseif',
        related: ['kire:elseif', 'kire:else'],
        onCall: (api) => {
            const cond = api.getAttribute("cond");
            api.write(`} else if (${cond}) {`);
            api.renderChildren();
            if (api.node.related) api.renderChildren(api.node.related);
        }
    });

    kire.element({
        name: 'kire:if',
        related: ['kire:elseif', 'kire:else'],
        onCall: (api) => {
            const cond = api.getAttribute("cond");
            api.write(`if (${cond}) {`);
            api.renderChildren();
            if (api.node.related) api.renderChildren(api.node.related);
            api.write(`}`);
        }
    });

    kire.element({
        name: 'kire:for',
        related: ['kire:empty'],
        onCall: (api) => {
            const items = api.getAttribute("items") || api.getAttribute("each") || "[]";
            const as = api.getAttribute("as") || 'item';
            const indexAs = api.getAttribute("index") || 'index';
            const id = api.uid('i');
            api.write(`{
                const _r${id} = ${items};
                const _it${id} = Array.isArray(_r${id}) ? _r${id} : Object.entries(_r${id} || this.NullProtoObj);
                const _len${id} = _it${id}.length;
                let ${id} = 0;
                while (${id} < _len${id}) {
                    const _e${id} = _it${id}[${id}];
                    let ${as} = Array.isArray(_r${id}) ? _e${id} : _e${id}[0];
                    ${api.fullBody.includes('index') || api.allIdentifiers.has('index') ? `let ${indexAs} = ${id};` : ''}
                    ${api.fullBody.includes('$loop') || api.allIdentifiers.has('$loop') ? `let $loop = { index: ${id}, first: ${id} === 0, last: ${id} === _len${id} - 1, length: _len${id} };` : ''}`);
            api.renderChildren();
            api.write(`    ${id}++;
                }
            }`);
        }
    });

    kire.element({
        name: 'kire:empty',
        onCall: (api) => {
            api.renderChildren();
        }
    });

    kire.element({
        name: 'kire:switch',
        onCall: (api) => {
            api.write(`switch (${api.getAttribute("value")}) {`);
            if (api.node.children) {
                const valid = api.node.children.filter((n: any) => n.type === "element" && (n.tagName === "kire:case" || n.tagName === "kire:default"));
                api.renderChildren(valid);
            }
            api.write(`}`);
        }
    });

    kire.element({
        name: 'kire:case',
        onCall: (api) => {
            api.write(`case ${api.getAttribute("value")}: {`);
            api.renderChildren();
            api.write(`  break; }`);
        }
    });

    kire.element({
        name: 'kire:default',
        onCall: (api) => {
            api.write(`default: {`);
            api.renderChildren();
            api.write(`}`);
        }
    });

    kire.element({
        name: /^x-/,
        onCall: (api) => {
            const tagName = api.node.tagName!;
            if (tagName === "x-slot") {
                const name = api.getAttribute("name") || "default";
                const id = api.uid("slot");
                api.write(`{
                    const _oldRes${id} = $kire_response; $kire_response = "";`);
                api.renderChildren();
                api.write(`
                    if (typeof $slots !== 'undefined') $slots['${name}'] = $kire_response;
                    $kire_response = _oldRes${id};
                }`);
                return;
            }

            const componentName = tagName.slice(2);
            const id = api.uid('comp');
            const depId = api.depend(componentName);
            
            const attrs = api.node.attributes || new NullProtoObj();
            const propsStr = Object.keys(attrs)
                .map(k => `'${k}': ${api.getAttribute(k)}`)
                .join(',');

            api.write(`{
                const $slots = new NullProtoObj();
                const _oldRes${id} = $kire_response; $kire_response = "";`);
            
            if (api.node.children) {
                const slots = api.node.children.filter(c => c.tagName === "x-slot");
                const defContent = api.node.children.filter(c => c.tagName !== "x-slot");
                api.renderChildren(slots);
                if (defContent.length > 0) {
                    const defId = api.uid("def");
                    api.write(`{ const _defRes${defId} = $kire_response; $kire_response = "";`);
                    api.renderChildren(defContent);
                    api.write(`$slots.default = $kire_response; $kire_response = _defRes${defId}; }`);
                }
            }
            
            api.write(`
                $kire_response = _oldRes${id};
                const _oldProps${id} = $props;
                $props = Object.assign(Object.create($globals), _oldProps${id}, { ${propsStr} }, { slots: $slots });
                
                const _dep${id} = ${depId};
                const res${id} = _dep${id}.call(this, $props, $globals);
                if (res${id} instanceof Promise) {
                    $kire_response += await res${id};
                } else {
                    $kire_response += res${id};
                }
                
                $props = _oldProps${id};
            }`);
        }
    });
};
