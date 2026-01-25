import type { KireContext } from "src/types";

/**
 * Processes custom elements (components/tags) in the rendered HTML.
 * Uses an offset-based replacement strategy to safely handle multiple identical elements.
 */
export const processElements = async ($ctx: KireContext) => {
	let resultHtml = $ctx.$response;
	for (const def of $ctx.$kire.$elements) {
		if (!def.onCall) continue;
		const tagName = def.name instanceof RegExp ? def.name.source : def.name;

		const isVoid =
			def.void ||
			(typeof def.name === "string" &&
				/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(
					def.name,
				));

		const regex = isVoid
			? new RegExp(`<(${tagName})([^>]*)>`, "gi")
			: new RegExp(
					`<(${tagName})([^>]*)(?:>(?:([^]*?))<\\/\\1>|\\s*\\/>)`,
					"gi",
				);

		const matches = [];
		let match: RegExpExecArray | null;
		while ((match = regex.exec(resultHtml)) !== null) {
			matches.push({
				full: match[0],
				tagName: match[1],
				attrs: match[2],
				inner: isVoid ? "" : (match[3] ?? ""),
				index: match.index,
			});
		}

		let offset = 0;
		for (const m of matches) {
			const currentStart = m.index + offset;
			const currentEnd = currentStart + m.full.length;

			const attributes: Record<string, string> = {};
			const attrRegex = /([a-zA-Z0-9_-]+)(?:="([^"]*)")?/g;
			let attrMatch: RegExpExecArray | null;
			while ((attrMatch = attrRegex.exec(m.attrs!)) !== null) {
				attributes[attrMatch[1]!] = attrMatch[2] ?? "";
			}

			// Clone context for element scope
			// For class based context, we might need a clone method, or just create a delegate object.
			// Using Object.create on the instance keeps prototype chain.
			const elCtx: any = Object.create($ctx);
			elCtx.content = resultHtml;
			elCtx.element = {
				tagName: m.tagName,
				attributes,
				inner: m.inner,
				outer: m.full,
			};

			let isModified = false;
			elCtx.update = (newContent: string) => {
				resultHtml = newContent;
				elCtx.content = newContent;
			};

			elCtx.replace = (replacement: string) => {
				const pre = resultHtml.slice(0, currentStart);
				const pos = resultHtml.slice(currentEnd);
				resultHtml = pre + replacement + pos;
				elCtx.content = resultHtml;
				offset += replacement.length - m.full.length;
				isModified = true;
			};

			elCtx.replaceElement = (replacement: string) => {
				elCtx.replace(replacement);
			};

			elCtx.replaceContent = (replacement: string) => {
				if (!isVoid) {
					const newOuter = m.full.replace(m.inner!, replacement);
					elCtx.replace(newOuter);
				}
			};

			await def.onCall(elCtx);

			if (!isModified && elCtx.content !== resultHtml) {
				resultHtml = elCtx.content;
			}
		}
	}
	return resultHtml;
};
