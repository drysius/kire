import type { Kire } from "./kire";

export async function kireRuntime(
	kire: Kire,
	mainFn: Function,
	locals: Record<string, any>,
	children = false,
) {
	const rctx: any = {};
	for (const [k, v] of kire.$globals) {
		rctx[k] = v;
	}
	Object.assign(rctx, locals);

	if (kire.$expose_locals) {
		rctx[kire.$var_locals] = locals;
	}

	rctx["~res"] = "";
	rctx["~$pre"] = [];
	rctx["~$pos"] = [];

	rctx.res = function (this: any, str: any) {
		rctx["~res"] += str;
	};

	rctx.$res = () => rctx["~res"];

	rctx.$resolve = (path: string) => {
		return kire.resolvePath(path);
	};

	rctx.$merge = async (func: Function) => {
		const parentRes = rctx["~res"];
		rctx["~res"] = "";
		await func(rctx);
		rctx["~res"] = parentRes + rctx["~res"];
	};

	// Execute onInit for all directives
	if (kire.$directives.size > 0) {
		for (const directive of kire.$directives.values()) {
			if (directive.onInit) {
				await directive.onInit(rctx);
			}
		}
	}

	let finalCtx: any;
	try {
		//console.log(mainFn.toString())
		finalCtx = await mainFn(rctx);
	} catch (e: any) {
		if ((mainFn as any)._code) {
			e.kireGeneratedCode = (mainFn as any)._code;
		}
		throw e;
	}
	finalCtx.$typed = (key: string) => finalCtx[key];

	// Execute ~$pre functions collected during execution
	if (finalCtx["~$pre"] && finalCtx["~$pre"].length > 0) {
		for (const preFn of finalCtx["~$pre"]) {
			await preFn(finalCtx);
		}
	}

	let resultHtml = finalCtx["~res"];

	// Execute ~$pos functions (deferred logic)
	if (finalCtx["~$pos"] && finalCtx["~$pos"].length > 0) {
		for (const posFn of finalCtx["~$pos"]) {
			await posFn(finalCtx);
		}
		resultHtml = finalCtx["~res"];
	}

	if (!children && kire.$elements.size > 0) {
		resultHtml = await processElements(kire, resultHtml, finalCtx);
	}

	return resultHtml;
}

async function processElements(kire: Kire, html: string, ctx: any) {
	let resultHtml = html;
	for (const def of kire.$elements) {
		const tagName = def.name instanceof RegExp ? def.name.source : def.name;

		const isVoid =
			def.void ||
			(typeof def.name === "string" &&
				/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(
					def.name,
				));

		const regex = isVoid
			? new RegExp(`<(${tagName})([^>]*)>`, "gi")
			: new RegExp(`<(${tagName})([^>]*)>([^]*?)<\\/\\1>`, "gi");
		
		const matches = [];
		let match: RegExpExecArray | null;
		while ((match = regex.exec(resultHtml)) !== null) {
			matches.push({
				full: match[0],
				tagName: match[1],
				attrs: match[2],
				inner: isVoid ? "" : match[3],
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

			const elCtx: any = Object.create(ctx);
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
}