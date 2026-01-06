import type { Kire } from "./kire";
import type { KireElementContext } from "./types";

export async function kireRuntime(
	kire: Kire,
	mainFn: Function,
	locals: Record<string, any>,
	children = false,
) {
	const runtimeContext: any = {};
	for (const [k, v] of kire.$globals) {
		runtimeContext[k] = v;
	}
	Object.assign(runtimeContext, locals);

	if (kire.$expose_locals) {
		runtimeContext[kire.$var_locals] = locals;
	}

	runtimeContext["~res"] = "";
	runtimeContext["~$pre"] = [];
	runtimeContext["~$pos"] = [];

	runtimeContext.res = function (this: any, str: any) {
		runtimeContext["~res"] += str;
	};

	runtimeContext.$res = () => runtimeContext["~res"];

	runtimeContext.$resolve = (path: string) => {
		return kire.resolvePath(path);
	};

	runtimeContext.$merge = async (func: Function) => {
		const parentRes = runtimeContext["~res"];
		runtimeContext["~res"] = "";
		await func(runtimeContext);
		runtimeContext["~res"] = parentRes + runtimeContext["~res"];
	};

	// Execute onInit for all directives
	if (kire.$directives.size > 0) {
		for (const directive of kire.$directives.values()) {
			if (directive.onInit) {
				await directive.onInit(runtimeContext);
			}
		}
	}

	let finalCtx: any;
	try {
		//console.log(mainFn.toString())
		finalCtx = await mainFn(runtimeContext);
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
		// console.log('Regex for', tagName, ':', regex.source);
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

		for (const m of matches) {
			if (!resultHtml.includes(m.full)) {
				continue;
			}

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
			elCtx.update = (newContent: string) => {
				resultHtml = newContent;
				elCtx.content = newContent;
			};
			elCtx.replace = (replacement: string) => {
				resultHtml = resultHtml.replace(m.full, replacement);
				elCtx.content = resultHtml;
			};
			elCtx.replaceElement = (replacement: string) => {
				resultHtml = resultHtml.replace(m.full, replacement);
				elCtx.content = resultHtml;
			};
			elCtx.replaceContent = (replacement: string) => {
				if (!isVoid) {
					const newOuter = m.full.replace(m.inner!, replacement);
					resultHtml = resultHtml.replace(m.full, newOuter);
					elCtx.content = resultHtml;
				}
			};

			await def.onCall(elCtx);

			if (elCtx.content !== resultHtml) {
				resultHtml = elCtx.content;
			}
		}
	}
	return resultHtml;
}