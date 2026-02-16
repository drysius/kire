import type { Kire } from "./kire";
import type { CompiledTemplate, KireContext } from "./types";
import { KireError } from "./utils/error";
import {
    HTML_ESCAPE_CHECK_REGEX,
    HTML_ESCAPE_GLOBAL_REGEX,
    NullProtoObj
} from "./utils/regex";

const ESCAPES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

const escapeHtml = (v: any): string => {
    const s = String(v ?? "");
    if (!HTML_ESCAPE_CHECK_REGEX.test(s)) return s;
    return s.replace(HTML_ESCAPE_GLOBAL_REGEX, (c) => ESCAPES[c]!);
};

export default async function KireRuntime(
    kire: Kire<any>,
    props: Record<string, any>,
    template: CompiledTemplate
): Promise<string> {
    const ctx = new NullProtoObj();
    ctx.NullProtoObj = NullProtoObj;
    ctx.$globals = kire.$globals;
    ctx.$props = props;
    ctx.$kire = kire;
    ctx.$template = template;
    ctx.$response = "";
    ctx.$escape = escapeHtml;
    ctx.$add = (v: string) => { ctx.$response += v; };

    try {
        const result = template.execute(ctx, template.dependencies);
        if (result instanceof Promise) await result;
        return ctx.$response;
    } catch (e: any) {
        throw new KireError(e, template);
    }
}
