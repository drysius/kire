import type { Kire } from "../../kire";

export default (kire: Kire<any>) => {
	kire.directive({
		name: `isset`,
		signature: [`expr:any`],
		children: true,
		closeBy: [`endisset`, `end`],
		description:
			"Renders the block only when the expression is defined and not null.",
		example: `@isset(user.avatar)\n  <img src="{{ user.avatar }}">\n@end`,
		onCall: (api) => {
			const expr = api.getArgument(0) ?? api.getAttribute("expr");
			api.write(
				`if (typeof ${api.transform(expr)} !== 'undefined' && ${api.transform(expr)} !== null) {`,
			);
			api.renderChildren();
			api.write(`}`);
		},
	});

	kire.directive({
		name: `empty`,
		signature: [`expr:any`],
		children: true,
		relatedTo: [`for`, `each`],
		closeBy: [`endempty`, `endfor`, `endeach`, `end`],
		description:
			"Fallback branch for empty collections or falsy values, often used alongside @for or @each.",
		example: `@empty(items)\n  <p>No items</p>\n@end`,
		onCall: (api) => {
			const expr = api.getArgument(0) || api.getAttribute("expr");
			if (!expr) {
				api.renderChildren();
				return;
			}
			api.write(
				`if (!${api.transform(expr)} || (Array.isArray(${api.transform(expr)}) && ${api.transform(expr)}.length === 0)) {`,
			);
			api.renderChildren();
			api.write(`}`);
		},
	});
};
