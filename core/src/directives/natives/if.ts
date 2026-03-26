import type { Kire } from "../../kire";
import type { DirectiveDefinition } from "../../types";

export default (kire: Kire<any>) => {
	const elseDirective: DirectiveDefinition = {
		name: `else`,
		children: true,
		relatedTo: [`if`, `elseif`, `unless`],
		closeBy: [`endif`, `endunless`],
		description: "Fallback branch for @if, @elseif and @unless chains.",
		example: `@else\n  <p>Fallback</p>`,
		onCall: (api) => {
			api.write(`} else {`);
			api.renderChildren();
		},
	};

	kire.directive({
		name: `if`,
		signature: [`cond:any`],
		children: true,
		relatedTo: [],
		description:
			"Renders the block only when the expression evaluates to a truthy value.",
		example: `@if(user)\n  <p>Hello {{ user.name }}</p>\n@end`,
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
		signature: [`cond:any`],
		description: "Additional conditional branch for an @if or @unless chain.",
		example: `@elseif(user.isAdmin)\n  <p>Admin</p>`,
		onCall: (api) => {
			const cond = api.getArgument(0) ?? api.getAttribute("cond");
			api.write(`} else if (${cond}) {`);
			api.renderChildren();
		},
	});

	kire.directive({
		name: `unless`,
		signature: [`cond:any`],
		children: true,
		description:
			"Inverse of @if. Renders the block when the expression is falsy.",
		example: `@unless(user)\n  <a href="/login">Login</a>\n@end`,
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
