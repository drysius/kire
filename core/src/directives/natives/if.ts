import type { Kire } from "../../kire";
import type { DirectiveDefinition } from "../../types";

export default (kire: Kire<any>) => {
    const elseDirective: DirectiveDefinition = {
        name: `else`,
        children: true,
        relatedTo: [`if`, `elseif`, `unless`],
        closeBy: [`endif`, `endunless`],
        onCall: (api) => {
            api.write(`} else {`);
            api.renderChildren();
        },
    };

    kire.directive({
        name: `if`,
        params: [`cond:any`],
        children: true,
        relatedTo: [],
        onCall: (api) => {
            const cond = api.getArgument(0) ?? api.getAttribute("cond");
            api.write(`if (${cond}) {`);
            api.renderChildren();
            if (api.node.related && api.node.related.length > 0) {
                api.renderChildren(api.node.related);
            }
            api.write(`}`);
        },
    });

    kire.directive({
        ...elseDirective,
        name: `elseif`,
        params: [`cond:any`],
        onCall: (api) => {
            const cond = api.getArgument(0) ?? api.getAttribute("cond");
            api.write(`} else if (${cond}) {`);
            api.renderChildren();
        }
    });

    kire.directive({
        name: `unless`,
        params: [`cond:any`],
        children: true,
        onCall: (api) => {
            const cond = api.getArgument(0) ?? api.getAttribute("cond");
            api.write(`if (!(${cond})) {`);
            api.renderChildren();
            if (api.node.related && api.node.related.length > 0) {
                api.renderChildren(api.node.related);
            }
            api.write(`}`);
        },
    });

    kire.directive(elseDirective);
};
