import type { Kire } from "../../kire";

export default (kire: Kire<any>) => {
	kire.directive({
		name: `switch`,
		signature: [`expr:any`],
		children: true,
		description:
			"Starts a switch block that can contain @case and @default branches.",
		example: `@switch(status)\n  @case("ok") OK\n  @default Unknown\n@end`,
		onCall: (api) => {
			const expr = api.getArgument(0) ?? api.getAttribute("expr");
			api.write(`switch (${api.transform(expr)}) {`);

			// In Kernel mode, related nodes (case/default) are stored in node.related
			if (api.node.related) {
				api.renderChildren(api.node.related);
			}

			api.write(`}`);
		},
	});

	kire.directive({
		name: `case`,
		signature: [`val:any`],
		children: true,
		relatedTo: [`switch`, `case`, `default`],
		description: "Matches a value inside the current @switch chain.",
		example: `@case("ok")\n  <span>OK</span>`,
		onCall: (api) => {
			const val = api.getArgument(0) ?? api.getAttribute("val");
			api.write(`case ${api.transform(val)}: {`);
			api.renderChildren();
			api.write(`  break; }`);
		},
	});

	kire.directive({
		name: `default`,
		children: true,
		relatedTo: [`switch`, `case`, `default`],
		description:
			"Fallback branch used when no @case in the current @switch matches.",
		example: `@default\n  <span>Unknown</span>`,
		onCall: (api) => {
			api.write(`default: {`);
			api.renderChildren();
			api.write(`}`);
		},
	});
};
