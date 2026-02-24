// @bun
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __require = import.meta.require;

// core/src/compiler.ts
import { relative } from "path";

// core/src/utils/source-map.ts
var BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function encodeVLQ(value) {
  let res = "";
  let vlq = value < 0 ? -value << 1 | 1 : value << 1;
  do {
    let digit = vlq & 31;
    vlq >>>= 5;
    if (vlq > 0)
      digit |= 32;
    res += BASE64_CHARS[digit];
  } while (vlq > 0);
  return res;
}
function decodeVLQ(str, index) {
  let result = 0;
  let shift = 0;
  let continuation = true;
  let i = index;
  while (continuation) {
    const char = str[i++];
    if (!char)
      throw new Error("Invalid VLQ");
    const digit = BASE64_CHARS.indexOf(char);
    if (digit === -1)
      throw new Error(`Invalid Base64 char: ${char}`);
    continuation = (digit & 32) !== 0;
    result += (digit & 31) << shift;
    shift += 5;
  }
  const value = result & 1 ? -(result >>> 1) : result >>> 1;
  return [value, i];
}

class SourceMapGenerator {
  file;
  mappings = [];
  sources = [];
  constructor(file) {
    this.file = file;
  }
  addSource(source) {
    const index = this.sources.indexOf(source);
    if (index === -1) {
      this.sources.push(source);
      return this.sources.length - 1;
    }
    return index;
  }
  addMapping(mapping) {
    this.mappings.push(mapping);
  }
  toString() {
    let lastGenLine = 1;
    let lastGenCol = 0;
    let lastSourceIndex = 0;
    let lastSourceLine = 0;
    let lastSourceCol = 0;
    const encodedMappings = [];
    let lineMappings = [];
    this.mappings.sort((a, b) => {
      if (a.genLine !== b.genLine)
        return a.genLine - b.genLine;
      return a.genCol - b.genCol;
    });
    for (const m of this.mappings) {
      while (m.genLine > lastGenLine) {
        encodedMappings.push(lineMappings.join(","));
        lineMappings = [];
        lastGenLine++;
        lastGenCol = 0;
      }
      let segment = "";
      segment += encodeVLQ(m.genCol - lastGenCol);
      lastGenCol = m.genCol;
      if (m.sourceLine !== undefined) {
        const sourceIndex = m.sourceIndex ?? 0;
        segment += encodeVLQ(sourceIndex - lastSourceIndex);
        lastSourceIndex = sourceIndex;
        segment += encodeVLQ(m.sourceLine - 1 - lastSourceLine);
        lastSourceLine = m.sourceLine - 1;
        segment += encodeVLQ(m.sourceCol - 1 - lastSourceCol);
        lastSourceCol = m.sourceCol - 1;
      }
      lineMappings.push(segment);
    }
    encodedMappings.push(lineMappings.join(","));
    const map = {
      version: 3,
      file: this.file,
      sources: this.sources,
      names: [],
      mappings: encodedMappings.join(";")
    };
    return JSON.stringify(map);
  }
  toDataUri() {
    const base64 = Buffer.from(this.toString()).toString("base64");
    return `data:application/json;charset=utf-8;base64,${base64}`;
  }
}
function resolveSourceLocation(map, genLine, genCol) {
  if (!map || !map.mappings)
    return null;
  const lines = map.mappings.split(";");
  if (genLine > lines.length || genLine < 1)
    return null;
  let stateGenCol = 0;
  let stateSourceIndex = 0;
  let stateSourceLine = 0;
  let stateSourceCol = 0;
  let bestMatch = null;
  for (let l = 0;l < genLine; l++) {
    const line = lines[l];
    stateGenCol = 0;
    if (!line)
      continue;
    let i = 0;
    while (i < line.length) {
      const [dCol, nextI1] = decodeVLQ(line, i);
      i = nextI1;
      stateGenCol += dCol;
      if (i >= line.length || line[i] === ",") {
        if (l === genLine - 1 && stateGenCol <= genCol) {}
      } else {
        const [dSrcIdx, nextI2] = decodeVLQ(line, i);
        i = nextI2;
        stateSourceIndex += dSrcIdx;
        const [dSrcLine, nextI3] = decodeVLQ(line, i);
        i = nextI3;
        stateSourceLine += dSrcLine;
        const [dSrcCol, nextI4] = decodeVLQ(line, i);
        i = nextI4;
        stateSourceCol += dSrcCol;
        if (i < line.length && line[i] !== ",") {
          const [_, nextI5] = decodeVLQ(line, i);
          i = nextI5;
        }
        if (l === genLine - 1) {
          if (stateGenCol <= genCol) {
            bestMatch = {
              line: stateSourceLine + 1,
              column: stateSourceCol + 1,
              source: map.sources[stateSourceIndex] || ""
            };
          } else {
            break;
          }
        }
      }
      if (i < line.length && line[i] === ",")
        i++;
    }
  }
  return bestMatch;
}

// core/src/utils/regex.ts
var NullProtoObj = function() {
  return Object.create(null);
};
var TAG_OPEN_REGEX = /^<([a-zA-Z0-9_\-:.]+)/;
var TAG_CLOSE_REGEX = /^<\/([a-zA-Z0-9_\-:.]+)>/;
var ATTR_NAME_BREAK_REGEX = /\s|=|>|\/|\(/;
var WHITESPACE_REGEX = /\s/;
var DIRECTIVE_NAME_REGEX = /^@([a-zA-Z0-9_]+)/;
var JS_EXTRACT_IDENTS_REGEX = /(?:['"`].*?['"`])|(?<=\.\s*)[a-zA-Z_$][a-zA-Z0-9_$]*|(?<![a-zA-Z0-9_$])([a-zA-Z_$][a-zA-Z0-9_$]*)(?![a-zA-Z0-9_$])/g;
var INTERPOLATION_PURE_REGEX = /^\s*\{\{\s*(.*?)\s*\}\}\s*$/;
var INTERPOLATION_GLOBAL_REGEX = /\{\{\s*(.*?)\s*\}\}/g;
var RESERVED_KEYWORDS_REGEX = /^(?:break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|enum|await|true|false|null|of)$/;
var HTML_ESCAPE_CHECK_REGEX = /[&<>"']/;
var HTML_ESCAPE_GLOBAL_REGEX = /[&<>"']/g;
var TEXT_SCAN_REGEX = /{{|@|</g;
var INTERPOLATION_START_REGEX = /{{/;
var AWAIT_KEYWORD_REGEX = /await/;
var WILDCARD_CHAR_REGEX = /\*/;
var createVarThenRegex = (name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, (m) => `\\${m}`);
  return new RegExp(`(?<![a-zA-Z0-9_$])${escaped}(?![a-zA-Z0-9_$])`);
};
var QUOTED_STR_CHECK_REGEX = /^['"]/;
var STRIP_QUOTES_REGEX = /^['"]|['"]$/g;
var JS_STRINGS_REGEX = /'[^']*'|"[^"]*"|`[^`]*`/g;
function createFastMatcher(list) {
  const sources = list.map((item) => {
    if (item instanceof RegExp)
      return item.source;
    if (item.includes("*")) {
      const parts = item.split("*");
      const escapedParts = parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, (m) => `\\${m}`));
      return escapedParts.join(".*");
    }
    return item.replace(/[.*+?^${}()|[\]\\]/g, (m) => `\\${m}`);
  });
  sources.sort((a, b) => b.length - a.length);
  return new RegExp(`(?:${sources.join("|")})`);
}

// core/src/utils/html.ts
var ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
};
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined)
    return "";
  const type = typeof unsafe;
  if (type === "number" || type === "boolean")
    return String(unsafe);
  if (type !== "string")
    unsafe = String(unsafe);
  if (!HTML_ESCAPE_CHECK_REGEX.test(unsafe))
    return unsafe;
  return unsafe.replace(HTML_ESCAPE_GLOBAL_REGEX, (m) => ESCAPE_MAP[m]);
}

// core/src/compiler.ts
class Compiler {
  kire;
  filename;
  body = [];
  header = [];
  footer = [];
  dependencies = new NullProtoObj;
  uidCounter = new NullProtoObj;
  _async = false;
  _isDependency = false;
  textBuffer = "";
  generator;
  mappings = [];
  identifiers = new Set;
  fullBody = "";
  allIdentifiers = new Set;
  constructor(kire, filename = "template.kire") {
    this.kire = kire;
    this.filename = filename;
    this.generator = new SourceMapGenerator(filename);
    this.generator.addSource(filename);
  }
  get async() {
    return this._async;
  }
  getDependencies() {
    return this.dependencies;
  }
  markAsync() {
    this._async = true;
  }
  esc(str) {
    return "`" + str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$") + "`";
  }
  flushText() {
    if (this.textBuffer) {
      this.body.push(`$kire_response += ${this.esc(this.textBuffer)};`);
      this.textBuffer = "";
    }
  }
  parseAttrCode(val) {
    if (!INTERPOLATION_START_REGEX.test(val))
      return val;
    const pureMatch = val.match(INTERPOLATION_PURE_REGEX);
    if (pureMatch)
      return pureMatch[1];
    let res = val.replace(INTERPOLATION_GLOBAL_REGEX, (_, expr) => `\${$escape(${expr})}`);
    return "`" + res + "`";
  }
  compile(nodes, extraGlobals = [], isDependency = false) {
    this._isDependency = isDependency;
    this.body = [];
    this.header = [];
    this.footer = [];
    this.dependencies = new NullProtoObj;
    this.uidCounter = new NullProtoObj;
    this.mappings = [];
    this._async = false;
    this.textBuffer = "";
    this.identifiers.clear();
    this.header.push(`$globals = Object.assign(Object.create(this.$globals), $globals);`);
    this.header.push(`let $kire_response = "";`);
    this.header.push(`const $escape = this.$escape;`);
    this.deepCollectIdentifiers(nodes, this.identifiers, new Set);
    if (extraGlobals)
      extraGlobals.forEach((g) => this.identifiers.add(g));
    const localDecls = new Set;
    this.collectDeclarations(nodes, localDecls);
    for (const id of this.identifiers) {
      if (RESERVED_KEYWORDS_REGEX.test(id) || localDecls.has(id) || id === "it" || id === "$props" || id === "$globals" || id === "$kire" || id === "$kire_response" || id === "$escape" || id === "NullProtoObj")
        continue;
      if (typeof globalThis[id] !== "undefined")
        continue;
      if (this.kire.$kire["~handlers"].exists_vars.has(id))
        continue;
      this.header.push(`let ${id} = $props['${id}'] ?? $globals['${id}'];`);
    }
    if (this.identifiers.has("it")) {
      this.header.push(`const it = $props;`);
    }
    this.compileNodes(nodes);
    this.flushText();
    let changed = true;
    const triggered = new Set;
    while (changed) {
      changed = false;
      const rawAllCode = this.header.join(`
`) + `
` + this.body.join(`
`) + `
` + this.footer.join(`
`);
      const cleanCode = rawAllCode.replace(JS_STRINGS_REGEX, '""');
      for (const [name, entries] of this.kire.$kire["~handlers"].exists_vars) {
        const nameStr = name.toString();
        if (triggered.has(nameStr))
          continue;
        for (const entry of entries) {
          if (entry.unique && this._isDependency) {
            triggered.add(nameStr);
            continue;
          }
          const regex = createVarThenRegex(typeof entry.name === "string" ? entry.name : entry.name.source);
          if (this.identifiers.has(nameStr) || regex.test(cleanCode)) {
            entry.callback?.(this.createCompilerApi({ type: "directive", name: "existVar", loc: { line: 0, column: 0 } }, {}, true));
            triggered.add(nameStr);
            changed = true;
          }
        }
      }
    }
    if (Object.keys(this.dependencies).length > 0) {
      const dependencyCodes = [];
      for (const path in this.dependencies) {
        const id = this.dependencies[path];
        const depNodes = this.kire.parse(this.kire.readFile(this.kire.resolvePath(path)));
        const compilerInstance = new Compiler(this.kire, path);
        const depCode = compilerInstance.compile(depNodes, [], true);
        const asyncDep = compilerInstance.async;
        dependencyCodes.push(`const ${id} = ${asyncDep ? "async " : ""}function($props = {}, $globals = {}) {
${depCode}
};
${id}.meta = { async: ${asyncDep}, path: '${path}' };`);
      }
      this.body.unshift(`// Dependencies`, ...dependencyCodes);
    }
    let code = `
${this.header.join(`
`)}
${this.body.join(`
`)}
${this.footer.join(`
`)}
return $kire_response;
//# sourceURL=${this.filename}`;
    if (!this.kire.$production) {
      const headerLines = (this.header.join(`
`) + `
`).split(`
`).length + 1;
      const bodyLineOffsets = [];
      let currentLine = headerLines;
      for (let i = 0;i < this.body.length; i++) {
        bodyLineOffsets[i] = currentLine;
        currentLine += this.body[i].split(`
`).length;
      }
      for (const m of this.mappings) {
        const genLine = bodyLineOffsets[m.bodyIndex];
        if (genLine !== undefined && m.node.loc) {
          this.generator.addMapping({
            genLine,
            genCol: m.col,
            sourceLine: m.node.loc.line,
            sourceCol: m.node.loc.column
          });
        }
      }
      code += `
//# sourceMappingURL=${this.generator.toDataUri()}`;
    }
    return code;
  }
  deepCollectIdentifiers(nodes, set, visited) {
    const scan = (c) => {
      let m;
      while ((m = JS_EXTRACT_IDENTS_REGEX.exec(c)) !== null) {
        const id = m[1];
        if (id && !RESERVED_KEYWORDS_REGEX.test(id))
          set.add(id);
      }
      JS_EXTRACT_IDENTS_REGEX.lastIndex = 0;
    };
    for (const n of nodes) {
      if (n.type === "interpolation" || n.type === "js")
        scan(n.content || "");
      if (n.args)
        n.args.forEach((a) => typeof a === "string" && scan(a));
      if (n.type === "directive") {
        if (n.name === "defined" || n.name === "define")
          set.add("__kire_defines");
        if (n.name === "stack" || n.name === "push")
          set.add("__kire_stack");
        if (n.name === "layout" || n.name === "extends" || n.name === "include" || n.name === "component") {
          const rawPath = n.args?.[0];
          if (typeof rawPath === "string") {
            const path = rawPath.replace(STRIP_QUOTES_REGEX, "");
            try {
              const resolved = this.kire.resolvePath(path);
              if (!visited.has(resolved)) {
                visited.add(resolved);
                const depContent = this.kire.readFile(resolved);
                const depNodes = this.kire.parse(depContent);
                this.deepCollectIdentifiers(depNodes, set, visited);
              }
            } catch (e) {}
          }
        }
      }
      if (n.type === "element") {
        if (n.attributes) {
          for (const [key, val] of Object.entries(n.attributes)) {
            if (n.tagName?.startsWith("kire:") || key.startsWith("@")) {
              scan(val);
            } else {
              const code = this.parseAttrCode(val);
              if (code !== val)
                scan(code);
            }
          }
        }
      }
      if (n.children)
        this.deepCollectIdentifiers(n.children, set, visited);
      if (n.related)
        this.deepCollectIdentifiers(n.related, set, visited);
    }
  }
  collectDeclarations(nodes, set) {
    const scan = (c) => {
      let m;
      while ((m = JS_EXTRACT_IDENTS_REGEX.exec(c)) !== null) {
        const id = m[1];
        if (id && !RESERVED_KEYWORDS_REGEX.test(id))
          set.add(id);
      }
      JS_EXTRACT_IDENTS_REGEX.lastIndex = 0;
    };
    for (const n of nodes) {
      if (n.type === "directive") {
        if (n.name === "for") {
          const a = n.args?.[0];
          if (typeof a === "string") {
            let asPart = a;
            const ofIdx = a.lastIndexOf(" of ");
            const inIdx = a.lastIndexOf(" in ");
            const idx = Math.max(ofIdx, inIdx);
            if (idx !== -1)
              asPart = a.slice(0, idx);
            scan(asPart);
          }
        }
        if (n.name === "let" || n.name === "const") {
          const a = n.args?.[0];
          if (typeof a === "string") {
            const first = a.split("=")[0];
            if (first)
              scan(first);
          }
        }
        if (n.name === "error")
          set.add("$message");
      }
      if (n.type === "element" && n.tagName === "kire:for") {
        const as = n.attributes?.["as"];
        if (as)
          scan(as);
        const index = n.attributes?.["index"] || "index";
        set.add(index);
      }
      if (n.type === "js" && n.content) {
        const declRegex = /\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
        let m;
        while ((m = declRegex.exec(n.content)) !== null) {
          if (m[1])
            set.add(m[1]);
        }
      }
      if (n.children)
        this.collectDeclarations(n.children, set);
      if (n.related)
        this.collectDeclarations(n.related, set);
    }
  }
  compileNodes(nodes) {
    for (const n of nodes) {
      switch (n.type) {
        case "text":
          this.textBuffer += n.content || "";
          break;
        case "interpolation":
          this.flushText();
          if (n.content && AWAIT_KEYWORD_REGEX.test(n.content))
            this.markAsync();
          if (!this.kire.$production && n.loc) {
            this.mappings.push({ bodyIndex: this.body.length, node: n, col: 0 });
            this.body.push(`// kire-line: ${n.loc.line}`);
          }
          this.body.push(`$kire_response += ${n.raw ? n.content : `$escape(${n.content})`};`);
          break;
        case "js":
          this.flushText();
          if (n.content && AWAIT_KEYWORD_REGEX.test(n.content))
            this.markAsync();
          if (!this.kire.$production && n.content && n.loc) {
            const lines = n.content.split(`
`);
            for (let i = 0;i < lines.length; i++) {
              const currentLine = n.loc.line + i;
              this.mappings.push({ bodyIndex: this.body.length, node: { ...n, loc: { ...n.loc, line: currentLine } }, col: 0 });
              this.body.push(`// kire-line: ${currentLine}`);
              this.body.push(lines[i] || "");
            }
          } else {
            this.body.push(n.content || "");
          }
          break;
        case "directive":
          this.flushText();
          this.processDirective(n);
          break;
        case "element":
          this.processElement(n);
          break;
      }
    }
  }
  processDirective(n) {
    const d = this.kire.getDirective(n.name);
    if (d) {
      if (!this.kire.$production) {
        this.mappings.push({ bodyIndex: this.body.length, node: n, col: 0 });
        if (n.loc)
          this.body.push(`// kire-line: ${n.loc.line}`);
      }
      d.onCall(this.createCompilerApi(n, d));
    }
  }
  processElement(n) {
    const t = n.tagName || "";
    let matcher = null;
    for (const m of this.kire.$elementMatchers) {
      const def = m.def;
      if (typeof def.name === "string") {
        if (def.name === t) {
          matcher = m;
          break;
        }
        if (WILDCARD_CHAR_REGEX.test(def.name)) {
          const p = def.name.replace("*", "(.*)");
          const m2 = t.match(new RegExp(`^${p}$`));
          if (m2) {
            n.wildcard = m2[1];
            matcher = m;
            break;
          }
        }
      } else if (def.name instanceof RegExp && def.name.test(t)) {
        matcher = m;
        break;
      }
    }
    if (!matcher) {
      this.textBuffer += "<" + t;
      if (n.attributes) {
        for (const [key, val] of Object.entries(n.attributes)) {
          if (key.startsWith("@")) {
            this.flushText();
            const dirDef = this.kire.getDirective(key.slice(1));
            if (dirDef) {
              if (!this.kire.$production) {
                this.mappings.push({ bodyIndex: this.body.length, node: n, col: 0 });
                if (n.loc)
                  this.body.push(`// kire-line: ${n.loc.line}`);
              }
              dirDef.onCall(this.createCompilerApi({ ...n, type: "directive", name: key.slice(1), args: [val] }, dirDef));
            }
          } else {
            if (INTERPOLATION_START_REGEX.test(val)) {
              this.textBuffer += ` ${key}="`;
              this.flushText();
              const code = this.parseAttrCode(val);
              this.body.push(`$kire_response += ${code};`);
              this.textBuffer += '"';
            } else {
              this.textBuffer += ` ${key}="${escapeHtml(val)}"`;
            }
          }
        }
      }
      this.textBuffer += ">";
      if (n.children)
        this.compileNodes(n.children);
      if (!n.void)
        this.textBuffer += "</" + t + ">";
      return;
    }
    this.flushText();
    if (!this.kire.$production) {
      this.mappings.push({ bodyIndex: this.body.length, node: n, col: 0 });
      if (n.loc)
        this.body.push(`// kire-line: ${n.loc.line}`);
    }
    matcher.def.onCall(this.createCompilerApi(n, matcher.def));
  }
  createCompilerApi(node, definition, isExistVar = false) {
    const self = this;
    const api = {
      kire: this.kire,
      node,
      editable: true,
      get fullBody() {
        return self.fullBody;
      },
      get allIdentifiers() {
        return self.allIdentifiers;
      },
      get wildcard() {
        return node.wildcard;
      },
      get children() {
        return node.children;
      },
      prologue: (js) => {
        if (AWAIT_KEYWORD_REGEX.test(js))
          this.markAsync();
        this.header.unshift(js);
      },
      write: (js) => {
        this.flushText();
        if (AWAIT_KEYWORD_REGEX.test(js))
          this.markAsync();
        this.body.push(js);
      },
      epilogue: (js) => {
        this.flushText();
        if (AWAIT_KEYWORD_REGEX.test(js))
          this.markAsync();
        this.footer.push(js);
      },
      after: (js) => {
        api.epilogue(js);
      },
      markAsync: () => this.markAsync(),
      getDependency: (p) => {
        const cleanPath = p.replace(STRIP_QUOTES_REGEX, "");
        return this.kire.getOrCompile(cleanPath, true);
      },
      depend: (p) => {
        const cleanPath = p.replace(STRIP_QUOTES_REGEX, "");
        let r = this.kire.resolvePath(cleanPath);
        if (r.startsWith(this.kire.$root)) {
          r = relative(this.kire.$root, r).replace(/\\/g, "/");
        }
        if (this.dependencies[r])
          return this.dependencies[r];
        const id = `_dep${Object.keys(this.dependencies).length}`;
        this.dependencies[r] = id;
        return id;
      },
      append: (c) => {
        if (typeof c === "string") {
          this.textBuffer += c;
        } else {
          this.flushText();
          this.body.push(`$kire_response += ${c};`);
        }
      },
      renderChildren: (ns) => {
        const targetNodes = ns || node.children || [];
        this.compileNodes(targetNodes);
      },
      uid: (p) => {
        this.uidCounter[p] = (this.uidCounter[p] || 0) + 1;
        return `_${p}${this.uidCounter[p]}`;
      },
      getAttribute: (n) => {
        const val = node.type === "element" ? node.attributes?.[n] : undefined;
        if (val !== undefined)
          return this.parseAttrCode(val);
        if (definition.params && node.args) {
          const i = definition.params.findIndex((p) => p.startsWith(n + ":") || p === n);
          const argVal = i !== -1 ? node.args[i] : undefined;
          return typeof argVal === "string" ? this.parseAttrCode(argVal) : argVal;
        }
        return;
      },
      getArgument: (i) => {
        const argVal = node.args?.[i];
        return typeof argVal === "string" ? this.parseAttrCode(argVal) : argVal;
      },
      transform: (c) => this.parseAttrCode(c),
      raw: (js) => api.write(js),
      res: (c) => api.append(c),
      set: (ns) => api.renderChildren(ns),
      attribute: (n) => api.getAttribute(n),
      param: (n) => typeof n === "number" ? api.getArgument(n) : api.getAttribute(n),
      inject: (js) => api.prologue(js),
      existVar: (name, callback, unique = false) => {
        this.kire.existVar(name, callback, unique);
      }
    };
    return api;
  }
}
// core/src/utils/node.ts
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from "fs";
import { resolve as resolve2, join as join2, isAbsolute as isAbsolute2, relative as relative2 } from "path";
var platform = {
  readFile: (path) => readFileSync(path, "utf-8"),
  exists: (path) => existsSync(path),
  readDir: (path) => readdirSync(path),
  stat: (path) => statSync(path),
  writeFile: (path, data) => writeFileSync(path, data, "utf-8"),
  resolve: (...args) => resolve2(...args).replace(/\\/g, "/"),
  join: (...args) => join2(...args).replace(/\\/g, "/"),
  isAbsolute: (path) => isAbsolute2(path),
  relative: (from, to) => relative2(from, to).replace(/\\/g, "/"),
  cwd: () => process.cwd().replace(/\\/g, "/"),
  env: (key) => process.env[key],
  isProd: () => false
};

// core/src/runtime.ts
function createKireFunction(kire, execute, meta) {
  const fn = execute;
  fn.meta = meta;
  return fn;
}

// core/src/utils/error.ts
class KireError extends Error {
  originalError;
  template;
  constructor(message, template) {
    const originalError = message instanceof Error ? message : new Error(message);
    super(originalError.message);
    this.name = "KireError";
    this.originalError = originalError;
    this.template = template && "meta" in template ? template.meta : template;
    this.stack = this.formatStack(originalError.stack || "");
  }
  getMap() {
    if (!this.template)
      return null;
    if (this.template.map)
      return this.template.map;
    if (this.template.code) {
      const mapUrlIndex = this.template.code.lastIndexOf("//# sourceMappingURL=data:application/json;charset=utf-8;base64,");
      if (mapUrlIndex !== -1) {
        try {
          const base64 = this.template.code.slice(mapUrlIndex + 64).trim();
          this.template.map = JSON.parse(Buffer.from(base64, "base64").toString());
          return this.template.map;
        } catch (e) {}
      }
    }
    return null;
  }
  formatStack(stack) {
    const lines = stack.split(`
`);
    const messageLine = lines[0] || `${this.name}: ${this.message}`;
    const mappedLines = [];
    for (let i = 1;i < lines.length; i++) {
      mappedLines.push(this.mapStackLine(lines[i]));
    }
    let finalMessage = messageLine;
    if (finalMessage.startsWith("Error:"))
      finalMessage = `KireError:${finalMessage.slice(6)}`;
    else if (!finalMessage.includes("KireError"))
      finalMessage = `KireError: ${finalMessage}`;
    return `${finalMessage}
${mappedLines.join(`
`)}`;
  }
  mapStackLine(line) {
    const match = line.match(/^\s*at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
    if (match && this.template) {
      const [_, fn, file, l, c] = match;
      const filename = file.replace(/\\/g, "/");
      const genLine = parseInt(l), genCol = parseInt(c);
      if (filename.includes(this.template.path.replace(/\\/g, "/")) || filename.includes("template.kire") || /anonymous|eval|AsyncFunction/.test(filename)) {
        if (this.template.code) {
          const generatedLines = this.template.code.split(`
`);
          for (let i = genLine - 1;i >= Math.max(0, genLine - 15); i--) {
            const gl = generatedLines[i];
            if (gl?.trim().startsWith("// kire-line:")) {
              return `    at ${fn ? `${fn} ` : ""}(${this.template.path}:${gl.split(":")[1].trim()}:${genCol})`;
            }
          }
        }
        const map = this.getMap();
        if (map) {
          const resolved = resolveSourceLocation(map, genLine, genCol);
          if (resolved)
            return `    at ${fn ? `${fn} ` : ""}(${resolved.source}:${resolved.line}:${resolved.column})`;
        }
      }
    }
    return line;
  }
}
function renderErrorHtml(e, kire, ctx) {
  const isProduction = kire?.production ?? false;
  if (isProduction)
    return `<html><body style="background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><h1 style="font-size:1.5rem;margin-top:1rem;letter-spacing:0.05em">INTERNAL SERVER ERROR</h1></body></html>`;
  const template = e instanceof KireError && e.template || (ctx?.$template ? ctx.$template.meta : undefined);
  let snippet = "", location = "", astJson = "null";
  if (template && e.stack) {
    const safePath = template.path.replace(/\\/g, "/").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = e.stack.match(new RegExp(`${safePath}:(\\d+):(\\d+)`)) || e.stack.match(/template\.kire:(\d+):(\d+)/) || e.stack.match(/(?:eval|anonymous):(\d+):(\d+)/);
    if (match) {
      const rawLine = parseInt(match[1]), genCol = parseInt(match[2]);
      let sourceLine = -1;
      if (match[0].includes(template.path.replace(/\\/g, "/")))
        sourceLine = rawLine - 1;
      if (sourceLine === -1) {
        let map = template.map;
        if (!map && template.code) {
          const mapUrlIndex = template.code.lastIndexOf("//# sourceMappingURL=data:application/json;charset=utf-8;base64,");
          if (mapUrlIndex !== -1)
            try {
              const base64 = template.code.slice(mapUrlIndex + 64).trim();
              map = JSON.parse(Buffer.from(base64, "base64").toString());
            } catch (_) {}
        }
        if (map) {
          const res = resolveSourceLocation(map, rawLine, genCol);
          if (res)
            sourceLine = res.line - 1;
        }
      }
      if (sourceLine === -1 && template.code) {
        const lines = template.code.split(`
`);
        for (let i = rawLine - 1;i >= 0; i--) {
          if (lines[i]?.trim().startsWith("// kire-line:")) {
            sourceLine = parseInt(lines[i].split(":")[1].trim()) - 1;
            break;
          }
        }
      }
      if (sourceLine !== -1 && template.source) {
        location = `${template.path}:${sourceLine + 1}`;
        const sourceLines = template.source.split(`
`);
        const start = Math.max(0, sourceLine - 5), end = Math.min(sourceLines.length, sourceLine + 6);
        snippet = sourceLines.slice(start, end).map((l, i) => {
          const cur = start + i + 1;
          return `<div class="line ${cur === sourceLine + 1 ? "active" : ""}"><span>${cur}</span><pre>${l.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></div>`;
        }).join("");
      }
    }
    if (kire && template.source)
      try {
        astJson = JSON.stringify(kire.parse(template.source), null, 2);
      } catch (_) {}
  }
  const stack = (e.stack || "").split(`
`).filter((l) => !l.includes("new AsyncFunction")).map((l) => `<div>${l.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`).join("");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Kire Error</title><style>
        :root { --bg: #000; --card: #09090b; --text: #fff; --muted: #71717a; --danger: #ef4444; --accent: #38bdf8; --border: #27272a; }
        body { background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 4rem 2rem; line-height: 1.5; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { border-bottom: 1px solid var(--border); padding-bottom: 2rem; margin-bottom: 3rem; }
        .err-code { color: var(--danger); font-weight: 700; font-size: .75rem; letter-spacing: .1em; text-transform: uppercase; }
        .err-msg { font-size: 2.25rem; font-weight: 800; margin: .5rem 0; letter-spacing: -0.02em; }
        .err-loc { color: var(--accent); font-family: monospace; font-size: .9rem; }
        .section { margin-bottom: 3rem; }
        .section-title { font-size: .75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; margin-bottom: 1rem; }
        .snippet { background: var(--card); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; font-family: monospace; font-size: .85rem; }
        .line { display: flex; gap: 1rem; padding: 0 1rem; color: #52525b; }
        .line.active { background: #18181b; color: #fff; border-left: 3px solid var(--danger); padding-left: calc(1rem - 3px); }
        .line span { width: 30px; text-align: right; opacity: .3; user-select: none; padding: .2rem 0; }
        .line pre { margin: 0; padding: .2rem 0; white-space: pre-wrap; }
        .box { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; max-height: 300px; overflow: auto; font-size: .75rem; color: #d4d4d8; margin-bottom: 2rem; }
        .stack { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; font-family: monospace; font-size: .8rem; color: #a1a1aa; white-space: pre-wrap; }
        .stack div { padding: .2rem 0; border-bottom: 1px solid #18181b; }
        details summary { cursor: pointer; color: var(--muted); font-size: .75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 1rem; outline: none; }
        details summary:hover { color: var(--text); }
    </style></head><body><div class="container">
        <div class="header">
            <div class="err-code">Error 500</div>
            <h1 class="err-msg">${(e.message || e.toString()).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h1>
            <div class="err-loc">Detected at ${location || "unknown location"}</div>
        </div>
        ${snippet ? `<div class="section"><div class="section-title">Source Context</div><div class="snippet">${snippet}</div></div>` : ""}
        <details><summary>View Execution AST</summary><div class="box"><pre style="margin:0">${astJson.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></div></details>
        <div class="section"><div class="section-title">Stack Trace</div><div class="stack">${stack}</div></div>
    </div></body></html>`;
}

// core/src/type-declare.ts
var type_declare_default = (kire) => {
  kire.kireSchema({
    name: "kire",
    author: "Drysius",
    version: "0.1.2",
    repository: "https://github.com/drysius/kire"
  });
  kire.type({
    variable: "kire",
    type: "global",
    comment: "The Kire template engine instance.",
    tstype: "import('kire').Kire"
  });
  kire.type({
    variable: "$kire",
    type: "context",
    comment: "The Kire template engine instance (context alias).",
    tstype: "import('kire').Kire"
  });
  kire.type({
    variable: "$props",
    type: "context",
    comment: "Local variables passed to the template.",
    tstype: "Record<string, any>"
  });
  kire.type({
    variable: "it",
    type: "context",
    comment: "Reference to the local variables (props). Alias for $props.",
    tstype: "Record<string, any>"
  });
  kire.type({
    variable: "$globals",
    type: "context",
    comment: "Global variables accessible in all templates.",
    tstype: "Record<string, any>"
  });
  kire.type({
    variable: "$kire_response",
    type: "context",
    comment: "The output buffer string. Can be modified directly.",
    tstype: "string"
  });
  kire.type({
    variable: "$escape",
    type: "context",
    comment: "Function to escape HTML content.",
    tstype: "(v: any) => string"
  });
};

// core/src/directives/component.ts
var component_default = (kire) => {
  kire.directive({
    name: `slot`,
    params: [`name:string`],
    children: true,
    onCall: (api) => {
      let name = api.getAttribute("name") || api.getArgument(0);
      if (typeof name === "string" && QUOTED_STR_CHECK_REGEX.test(name))
        name = name.slice(1, -1);
      const id = api.uid("slot");
      api.write(`{ const _oldRes${id} = $kire_response; $kire_response = "";`);
      api.renderChildren();
      api.write(`
                if (typeof $slots !== 'undefined') $slots['${name}'] = $kire_response;
                $kire_response = _oldRes${id};
            }`);
    }
  });
  kire.directive({
    name: `yield`,
    params: [`name:string`, `default:string`],
    children: false,
    onCall: (api) => {
      let name = api.getAttribute("name") || api.getArgument(0);
      if (typeof name === "string" && QUOTED_STR_CHECK_REGEX.test(name))
        name = name.slice(1, -1);
      const def = api.getAttribute("default") || api.getArgument(1);
      api.write(`{
                const content = ($props.slots && $props.slots['${name}']);
                if (content) {
                    $kire_response += content;
                } else {
                    $kire_response += ${def || "''"};
                }
            }`);
    }
  });
  kire.directive({
    name: "component",
    params: ["path:string", "locals:object"],
    children: true,
    onCall: (api) => {
      const rawPath = api.getAttribute("path") || api.getArgument(0);
      const locals = api.getAttribute("locals") || api.getArgument(1) || "new NullProtoObj()";
      const id = api.uid("comp");
      const depId = api.depend(rawPath);
      const dep = api.getDependency(rawPath);
      api.write(`{
                const $slots = new NullProtoObj();
                const _oldRes${id} = $kire_response; $kire_response = "";`);
      api.renderChildren();
      api.write(`
                if (!$slots.default) $slots.default = $kire_response;
                $kire_response = _oldRes${id};
                const _oldProps${id} = $props;
                $props = Object.assign(Object.create($globals), _oldProps${id}, ${locals}, { slots: $slots });
                
                const _dep${id} = ${depId};
                const res${id} = _dep${id}.call(this, $props, $globals, _dep${id});
                ${dep.meta.async ? `$kire_response += await res${id};` : `$kire_response += res${id};`}

                $props = _oldProps${id};
            }`);
    }
  });
  kire.directive({ name: "layout", onCall: (api) => kire.getDirective("component")?.onCall(api) });
  kire.directive({ name: "extends", onCall: (api) => kire.getDirective("component")?.onCall(api) });
  kire.directive({ name: "section", onCall: (api) => kire.getDirective("slot")?.onCall(api) });
};

// core/src/directives/import.ts
var import_default = (kire) => {
  kire.directive({
    name: `include`,
    params: [`path:string`, `locals:object`],
    children: false,
    onCall: (api) => {
      const rawPath = api.getAttribute("path") || api.getArgument(0);
      const locals = api.getAttribute("locals") || api.getArgument(1) || "new NullProtoObj()";
      if (!rawPath)
        return;
      const depId = api.depend(rawPath);
      const dep = api.getDependency(rawPath);
      api.write(`{
                const _oldProps = $props;
                $props = Object.assign(Object.create($globals), _oldProps, ${locals});
                const _dep = ${depId};
                const res = _dep.call(this, $props, $globals, _dep); 
                ${dep.meta.async ? `$kire_response += await res;` : `$kire_response += res;`}
                $props = _oldProps;
            }`);
    }
  });
};

// core/src/directives/layout.ts
var layout_default = (kire) => {
  kire.existVar("__kire_stack", (api) => {
    api.prologue(`${api.editable ? "let" : "const"} __kire_stack = new this.NullProtoObj;`);
    api.epilogue(`
            if (typeof $kire_response === 'string') {
                $kire_response = $kire_response.replace(/<!-- KIRE:stack\\(.*?\\) -->/g, "");
            }
        `);
  }, true);
  kire.existVar("__kire_defines", (api) => {
    api.prologue(`${api.editable ? "let" : "const"} __kire_defines = new this.NullProtoObj;`);
    api.epilogue(`
            if (typeof $kire_response === 'string') {
                $kire_response = $kire_response.replace(/<!-- KIRE:defined\\((.*?)\\) -->([\\s\\S]*?)<!-- KIRE:enddefined -->/g, (match, name, fallback) => {
                    return (__kire_defines && __kire_defines[name] !== undefined) ? __kire_defines[name] : fallback;
                });
            }
        `);
  }, true);
  kire.directive({
    name: `define`,
    params: [`name:string`],
    children: true,
    onCall: (api) => {
      let name = api.getAttribute("name");
      if (typeof name === "string" && QUOTED_STR_CHECK_REGEX.test(name))
        name = name.slice(1, -1);
      const id = api.uid("def");
      api.write(`{ const _origRes${id} = $kire_response; $kire_response = "";`);
      api.renderChildren();
      api.write(`
                __kire_defines['${name}'] = $kire_response;
                $kire_response = _origRes${id};
            }`);
    }
  });
  kire.directive({
    name: `defined`,
    params: [`name:string`],
    children: `auto`,
    onCall: (api) => {
      let name = api.getAttribute("name");
      if (typeof name === "string" && QUOTED_STR_CHECK_REGEX.test(name))
        name = name.slice(1, -1);
      api.write(`$kire_response += "<!-- KIRE:defined(${name}) -->";`);
      if (api.children) {
        api.renderChildren();
      }
      api.write(`$kire_response += "<!-- KIRE:enddefined -->";`);
    }
  });
  kire.directive({
    name: `stack`,
    params: [`name:string`],
    children: false,
    onCall: (api) => {
      let name = api.getAttribute("name") || api.getArgument(0);
      if (typeof name === "string" && QUOTED_STR_CHECK_REGEX.test(name))
        name = name.slice(1, -1);
      api.write(`$kire_response += "<!-- KIRE:stack(${name}) -->";`);
      const phId = api.uid("ph");
      api.epilogue(`
                if (typeof __kire_stack !== 'undefined' && __kire_stack['${name}']) {
                    const _placeholder${phId} = "<!-- KIRE:stack(${name}) -->";
                    $kire_response = $kire_response.split(_placeholder${phId}).join(__kire_stack['${name}'].join("\\n"));
                }
            `);
    }
  });
  kire.directive({
    name: `push`,
    params: [`name:string`],
    children: true,
    onCall: (api) => {
      let name = api.getAttribute("name");
      if (typeof name === "string" && QUOTED_STR_CHECK_REGEX.test(name))
        name = name.slice(1, -1);
      const id = api.uid("push");
      api.write(`{
                if (!__kire_stack['${name}']) __kire_stack['${name}'] = [];
                const __kire_${id} = $kire_response; $kire_response = "";`);
      api.renderChildren();
      api.write(`
                __kire_stack['${name}'].push($kire_response);
                $kire_response = __kire_${id};
            }`);
    }
  });
};

// core/src/directives/natives/if.ts
var if_default = (kire) => {
  const elseDirective = {
    name: `else`,
    children: true,
    onCall: (api) => {
      api.write(`} else {`);
      api.renderChildren();
    }
  };
  kire.directive({
    name: `if`,
    params: [`cond:any`],
    children: true,
    related: ["else", "elseif"],
    onCall: (api) => {
      const cond = api.getAttribute("cond");
      api.write(`if (${cond}) {`);
      api.renderChildren();
      if (api.node.related && api.node.related.length > 0) {
        api.renderChildren(api.node.related);
      }
      api.write(`}`);
    }
  });
  kire.directive({
    ...elseDirective,
    name: `elseif`,
    params: [`cond:any`],
    onCall: (api) => {
      const cond = api.getAttribute("cond");
      api.write(`} else if (${cond}) {`);
      api.renderChildren();
    }
  });
  kire.directive({
    name: `unless`,
    params: [`cond:any`],
    children: true,
    onCall: (api) => {
      const cond = api.getAttribute("cond");
      api.write(`if (!(${cond})) {`);
      api.renderChildren();
      api.write(`}`);
    }
  });
  kire.directive(elseDirective);
};

// core/src/directives/natives/loop.ts
var loop_default = (kire) => {
  kire.directive({
    name: `for`,
    params: [`expr:any`],
    children: true,
    onCall: (api) => {
      const rawExpr = api.getAttribute("expr") || api.getArgument(0) || "[]";
      const id = api.uid("i");
      let items = rawExpr;
      let finalAs = "item";
      let finalIndex = "index";
      const loopMatch = rawExpr.match(/^\s*(?:(\(([^,]+)\s*,\s*([^)]+)\))|(.+?))\s+(?:of|in)\s+(.+)$/);
      if (loopMatch) {
        if (loopMatch[1]) {
          finalAs = loopMatch[2].trim();
          finalIndex = loopMatch[3].trim();
        } else {
          finalAs = loopMatch[4].trim();
        }
        items = loopMatch[5].trim();
      }
      api.write(`{
                const _r${id} = ${items};
                const _it${id} = Array.isArray(_r${id}) ? _r${id} : Object.entries(_r${id} || this.NullProtoObj);
                const _len${id} = _it${id}.length;
                let ${id} = 0;
                while (${id} < _len${id}) {
                    const _e${id} = _it${id}[${id}];
                    let ${finalAs} = Array.isArray(_r${id}) ? _e${id} : _e${id}[0];
                    ${api.fullBody.includes("index") || api.allIdentifiers.has("index") ? `let ${finalIndex} = ${id};` : ""}
                    ${api.fullBody.includes("$loop") || api.allIdentifiers.has("$loop") ? `let $loop = { index: ${id}, first: ${id} === 0, last: ${id} === _len${id} - 1, length: _len${id} };` : ""}`);
      api.renderChildren();
      api.write(`    ${id}++;
                }
            }`);
    }
  });
  kire.directive({
    name: `each`,
    params: [`items:any`, `as:string`],
    children: true,
    onCall: (api) => {
      const forDir = kire.getDirective("for");
      if (forDir)
        forDir.onCall(api);
    }
  });
  kire.directive({
    name: `empty`,
    children: true,
    onCall: (api) => {
      api.renderChildren();
    }
  });
};

// core/src/directives/natives/checks.ts
var checks_default = (kire) => {
  kire.directive({
    name: `isset`,
    params: [`expr:any`],
    children: true,
    onCall: (api) => {
      const expr = api.getAttribute("expr");
      api.write(`if (typeof ${api.transform(expr)} !== 'undefined' && ${api.transform(expr)} !== null) {`);
      api.renderChildren();
      api.write(`}`);
    }
  });
  kire.directive({
    name: `empty`,
    params: [`expr:any`],
    children: true,
    onCall: (api) => {
      const expr = api.getAttribute("expr");
      api.write(`if (!${api.transform(expr)} || (Array.isArray(${api.transform(expr)}) && ${api.transform(expr)}.length === 0)) {`);
      api.renderChildren();
      api.write(`}`);
    }
  });
};

// core/src/directives/natives/attributes.ts
var attributes_default = (kire) => {
  kire.directive({
    name: `class`,
    params: [`classes:any`],
    onCall(api) {
      const classes = api.getAttribute("classes");
      api.write(`{
                const $c = ${classes};
                let $r = "";
                if (Array.isArray($c)) $r = $c.filter(Boolean).join(" ");
                else if (typeof $c === 'object' && $c !== null) $r = Object.entries($c).filter(([_, v]) => v).map(([k]) => k).join(" ");
                else $r = String($c || "");
                if ($r) $kire_response += " class=\\"" + $escape($r) + "\\"";
            }`);
    }
  });
  kire.directive({
    name: `style`,
    params: [`styles:any`],
    onCall(api) {
      const styles = api.getAttribute("styles");
      api.write(`{
                const $s = ${styles};
                let $r = "";
                if (Array.isArray($s)) $r = $s.filter(Boolean).join("; ");
                else if (typeof $s === 'object' && $s !== null) $r = Object.entries($s).filter(([_, v]) => v).map(([k, v]) => v === true ? k : k + ": " + v).join("; ");
                else $r = String($s || "");
                if ($r) $kire_response += " style=\\"" + $escape($r) + "\\"";
            }`);
    }
  });
  const booleanAttrs = ["checked", "selected", "disabled", "readonly"];
  for (const attr of booleanAttrs) {
    kire.directive({
      name: attr,
      params: [`cond:any`],
      onCall(api) {
        const cond = api.getAttribute("cond");
        api.write(`if (${cond}) $kire_response += ' ${attr} ';`);
      }
    });
  }
};

// core/src/directives/natives/switch.ts
var switch_default = (kire) => {
  kire.directive({
    name: `switch`,
    params: [`expr:any`],
    children: true,
    onCall: (api) => {
      const expr = api.getAttribute("expr");
      api.write(`switch (${api.transform(expr)}) {`);
      if (api.node.children) {
        const valid = api.node.children.filter((n) => n.type === "directive" && (n.name === "case" || n.name === "default"));
        api.renderChildren(valid);
      }
      api.write(`}`);
    }
  });
  kire.directive({
    name: `case`,
    params: [`val:any`],
    children: true,
    onCall: (api) => {
      const val = api.getAttribute("val");
      api.write(`case ${api.transform(val)}: {`);
      api.renderChildren();
      api.write(`  break; }`);
    }
  });
  kire.directive({
    name: `default`,
    children: true,
    onCall: (api) => {
      api.write(`default: {`);
      api.renderChildren();
      api.write(`}`);
    }
  });
};

// core/src/directives/natives/misc.ts
var misc_default = (kire) => {
  kire.directive({
    name: `once`,
    children: true,
    onCall: (api) => {
      const id = api.uid("once");
      api.write(`if (!$globals['~once']) $globals['~once'] = new Set();`);
      api.write(`if (!$globals['~once'].has('${id}')) { 
                $globals['~once'].add('${id}');`);
      api.renderChildren();
      api.write(`}`);
    }
  });
  kire.directive({
    name: `error`,
    params: [`field:string`],
    children: true,
    onCall: (api) => {
      const field = api.getAttribute("field");
      api.write(`if ($props.errors && $props.errors[${field}]) {
                $message = $props.errors[${field}];`);
      api.renderChildren();
      api.write(`}`);
    }
  });
  kire.directive({
    name: `csrf`,
    children: false,
    onCall: (api) => {
      api.write(`
                if (typeof $globals.csrf === 'undefined') {
                    throw new Error("CSRF token not defined. Please define it using kire.$global('csrf', 'token')");
                }
                $kire_response += \`<input type="hidden" name="_token" value="\${$globals.csrf}">\`;
            `);
    }
  });
  kire.directive({
    name: `method`,
    params: [`method:string`],
    children: false,
    onCall: (api) => {
      const method = api.getAttribute("method");
      api.append(`<input type="hidden" name="_method" value="\${$escape(${method})}">`);
    }
  });
  kire.directive({
    name: `const`,
    params: [`expr:string`],
    children: false,
    onCall: (api) => {
      api.write(`${api.getAttribute("expr")};`);
    }
  });
  kire.directive({
    name: `let`,
    params: [`expr:string`],
    children: false,
    onCall: (api) => {
      api.write(`${api.getAttribute("expr")};`);
    }
  });
};

// core/src/directives/natives/index.ts
var natives_default = (kire) => {
  kire.kireSchema({
    name: "kire-core",
    author: "Drysius",
    repository: "https://github.com/drysius/kire",
    version: "0.1.2"
  });
  if_default(kire);
  loop_default(kire);
  checks_default(kire);
  attributes_default(kire);
  switch_default(kire);
  misc_default(kire);
};

// core/src/directives/natives.ts
var natives_default2 = (kire) => {
  natives_default(kire);
};

// core/src/elements/natives.ts
var natives_default3 = (kire) => {
  kire.element({
    name: "kire:else",
    onCall: (api) => {
      api.write(`} else {`);
      api.renderChildren();
    }
  });
  kire.element({
    name: "kire:elseif",
    related: ["kire:elseif", "kire:else"],
    onCall: (api) => {
      const cond = api.getAttribute("cond");
      api.write(`} else if (${cond}) {`);
      api.renderChildren();
      if (api.node.related)
        api.renderChildren(api.node.related);
    }
  });
  kire.element({
    name: "kire:if",
    related: ["kire:elseif", "kire:else"],
    onCall: (api) => {
      const cond = api.getAttribute("cond");
      api.write(`if (${cond}) {`);
      api.renderChildren();
      if (api.node.related)
        api.renderChildren(api.node.related);
      api.write(`}`);
    }
  });
  kire.element({
    name: "kire:for",
    related: ["kire:empty"],
    onCall: (api) => {
      const items = api.getAttribute("items") || api.getAttribute("each") || "[]";
      const as = api.getAttribute("as") || "item";
      const indexAs = api.getAttribute("index") || "index";
      const id = api.uid("i");
      api.write(`{
                const _r${id} = ${items};
                const _it${id} = Array.isArray(_r${id}) ? _r${id} : Object.entries(_r${id} || this.NullProtoObj);
                const _len${id} = _it${id}.length;
                let ${id} = 0;
                while (${id} < _len${id}) {
                    const _e${id} = _it${id}[${id}];
                    let ${as} = Array.isArray(_r${id}) ? _e${id} : _e${id}[0];
                    ${api.fullBody.includes("index") || api.allIdentifiers.has("index") ? `let ${indexAs} = ${id};` : ""}
                    ${api.fullBody.includes("$loop") || api.allIdentifiers.has("$loop") ? `let $loop = { index: ${id}, first: ${id} === 0, last: ${id} === _len${id} - 1, length: _len${id} };` : ""}`);
      api.renderChildren();
      api.write(`    ${id}++;
                }
            }`);
    }
  });
  kire.element({
    name: "kire:empty",
    onCall: (api) => {
      api.renderChildren();
    }
  });
  kire.element({
    name: "kire:switch",
    onCall: (api) => {
      api.write(`switch (${api.getAttribute("value")}) {`);
      if (api.node.children) {
        const valid = api.node.children.filter((n) => n.type === "element" && (n.tagName === "kire:case" || n.tagName === "kire:default"));
        api.renderChildren(valid);
      }
      api.write(`}`);
    }
  });
  kire.element({
    name: "kire:case",
    onCall: (api) => {
      api.write(`case ${api.getAttribute("value")}: {`);
      api.renderChildren();
      api.write(`  break; }`);
    }
  });
  kire.element({
    name: "kire:default",
    onCall: (api) => {
      api.write(`default: {`);
      api.renderChildren();
      api.write(`}`);
    }
  });
  kire.element({
    name: /^x-/,
    onCall: (api) => {
      const tagName = api.node.tagName;
      if (tagName === "x-slot" || tagName.startsWith("x-slot:") || tagName.startsWith("x-slot.")) {
        const inferred = tagName.slice("x-slot".length).replace(/^[:.]/, "");
        const attrs2 = api.node.attributes || new NullProtoObj;
        let nameExpr = inferred ? JSON.stringify(inferred) : JSON.stringify("default");
        if (typeof attrs2.name === "string") {
          const raw = attrs2.name.trim();
          if (raw.startsWith("{") && raw.endsWith("}") && raw.length > 2) {
            nameExpr = raw.slice(1, -1);
          } else {
            nameExpr = JSON.stringify(raw);
          }
        }
        const id2 = api.uid("slot");
        api.write(`{
                    const _oldRes${id2} = $kire_response; $kire_response = "";`);
        api.renderChildren();
        api.write(`
                    if (typeof $slots !== 'undefined') $slots[${nameExpr}] = $kire_response;
                    $kire_response = _oldRes${id2};
                }`);
        return;
      }
      const componentName = tagName.slice(2);
      const hasComponentsNamespace = !!api.kire.$namespaces.components;
      const componentPath = hasComponentsNamespace && !componentName.startsWith("components.") ? `components.${componentName}` : componentName;
      const id = api.uid("comp");
      const depId = api.depend(componentPath);
      const dep = api.getDependency(componentPath);
      const attrs = api.node.attributes || new NullProtoObj;
      const propsStr = Object.keys(attrs).map((k) => `'${k}': ${api.getAttribute(k)}`).join(",");
      api.write(`{
                const $slots = new NullProtoObj();
                const _oldRes${id} = $kire_response; $kire_response = "";`);
      if (api.node.children) {
        const slots = api.node.children.filter((c) => c.tagName === "x-slot");
        const defContent = api.node.children.filter((c) => c.tagName !== "x-slot");
        api.renderChildren(slots);
        const hasRealContent = defContent.some((c) => c.type !== "text" || c.content?.trim());
        if (hasRealContent) {
          const defId = api.uid("def");
          api.write(`{ const _defRes${defId} = $kire_response; $kire_response = "";`);
          api.renderChildren(defContent);
          api.write(`$slots.default = $kire_response.trim(); $kire_response = _defRes${defId}; }`);
        }
      }
      api.write(`
                $kire_response = _oldRes${id};
                const _oldProps${id} = $props;
                $props = Object.assign(Object.create($globals), _oldProps${id}, { ${propsStr} }, { slots: $slots });
                
                const _dep${id} = ${depId};
                const res${id} = _dep${id}.call(this, $props, $globals, _dep${id});
                ${dep.meta.async ? `$kire_response += await res${id};` : `$kire_response += res${id};`}
                
                $props = _oldProps${id};
            }`);
    }
  });
};

// core/src/directives/index.ts
var KireDirectives = {
  name: "@kirejs/core",
  sort: 100,
  load(kire) {
    type_declare_default(kire);
    kire.existVar("NullProtoObj", (api) => {
      api.prologue(`const NullProtoObj = this.NullProtoObj;`);
    }, true);
    layout_default(kire);
    natives_default2(kire);
    import_default(kire);
    component_default(kire);
    natives_default3(kire);
  }
};

// core/src/parser.ts
class Parser {
  template;
  kire;
  cursor = 0;
  line = 1;
  column = 1;
  stack = [];
  root = [];
  constructor(template, kire) {
    this.template = template;
    this.kire = kire;
  }
  parse() {
    this.cursor = 0;
    this.line = 1;
    this.column = 1;
    this.stack = [];
    this.root = [];
    const len = this.template.length;
    while (this.cursor < len) {
      const char = this.template[this.cursor];
      if (char === "{" && this.template[this.cursor + 1] === "{") {
        if (this.checkComment())
          continue;
        if (this.checkInterpolation())
          continue;
      }
      if (char === "@") {
        if (this.checkEscapedInterpolation())
          continue;
        if (this.checkEscaped("@"))
          continue;
        if (this.checkDirective())
          continue;
      }
      if (char === "<") {
        if (this.checkJavascript())
          continue;
        if (this.checkElement())
          continue;
        if (this.checkClosingTag())
          continue;
      }
      this.parseText();
    }
    return this.root;
  }
  advance(n) {
    for (let i = 0;i < n; i++) {
      if (this.template[this.cursor + i] === `
`) {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
    }
    this.cursor += n;
  }
  getLoc() {
    return { line: this.line, column: this.column };
  }
  addNode(node) {
    const parent = this.stack[this.stack.length - 1];
    if (parent) {
      if (!parent.children)
        parent.children = [];
      parent.children.push(node);
    } else {
      this.root.push(node);
    }
  }
  checkEscapedInterpolation() {
    if (this.template.startsWith("@{{{", this.cursor)) {
      this.addNode({ type: "text", content: "{{{", loc: this.getLoc() });
      this.advance(4);
      return true;
    }
    if (this.template.startsWith("@{{", this.cursor)) {
      this.addNode({ type: "text", content: "{{", loc: this.getLoc() });
      this.advance(3);
      return true;
    }
    return false;
  }
  checkComment() {
    if (this.template.startsWith("{{--", this.cursor)) {
      const end = this.template.indexOf("--}}", this.cursor + 4);
      if (end !== -1) {
        this.advance(end + 4 - this.cursor);
        return true;
      }
    }
    return false;
  }
  checkInterpolation() {
    const loc = this.getLoc();
    const isRaw = this.template.startsWith("{{{", this.cursor);
    const open = isRaw ? "{{{" : "{{";
    const close = isRaw ? "}}}" : "}}";
    const end = this.template.indexOf(close, this.cursor + open.length);
    if (end !== -1) {
      const content = this.template.slice(this.cursor + open.length, end).trim();
      this.addNode({ type: "interpolation", content, raw: isRaw, loc });
      this.advance(end + close.length - this.cursor);
      return true;
    }
    return false;
  }
  checkDirective() {
    const loc = this.getLoc();
    const slice = this.template.slice(this.cursor);
    const match = slice.match(DIRECTIVE_NAME_REGEX);
    if (!match)
      return false;
    let name = match[1];
    const isEnd = name.startsWith("end");
    const baseName = isEnd ? name === "end" ? null : name.slice(3) : name;
    if (!isEnd) {
      if (!new RegExp(`^(?:${this.kire.$directivesPattern.source})$`).test(name)) {
        const registered = Object.keys(this.kire.$directives.records);
        let found = false;
        for (let i = name.length - 1;i > 0; i--) {
          const sub = name.slice(0, i);
          if (registered.includes(sub)) {
            name = sub;
            found = true;
            break;
          }
        }
        if (!found)
          return false;
      }
    } else {
      if (baseName && !new RegExp(`^(?:${this.kire.$directivesPattern.source})$`).test(baseName)) {}
    }
    if (isEnd) {
      this.popStack(baseName);
      this.advance(name.length + 1);
      return true;
    }
    this.advance(name.length + 1);
    let args = [];
    if (this.template[this.cursor] === "(") {
      const res = this.extractBracketedContent("(", ")");
      if (res) {
        args = this.parseArgs(res.content);
        this.advance(res.fullLength);
      }
    }
    const node = { type: "directive", name, args, children: [], loc };
    const current = this.stack[this.stack.length - 1];
    if (current && (name === "else" || name === "elseif" || name === "empty")) {
      if (!current.related)
        current.related = [];
      current.related.push(node);
      this.stack.pop();
      this.stack.push(node);
      return true;
    }
    this.addNode(node);
    const def = this.kire.getDirective(name);
    if (!def || def.children === true) {
      this.stack.push(node);
    } else if (def.children === "auto" && this.hasExplicitDirectiveEnd(name, this.cursor)) {
      this.stack.push(node);
    }
    return true;
  }
  checkElement() {
    const loc = this.getLoc();
    const slice = this.template.slice(this.cursor);
    const match = slice.match(TAG_OPEN_REGEX);
    if (!match)
      return false;
    const tagName = match[1];
    if (!this.kire.$elementsPattern.test(tagName))
      return false;
    this.advance(match[0].length);
    const attributes = this.parseAttributesState();
    let selfClosing = false;
    while (this.cursor < this.template.length && WHITESPACE_REGEX.test(this.template[this.cursor]))
      this.advance(1);
    if (this.template[this.cursor] === "/") {
      selfClosing = true;
      this.advance(1);
    }
    if (this.template[this.cursor] === ">")
      this.advance(1);
    const node = { type: "element", name: tagName, tagName, attributes, void: selfClosing, children: [], loc };
    if (!selfClosing && (tagName === "style" || tagName === "script")) {
      const closeTag = `</${tagName}>`;
      const endIdx = this.template.indexOf(closeTag, this.cursor);
      if (endIdx !== -1) {
        const content = this.template.slice(this.cursor, endIdx);
        const innerParser = new Parser(content, this.kire);
        innerParser.line = this.line;
        innerParser.column = this.column;
        node.children = innerParser.parse();
        this.addNode(node);
        this.advance(content.length + closeTag.length);
        return true;
      }
    }
    const current = this.stack[this.stack.length - 1];
    const siblings = current ? current.children || [] : this.root;
    let lastIdx = siblings.length - 1;
    while (lastIdx >= 0 && siblings[lastIdx].type === "text" && !siblings[lastIdx].content?.trim()) {
      lastIdx--;
    }
    const lastSibling = siblings[lastIdx];
    const isRelated = tagName.endsWith(":else") || tagName.endsWith(":elseif") || tagName.endsWith(":empty");
    if (lastSibling && isRelated && (lastSibling.tagName === tagName.split(":")[0] || lastSibling.tagName && (tagName.startsWith(lastSibling.tagName) || lastSibling.tagName.startsWith(tagName.split(":")[0])))) {
      if (!lastSibling.related)
        lastSibling.related = [];
      lastSibling.related.push(node);
      if (!node.void)
        this.stack.push(node);
      return true;
    }
    this.addNode(node);
    if (!node.void)
      this.stack.push(node);
    return true;
  }
  parseAttributesState() {
    const attrs = new NullProtoObj;
    while (this.cursor < this.template.length) {
      while (this.cursor < this.template.length && WHITESPACE_REGEX.test(this.template[this.cursor]))
        this.advance(1);
      const char = this.template[this.cursor];
      if (char === ">" || char === "/" || !char)
        break;
      let name = "";
      while (this.cursor < this.template.length && !ATTR_NAME_BREAK_REGEX.test(this.template[this.cursor])) {
        name += this.template[this.cursor];
        this.advance(1);
      }
      if (!name)
        break;
      let value = "true";
      if (this.template[this.cursor] === "(") {
        const res = this.extractBracketedContent("(", ")");
        if (res) {
          value = res.content;
          this.advance(res.fullLength);
        }
      } else if (this.template[this.cursor] === "=") {
        this.advance(1);
        const first = this.template[this.cursor];
        if (first === '"' || first === "'") {
          this.advance(1);
          value = "";
          while (this.cursor < this.template.length && this.template[this.cursor] !== first) {
            value += this.template[this.cursor];
            this.advance(1);
          }
          this.advance(1);
        } else {
          value = this.captureBalancedValue();
        }
      }
      attrs[name] = value;
    }
    return attrs;
  }
  captureBalancedValue() {
    let val = "";
    let dPar = 0;
    let dBra = 0;
    let dCur = 0;
    let inQ = null;
    while (this.cursor < this.template.length) {
      const c = this.template[this.cursor];
      if (inQ) {
        if (c === inQ)
          inQ = null;
      } else {
        if (c === '"' || c === "'")
          inQ = c;
        else if (c === "(")
          dPar++;
        else if (c === ")")
          dPar--;
        else if (c === "[")
          dBra++;
        else if (c === "]")
          dBra--;
        else if (c === "{")
          dCur++;
        else if (c === "}")
          dCur--;
      }
      if (!inQ && dPar === 0 && dBra === 0 && dCur === 0 && (WHITESPACE_REGEX.test(c) || c === ">" || c === "/"))
        break;
      val += c;
      this.advance(1);
    }
    return val;
  }
  checkClosingTag() {
    const match = this.template.slice(this.cursor).match(TAG_CLOSE_REGEX);
    if (!match)
      return false;
    const tagName = match[1];
    if (!this.kire.$elementsPattern.test(tagName))
      return false;
    this.popStack(tagName);
    this.advance(match[0].length);
    return true;
  }
  checkJavascript() {
    const loc = this.getLoc();
    if (this.template.startsWith("<?js", this.cursor)) {
      const end = this.template.indexOf("?>", this.cursor + 4);
      if (end !== -1) {
        this.addNode({ type: "js", content: this.template.slice(this.cursor + 4, end), loc });
        this.advance(end + 2 - this.cursor);
        return true;
      }
    }
    return false;
  }
  checkEscaped(char) {
    const loc = this.getLoc();
    if (this.template.startsWith("@" + char, this.cursor)) {
      this.addNode({ type: "text", content: char, loc });
      this.advance(2);
      return true;
    }
    return false;
  }
  parseText() {
    const loc = this.getLoc();
    TEXT_SCAN_REGEX.lastIndex = this.cursor;
    const match = TEXT_SCAN_REGEX.exec(this.template);
    const end = match ? match.index : this.template.length;
    if (end > this.cursor) {
      this.addNode({ type: "text", content: this.template.slice(this.cursor, end), loc });
      this.advance(end - this.cursor);
    } else {
      this.addNode({ type: "text", content: this.template[this.cursor], loc });
      this.advance(1);
    }
  }
  popStack(name) {
    if (this.stack.length === 0)
      return;
    if (!name) {
      this.stack.pop();
      return;
    }
    for (let i = this.stack.length - 1;i >= 0; i--) {
      const n = this.stack[i];
      if (n.name === name || n.tagName === name || name.startsWith("end") && (n.name === name.slice(3) || n.name === name)) {
        this.stack.splice(i);
        break;
      }
    }
  }
  hasExplicitDirectiveEnd(name, fromCursor) {
    const rest = this.template.slice(fromCursor);
    return this.findUnescapedDirective(rest, `end${name}`) !== -1 || this.findUnescapedDirective(rest, "end") !== -1;
  }
  findUnescapedDirective(source, directiveName) {
    const token = `@${directiveName}`;
    let idx = source.indexOf(token);
    while (idx !== -1) {
      const prev = idx > 0 ? source[idx - 1] : "";
      const next = source[idx + token.length] || "";
      const boundaryOk = !/[A-Za-z0-9_]/.test(next);
      if (prev !== "@" && boundaryOk)
        return idx;
      idx = source.indexOf(token, idx + token.length);
    }
    return -1;
  }
  extractBracketedContent(open, close) {
    let depth = 0;
    let content = "";
    for (let i = 0;i < this.template.length - this.cursor; i++) {
      const char = this.template[this.cursor + i];
      if (char === open)
        depth++;
      else if (char === close)
        depth--;
      content += char;
      if (depth === 0)
        return { content: content.slice(1, -1), fullLength: i + 1 };
    }
    return null;
  }
  parseArgs(argsStr) {
    const args = [];
    let current = "";
    let dPar = 0;
    let dBra = 0;
    let dCur = 0;
    let inQ = null;
    for (let i = 0;i < argsStr.length; i++) {
      const c = argsStr[i];
      if (inQ) {
        if (c === inQ && argsStr[i - 1] !== "\\")
          inQ = null;
      } else {
        if (c === '"' || c === "'")
          inQ = c;
        else if (c === "(")
          dPar++;
        else if (c === ")")
          dPar--;
        else if (c === "[")
          dBra++;
        else if (c === "]")
          dBra--;
        else if (c === "{")
          dCur++;
        else if (c === "}")
          dCur--;
        else if (c === "," && dPar === 0 && dBra === 0 && dCur === 0) {
          args.push(current.trim());
          current = "";
          continue;
        }
      }
      current += c;
    }
    if (current.trim() || args.length > 0)
      args.push(current.trim());
    return args;
  }
}

// core/src/utils/resolve.ts
function resolvePath(filepath, config, platform2) {
  if (!filepath || filepath.startsWith("http"))
    return filepath;
  let path = filepath.replace(/\\/g, "/");
  const ext = "." + config.extension;
  const namespaces = config.namespaces;
  for (const ns in namespaces) {
    if (path.startsWith(ns + "/") || path.startsWith(ns + ".")) {
      const target = namespaces[ns];
      let suffix = path.slice(ns.length + 1);
      if (!suffix.endsWith(ext)) {
        suffix = suffix.replace(/\./g, "/") + ext;
      }
      return platform2.join(target, suffix);
    }
  }
  if (path.includes(".")) {
    const parts = path.split(".");
    const ns = parts[0];
    if (namespaces[ns]) {
      const target = namespaces[ns];
      let suffix = parts.slice(1).join("/");
      if (!suffix.endsWith(ext))
        suffix += ext;
      return platform2.join(target, suffix);
    }
    if (!path.includes("/") && !path.startsWith(".") && !path.endsWith(ext)) {
      path = path.replace(/\./g, "/") + ext;
    }
  }
  if (!path.endsWith(ext)) {
    const filename = path.split("/").pop() || "";
    if (!filename.includes(".")) {
      path += ext;
    }
  }
  if (!platform2.isAbsolute(path) && namespaces.components) {
    const inComponents = platform2.join(namespaces.components, path);
    if (platform2.exists(inComponents))
      return inComponents;
  }
  if (!platform2.isAbsolute(path)) {
    path = platform2.resolve(config.root, path);
  }
  return path;
}

// core/src/kire.ts
function kirePlugin(defaultOptions, load) {
  return {
    options: defaultOptions,
    load
  };
}

class Kire {
  __valor = "";
  $kire;
  ["~elements"] = {
    matchers: [],
    pattern: /$^/,
    list: []
  };
  ["~directives"] = {
    pattern: /$^/,
    records: new NullProtoObj
  };
  ["~cache"] = {
    modules: new Map,
    files: new Map
  };
  ["~store"] = {
    globals: new NullProtoObj,
    props: new NullProtoObj,
    files: new NullProtoObj,
    config: new NullProtoObj,
    platform: new NullProtoObj,
    runtime: new NullProtoObj
  };
  ["~handlers"] = {
    exists_vars: new Map,
    forks: []
  };
  ["~schema"] = {
    name: "kire-app",
    version: "1.0.0",
    repository: "",
    dependencies: [],
    directives: [],
    elements: [],
    attributes: [],
    types: []
  };
  ["~parent"];
  ["~compiling"] = new Set;
  get $elements() {
    return this.$kire["~elements"];
  }
  get $directives() {
    return this.$kire["~directives"];
  }
  get $cache() {
    return this.$kire["~cache"];
  }
  get $files() {
    const stored = this["~store"].files;
    const cache = this.$cache.files;
    return new Proxy(stored, {
      get: (target, prop) => {
        if (typeof prop !== "string")
          return Reflect.get(target, prop);
        const s = target[prop];
        if (typeof s === "function")
          return s;
        if (s === undefined && this["~parent"]) {
          const ps = this["~parent"].$files[prop];
          if (ps !== undefined)
            return ps;
        }
        const cached = cache.get(prop);
        return cached && cached.fn ? cached.fn : s;
      },
      set: (target, prop, value) => {
        return Reflect.set(target, prop, value);
      }
    });
  }
  get $schema() {
    return this.$kire["~schema"];
  }
  get $elementMatchers() {
    return this.$elements.matchers;
  }
  get $elementsPattern() {
    return this.$elements.pattern;
  }
  get $directivesPattern() {
    return this.$directives.pattern;
  }
  $globals;
  $props;
  $config;
  $platform;
  $runtime;
  get $production() {
    return this.$config.production;
  }
  get $root() {
    return this.$config.root;
  }
  get $extension() {
    return this.$config.extension;
  }
  get $async() {
    return this.$config.async;
  }
  get $silent() {
    return this.$config.silent;
  }
  get $var_locals() {
    return this.$config.var_locals;
  }
  get $namespaces() {
    return this.$config.namespaces;
  }
  get $max_renders() {
    return this.$config.max_renders;
  }
  get $escape() {
    return this.$runtime.escapeHtml;
  }
  get NullProtoObj() {
    return this.$runtime.NullProtoObj;
  }
  get KireError() {
    return this.$runtime.KireError;
  }
  get renderErrorHtml() {
    return this.$runtime.renderErrorHtml;
  }
  ["~render-symbol"] = Symbol.for("~templates");
  constructor(options = new NullProtoObj) {
    this.$kire = options.parent ? options.parent.$kire : this;
    if (options.parent) {
      this["~parent"] = options.parent;
      Object.defineProperty(this, "$globals", {
        value: this.createStoreProxy(this["~store"].globals, options.parent.$globals),
        writable: true,
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(this, "$props", {
        value: this.createStoreProxy(this["~store"].props, options.parent.$props),
        writable: true,
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(this, "$config", {
        value: this.createStoreProxy(this["~store"].config, options.parent.$config),
        writable: true,
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(this, "$platform", {
        value: this.createStoreProxy(this["~store"].platform, options.parent.$platform),
        writable: true,
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(this, "$runtime", {
        value: this.createStoreProxy(this["~store"].runtime, options.parent.$runtime),
        writable: true,
        enumerable: true,
        configurable: true
      });
      return;
    }
    const run = this["~store"].runtime;
    run.escapeHtml = escapeHtml;
    run.NullProtoObj = NullProtoObj;
    run.KireError = KireError;
    run.renderErrorHtml = renderErrorHtml;
    run.createKireFunction = createKireFunction;
    const plat = this["~store"].platform;
    Object.assign(plat, platform);
    const conf = this["~store"].config;
    conf.production = options.production ?? plat.isProd();
    conf.async = options.async ?? true;
    conf.extension = options.extension ?? "kire";
    conf.silent = options.silent ?? false;
    conf.var_locals = options.local_variable ?? "it";
    conf.max_renders = options.max_renders ?? 1000;
    conf.root = options.root ? plat.resolve(options.root) : plat.cwd();
    conf.namespaces = new NullProtoObj;
    if (options.files) {
      this["~store"].files = { ...options.files };
    }
    Object.defineProperty(this, "$globals", {
      value: this["~store"].globals,
      writable: true,
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(this, "$props", {
      value: this["~store"].props,
      writable: true,
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(this, "$config", {
      value: this["~store"].config,
      writable: true,
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(this, "$platform", {
      value: this["~store"].platform,
      writable: true,
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(this, "$runtime", {
      value: this["~store"].runtime,
      writable: true,
      enumerable: true,
      configurable: true
    });
    if (!options.emptykire) {
      this.plugin(KireDirectives);
    }
  }
  createStoreProxy(localStore, parentStore) {
    return new Proxy(localStore, {
      get: (target, prop, receiver) => {
        if (Reflect.has(target, prop))
          return Reflect.get(target, prop, receiver);
        return Reflect.get(parentStore, prop, receiver);
      },
      set: (target, prop, value) => {
        target[prop] = value;
        return true;
      },
      has: (target, prop) => {
        return Reflect.has(target, prop) || Reflect.has(parentStore, prop);
      },
      deleteProperty: (target, prop) => {
        Reflect.deleteProperty(target, prop);
        return true;
      },
      ownKeys: (target) => {
        const parentKeys = Reflect.ownKeys(parentStore);
        const localKeys = Reflect.ownKeys(target);
        return Array.from(new Set([...localKeys, ...parentKeys]));
      },
      getOwnPropertyDescriptor: (target, prop) => {
        if (Reflect.has(target, prop))
          return Reflect.getOwnPropertyDescriptor(target, prop);
        const parentDesc = Reflect.getOwnPropertyDescriptor(parentStore, prop);
        if (parentDesc && !parentDesc.configurable) {
          return { ...parentDesc, configurable: true };
        }
        return parentDesc;
      },
      defineProperty: (target, prop, descriptor) => {
        Reflect.defineProperty(target, prop, descriptor);
        return true;
      },
      getPrototypeOf: (target) => {
        return Reflect.getPrototypeOf(target);
      },
      setPrototypeOf: (target, proto) => {
        return Reflect.setPrototypeOf(target, proto);
      },
      isExtensible: (target) => {
        return Reflect.isExtensible(target);
      },
      preventExtensions: (target) => {
        return Reflect.preventExtensions(target);
      }
    });
  }
  cached(name) {
    let mod = this.$cache.modules.get(name);
    if (!mod) {
      mod = new this.NullProtoObj;
      this.$cache.modules.set(name, mod);
    }
    return mod;
  }
  fork() {
    const fork = new this.constructor({ parent: this });
    const handlers = this.$kire["~handlers"].forks;
    for (const handler of handlers) {
      handler(fork);
    }
    return fork;
  }
  onFork(callback) {
    this.$kire["~handlers"].forks.push(callback);
    return this;
  }
  plugin(plugin, opts) {
    const merged = Object.assign({}, plugin.options, opts);
    plugin.load(this, merged);
    return this;
  }
  existVar(name, callback, unique = false) {
    const handlers = this.$kire["~handlers"];
    const key = name.toString();
    let list = handlers.exists_vars.get(key);
    if (!list) {
      list = [];
      handlers.exists_vars.set(key, list);
    }
    list.push({ name, unique, callback });
    return this;
  }
  $global(key, value) {
    this.$globals[key] = value;
    return this;
  }
  $prop(key, value) {
    this.$props[key] = value;
    return this;
  }
  resolve(path) {
    return this.resolvePath(path);
  }
  renderError(e, ctx) {
    return this.renderErrorHtml(e, this, ctx);
  }
  kireSchema(def) {
    Object.assign(this.$schema, def);
    return this;
  }
  type(def) {
    this.$schema.types.push(def);
    return this;
  }
  attribute(def) {
    this.$schema.attributes.push(def);
    return this;
  }
  directive(def) {
    this.$directives.records[def.name] = def;
    this.$directives.pattern = createFastMatcher(Object.keys(this.$directives.records));
    this.$schema.directives.push({
      name: def.name,
      description: def.description,
      params: def.params,
      children: def.children,
      example: def.example,
      related: def.related,
      exposes: def.exposes
    });
    return this;
  }
  getDirective(name) {
    return this.$directives.records[name];
  }
  element(def) {
    this.$elements.list.push(def);
    this.$elements.matchers.unshift({ def });
    const names = this.$elements.list.map((d) => d.name);
    this.$elements.pattern = createFastMatcher(names);
    if (typeof def.name === "string") {
      this.$schema.elements.push({
        name: def.name,
        description: def.description,
        void: def.void,
        attributes: def.attributes,
        example: def.example,
        related: def.related
      });
    }
    return this;
  }
  namespace(name, path) {
    this.$namespaces[name] = this.$platform.resolve(this.$root, path);
    return this;
  }
  resolvePath(filepath) {
    return resolvePath(filepath, this.$config, this.$platform);
  }
  readFile(path) {
    const normalized = path.replace(/\\/g, "/");
    const entry = this.$cache.files.get(normalized);
    if (entry?.source)
      return entry.source;
    const stored = this.$files[normalized];
    if (stored) {
      if (typeof stored === "string")
        return stored;
      if (typeof stored === "function" && stored.meta?.source) {
        return stored.meta.source;
      }
      throw new Error(`Path ${path} points to a pre-compiled function without source text.`);
    }
    if (this.$platform.exists(path))
      return this.$platform.readFile(path);
    throw new Error(`Template file not found: ${path}`);
  }
  parse(content) {
    return new Parser(content, this).parse();
  }
  compile(content, filename = "template.kire", extraGlobals = [], isDependency = false) {
    try {
      const nodes = this.parse(content);
      const compilerInstance = new Compiler(this, filename);
      const code = compilerInstance.compile(nodes, extraGlobals, isDependency);
      const async = compilerInstance.async;
      const dependencies = new NullProtoObj;
      for (const [path, id] of Object.entries(compilerInstance.getDependencies())) {
        dependencies[path] = id;
      }
      const AsyncFunc = (async () => {}).constructor;
      const coreFunction = async ? new AsyncFunc("$props, $globals, $kire", code) : new Function("$props, $globals, $kire", code);
      const fn = this.$runtime.createKireFunction(this, coreFunction, {
        async,
        path: filename,
        code,
        source: content,
        map: undefined,
        dependencies
      });
      return { ast: nodes, code, fn, async, time: Date.now(), dependencies, source: content };
    } catch (e) {
      if (!this.$silent) {
        console.error(`Compilation error in ${filename}:`);
        console.error(e);
      }
      if (e instanceof this.KireError)
        throw e;
      throw new this.KireError(e, {
        execute: () => {},
        async: false,
        path: filename,
        code: "",
        source: content,
        map: undefined,
        dependencies: new NullProtoObj
      });
    }
  }
  getOrCompile(path, isDependency = false) {
    const resolved = this.resolvePath(path);
    const stored = this.$files[resolved];
    if (typeof stored === "function")
      return stored;
    const cached = this.$cache.files.get(resolved);
    const source = typeof stored === "string" ? stored : undefined;
    if (this.$production && cached)
      return cached.fn;
    if (!this.$production && !source && this.$platform.exists(resolved)) {
      const mtime = this.$platform.stat(resolved).mtimeMs;
      if (cached && cached.time === mtime)
        return cached.fn;
    } else if (source && cached) {
      return cached.fn;
    }
    if (this.$kire["~compiling"].has(resolved)) {
      throw new Error(`Circular dependency detected: ${resolved}`);
    }
    const content = source ?? this.readFile(resolved);
    this.$kire["~compiling"].add(resolved);
    try {
      const entry = this.compile(content, resolved, [], isDependency);
      if (!source && this.$platform.exists(resolved)) {
        entry.time = this.$platform.stat(resolved).mtimeMs;
      }
      this.$cache.files.set(resolved, entry);
      return entry.fn;
    } finally {
      this.$kire["~compiling"].delete(resolved);
    }
  }
  run(template, locals, globals) {
    try {
      let effectiveProps = locals;
      let effectiveGlobals = globals || this.$globals;
      if (this["~parent"]) {
        effectiveProps = Object.assign(Object.create(this.$props), locals);
      }
      const result = template.call(this, effectiveProps, effectiveGlobals, this);
      if (!this.$async && result instanceof Promise) {
        throw new Error(`Template ${template.meta.path} contains async code but was called synchronously.`);
      }
      return result;
    } catch (e) {
      throw e instanceof this.KireError ? e : new this.KireError(e, template);
    }
  }
  render(template, locals = new NullProtoObj, globals, filename = "template.kire") {
    let bucket = this.$cache.files.get(this["~render-symbol"]);
    if (!bucket) {
      bucket = new Map;
      this.$cache.files.set(this["~render-symbol"], bucket);
    }
    let entry = bucket.get(template);
    if (!entry) {
      entry = this.compile(template, filename, Object.keys(locals));
      if (bucket.size >= this.$max_renders) {
        const first = bucket.keys().next().value;
        bucket.delete(first);
      }
      bucket.set(template, entry);
    }
    return this.run(entry.fn, locals, globals);
  }
  view(path, locals = new NullProtoObj, globals) {
    return this.run(this.getOrCompile(path), locals, globals);
  }
  compileAndBuild(directories, outputFile) {
    const bundled = {};
    const scan = (dir) => {
      if (!this.$platform.exists(dir))
        return;
      const items = this.$platform.readDir(dir);
      for (const item of items) {
        const fullPath = this.$platform.join(dir, item);
        const stat = this.$platform.stat(fullPath);
        if (stat.isDirectory())
          scan(fullPath);
        else if (stat.isFile() && (fullPath.endsWith(this.$extension) || fullPath.endsWith(".kire"))) {
          const content = this.$platform.readFile(fullPath);
          const resolved = this.$platform.relative(this.$root, fullPath);
          const entry = this.compile(content, resolved);
          this.$cache.files.set(resolved, entry);
          bundled[resolved] = entry.async ? `async function($props = {}, $globals = {}, $kire) {
${entry.code}
}` : `function($props = {}, $globals = {}, $kire) {
${entry.code}
}`;
        }
      }
    };
    for (const dir of directories)
      scan(this.$platform.resolve(this.$root, dir));
    const exportLine = typeof module_kire !== "undefined" ? "module.exports = _kire_bundled;" : "export default _kire_bundled;";
    const output = `// Kire Bundled Templates
// Generated at ${new Date().toISOString()}

const _kire_bundled = {
${Object.entries(bundled).map(([key, fn]) => `  "${key}": ${fn}`).join(`,
`)}
};

${exportLine}
`;
    this.$platform.writeFile(outputFile, output);
  }
}
// packages/wire/src/index.ts
import { randomUUID as randomUUID2 } from "crypto";

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/guard/guard.mjs
function IsAsyncIterator(value) {
  return IsObject(value) && globalThis.Symbol.asyncIterator in value;
}
function IsIterator(value) {
  return IsObject(value) && globalThis.Symbol.iterator in value;
}
function IsPromise(value) {
  return value instanceof globalThis.Promise;
}
function IsDate(value) {
  return value instanceof Date && globalThis.Number.isFinite(value.getTime());
}
function IsUint8Array(value) {
  return value instanceof globalThis.Uint8Array;
}
function HasPropertyKey(value, key) {
  return key in value;
}
function IsObject(value) {
  return value !== null && typeof value === "object";
}
function IsArray(value) {
  return globalThis.Array.isArray(value) && !globalThis.ArrayBuffer.isView(value);
}
function IsUndefined(value) {
  return value === undefined;
}
function IsNull(value) {
  return value === null;
}
function IsBoolean(value) {
  return typeof value === "boolean";
}
function IsNumber(value) {
  return typeof value === "number";
}
function IsInteger(value) {
  return globalThis.Number.isInteger(value);
}
function IsBigInt(value) {
  return typeof value === "bigint";
}
function IsString(value) {
  return typeof value === "string";
}
function IsFunction(value) {
  return typeof value === "function";
}
function IsSymbol(value) {
  return typeof value === "symbol";
}
function IsValueType(value) {
  return IsBigInt(value) || IsBoolean(value) || IsNull(value) || IsNumber(value) || IsString(value) || IsSymbol(value) || IsUndefined(value);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/system/policy.mjs
var TypeSystemPolicy;
(function(TypeSystemPolicy2) {
  TypeSystemPolicy2.InstanceMode = "default";
  TypeSystemPolicy2.ExactOptionalPropertyTypes = false;
  TypeSystemPolicy2.AllowArrayObject = false;
  TypeSystemPolicy2.AllowNaN = false;
  TypeSystemPolicy2.AllowNullVoid = false;
  function IsExactOptionalProperty(value, key) {
    return TypeSystemPolicy2.ExactOptionalPropertyTypes ? key in value : value[key] !== undefined;
  }
  TypeSystemPolicy2.IsExactOptionalProperty = IsExactOptionalProperty;
  function IsObjectLike(value) {
    const isObject = IsObject(value);
    return TypeSystemPolicy2.AllowArrayObject ? isObject : isObject && !IsArray(value);
  }
  TypeSystemPolicy2.IsObjectLike = IsObjectLike;
  function IsRecordLike(value) {
    return IsObjectLike(value) && !(value instanceof Date) && !(value instanceof Uint8Array);
  }
  TypeSystemPolicy2.IsRecordLike = IsRecordLike;
  function IsNumberLike(value) {
    return TypeSystemPolicy2.AllowNaN ? IsNumber(value) : Number.isFinite(value);
  }
  TypeSystemPolicy2.IsNumberLike = IsNumberLike;
  function IsVoidLike(value) {
    const isUndefined = IsUndefined(value);
    return TypeSystemPolicy2.AllowNullVoid ? isUndefined || value === null : isUndefined;
  }
  TypeSystemPolicy2.IsVoidLike = IsVoidLike;
})(TypeSystemPolicy || (TypeSystemPolicy = {}));

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/registry/format.mjs
var exports_format = {};
__export(exports_format, {
  Set: () => Set2,
  Has: () => Has,
  Get: () => Get,
  Entries: () => Entries,
  Delete: () => Delete,
  Clear: () => Clear
});
var map = new Map;
function Entries() {
  return new Map(map);
}
function Clear() {
  return map.clear();
}
function Delete(format) {
  return map.delete(format);
}
function Has(format) {
  return map.has(format);
}
function Set2(format, func) {
  map.set(format, func);
}
function Get(format) {
  return map.get(format);
}
// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/registry/type.mjs
var exports_type = {};
__export(exports_type, {
  Set: () => Set3,
  Has: () => Has2,
  Get: () => Get2,
  Entries: () => Entries2,
  Delete: () => Delete2,
  Clear: () => Clear2
});
var map2 = new Map;
function Entries2() {
  return new Map(map2);
}
function Clear2() {
  return map2.clear();
}
function Delete2(kind) {
  return map2.delete(kind);
}
function Has2(kind) {
  return map2.has(kind);
}
function Set3(kind, func) {
  map2.set(kind, func);
}
function Get2(kind) {
  return map2.get(kind);
}
// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/guard/value.mjs
var exports_value = {};
__export(exports_value, {
  IsUndefined: () => IsUndefined2,
  IsUint8Array: () => IsUint8Array2,
  IsSymbol: () => IsSymbol2,
  IsString: () => IsString2,
  IsRegExp: () => IsRegExp,
  IsObject: () => IsObject2,
  IsNumber: () => IsNumber2,
  IsNull: () => IsNull2,
  IsIterator: () => IsIterator2,
  IsFunction: () => IsFunction2,
  IsDate: () => IsDate2,
  IsBoolean: () => IsBoolean2,
  IsBigInt: () => IsBigInt2,
  IsAsyncIterator: () => IsAsyncIterator2,
  IsArray: () => IsArray2,
  HasPropertyKey: () => HasPropertyKey2
});
function HasPropertyKey2(value, key) {
  return key in value;
}
function IsAsyncIterator2(value) {
  return IsObject2(value) && !IsArray2(value) && !IsUint8Array2(value) && Symbol.asyncIterator in value;
}
function IsArray2(value) {
  return Array.isArray(value);
}
function IsBigInt2(value) {
  return typeof value === "bigint";
}
function IsBoolean2(value) {
  return typeof value === "boolean";
}
function IsDate2(value) {
  return value instanceof globalThis.Date;
}
function IsFunction2(value) {
  return typeof value === "function";
}
function IsIterator2(value) {
  return IsObject2(value) && !IsArray2(value) && !IsUint8Array2(value) && Symbol.iterator in value;
}
function IsNull2(value) {
  return value === null;
}
function IsNumber2(value) {
  return typeof value === "number";
}
function IsObject2(value) {
  return typeof value === "object" && value !== null;
}
function IsRegExp(value) {
  return value instanceof globalThis.RegExp;
}
function IsString2(value) {
  return typeof value === "string";
}
function IsSymbol2(value) {
  return typeof value === "symbol";
}
function IsUint8Array2(value) {
  return value instanceof globalThis.Uint8Array;
}
function IsUndefined2(value) {
  return value === undefined;
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/create/immutable.mjs
function ImmutableArray(value) {
  return globalThis.Object.freeze(value).map((value2) => Immutable(value2));
}
function ImmutableDate(value) {
  return value;
}
function ImmutableUint8Array(value) {
  return value;
}
function ImmutableRegExp(value) {
  return value;
}
function ImmutableObject(value) {
  const result = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    result[key] = Immutable(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    result[key] = Immutable(value[key]);
  }
  return globalThis.Object.freeze(result);
}
function Immutable(value) {
  return IsArray2(value) ? ImmutableArray(value) : IsDate2(value) ? ImmutableDate(value) : IsUint8Array2(value) ? ImmutableUint8Array(value) : IsRegExp(value) ? ImmutableRegExp(value) : IsObject2(value) ? ImmutableObject(value) : value;
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/clone/value.mjs
function ArrayType(value) {
  return value.map((value2) => Visit(value2));
}
function DateType(value) {
  return new Date(value.getTime());
}
function Uint8ArrayType(value) {
  return new Uint8Array(value);
}
function RegExpType(value) {
  return new RegExp(value.source, value.flags);
}
function ObjectType(value) {
  const result = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    result[key] = Visit(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    result[key] = Visit(value[key]);
  }
  return result;
}
function Visit(value) {
  return IsArray2(value) ? ArrayType(value) : IsDate2(value) ? DateType(value) : IsUint8Array2(value) ? Uint8ArrayType(value) : IsRegExp(value) ? RegExpType(value) : IsObject2(value) ? ObjectType(value) : value;
}
function Clone(value) {
  return Visit(value);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/create/type.mjs
function CreateType(schema, options) {
  const result = options !== undefined ? { ...options, ...schema } : schema;
  switch (TypeSystemPolicy.InstanceMode) {
    case "freeze":
      return Immutable(result);
    case "clone":
      return Clone(result);
    default:
      return result;
  }
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/symbols/symbols.mjs
var TransformKind = Symbol.for("TypeBox.Transform");
var ReadonlyKind = Symbol.for("TypeBox.Readonly");
var OptionalKind = Symbol.for("TypeBox.Optional");
var Hint = Symbol.for("TypeBox.Hint");
var Kind = Symbol.for("TypeBox.Kind");

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/unsafe/unsafe.mjs
function Unsafe(options = {}) {
  return CreateType({ [Kind]: options[Kind] ?? "Unsafe" }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/error/error.mjs
class TypeBoxError extends Error {
  constructor(message) {
    super(message);
  }
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/mapped/mapped-result.mjs
function MappedResult(properties) {
  return CreateType({
    [Kind]: "MappedResult",
    properties
  });
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/discard/discard.mjs
function DiscardKey(value, key) {
  const { [key]: _, ...rest } = value;
  return rest;
}
function Discard(value, keys) {
  return keys.reduce((acc, key) => DiscardKey(acc, key), value);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/array/array.mjs
function Array2(items, options) {
  return CreateType({ [Kind]: "Array", type: "array", items }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/async-iterator/async-iterator.mjs
function AsyncIterator(items, options) {
  return CreateType({ [Kind]: "AsyncIterator", type: "AsyncIterator", items }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/constructor/constructor.mjs
function Constructor(parameters, returns, options) {
  return CreateType({ [Kind]: "Constructor", type: "Constructor", parameters, returns }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/function/function.mjs
function Function2(parameters, returns, options) {
  return CreateType({ [Kind]: "Function", type: "Function", parameters, returns }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/computed/computed.mjs
function Computed(target, parameters, options) {
  return CreateType({ [Kind]: "Computed", target, parameters }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/never/never.mjs
function Never(options) {
  return CreateType({ [Kind]: "Never", not: {} }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/guard/kind.mjs
function IsReadonly(value) {
  return IsObject2(value) && value[ReadonlyKind] === "Readonly";
}
function IsOptional(value) {
  return IsObject2(value) && value[OptionalKind] === "Optional";
}
function IsAny(value) {
  return IsKindOf(value, "Any");
}
function IsArgument(value) {
  return IsKindOf(value, "Argument");
}
function IsArray3(value) {
  return IsKindOf(value, "Array");
}
function IsAsyncIterator3(value) {
  return IsKindOf(value, "AsyncIterator");
}
function IsBigInt3(value) {
  return IsKindOf(value, "BigInt");
}
function IsBoolean3(value) {
  return IsKindOf(value, "Boolean");
}
function IsComputed(value) {
  return IsKindOf(value, "Computed");
}
function IsConstructor(value) {
  return IsKindOf(value, "Constructor");
}
function IsDate3(value) {
  return IsKindOf(value, "Date");
}
function IsFunction3(value) {
  return IsKindOf(value, "Function");
}
function IsInteger2(value) {
  return IsKindOf(value, "Integer");
}
function IsIntersect(value) {
  return IsKindOf(value, "Intersect");
}
function IsIterator3(value) {
  return IsKindOf(value, "Iterator");
}
function IsKindOf(value, kind) {
  return IsObject2(value) && Kind in value && value[Kind] === kind;
}
function IsLiteralValue(value) {
  return IsBoolean2(value) || IsNumber2(value) || IsString2(value);
}
function IsLiteral(value) {
  return IsKindOf(value, "Literal");
}
function IsMappedKey(value) {
  return IsKindOf(value, "MappedKey");
}
function IsMappedResult(value) {
  return IsKindOf(value, "MappedResult");
}
function IsNever(value) {
  return IsKindOf(value, "Never");
}
function IsNot(value) {
  return IsKindOf(value, "Not");
}
function IsNull3(value) {
  return IsKindOf(value, "Null");
}
function IsNumber3(value) {
  return IsKindOf(value, "Number");
}
function IsObject3(value) {
  return IsKindOf(value, "Object");
}
function IsPromise2(value) {
  return IsKindOf(value, "Promise");
}
function IsRecord(value) {
  return IsKindOf(value, "Record");
}
function IsRef(value) {
  return IsKindOf(value, "Ref");
}
function IsRegExp2(value) {
  return IsKindOf(value, "RegExp");
}
function IsString3(value) {
  return IsKindOf(value, "String");
}
function IsSymbol3(value) {
  return IsKindOf(value, "Symbol");
}
function IsTemplateLiteral(value) {
  return IsKindOf(value, "TemplateLiteral");
}
function IsThis(value) {
  return IsKindOf(value, "This");
}
function IsTransform(value) {
  return IsObject2(value) && TransformKind in value;
}
function IsTuple(value) {
  return IsKindOf(value, "Tuple");
}
function IsUndefined3(value) {
  return IsKindOf(value, "Undefined");
}
function IsUnion(value) {
  return IsKindOf(value, "Union");
}
function IsUint8Array3(value) {
  return IsKindOf(value, "Uint8Array");
}
function IsUnknown(value) {
  return IsKindOf(value, "Unknown");
}
function IsUnsafe(value) {
  return IsKindOf(value, "Unsafe");
}
function IsVoid(value) {
  return IsKindOf(value, "Void");
}
function IsKind(value) {
  return IsObject2(value) && Kind in value && IsString2(value[Kind]);
}
function IsSchema(value) {
  return IsAny(value) || IsArgument(value) || IsArray3(value) || IsBoolean3(value) || IsBigInt3(value) || IsAsyncIterator3(value) || IsComputed(value) || IsConstructor(value) || IsDate3(value) || IsFunction3(value) || IsInteger2(value) || IsIntersect(value) || IsIterator3(value) || IsLiteral(value) || IsMappedKey(value) || IsMappedResult(value) || IsNever(value) || IsNot(value) || IsNull3(value) || IsNumber3(value) || IsObject3(value) || IsPromise2(value) || IsRecord(value) || IsRef(value) || IsRegExp2(value) || IsString3(value) || IsSymbol3(value) || IsTemplateLiteral(value) || IsThis(value) || IsTuple(value) || IsUndefined3(value) || IsUnion(value) || IsUint8Array3(value) || IsUnknown(value) || IsUnsafe(value) || IsVoid(value) || IsKind(value);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/optional/optional.mjs
function RemoveOptional(schema) {
  return CreateType(Discard(schema, [OptionalKind]));
}
function AddOptional(schema) {
  return CreateType({ ...schema, [OptionalKind]: "Optional" });
}
function OptionalWithFlag(schema, F) {
  return F === false ? RemoveOptional(schema) : AddOptional(schema);
}
function Optional(schema, enable) {
  const F = enable ?? true;
  return IsMappedResult(schema) ? OptionalFromMappedResult(schema, F) : OptionalWithFlag(schema, F);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/optional/optional-from-mapped-result.mjs
function FromProperties(P, F) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Optional(P[K2], F);
  return Acc;
}
function FromMappedResult(R, F) {
  return FromProperties(R.properties, F);
}
function OptionalFromMappedResult(R, F) {
  const P = FromMappedResult(R, F);
  return MappedResult(P);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intersect/intersect-create.mjs
function IntersectCreate(T, options = {}) {
  const allObjects = T.every((schema) => IsObject3(schema));
  const clonedUnevaluatedProperties = IsSchema(options.unevaluatedProperties) ? { unevaluatedProperties: options.unevaluatedProperties } : {};
  return CreateType(options.unevaluatedProperties === false || IsSchema(options.unevaluatedProperties) || allObjects ? { ...clonedUnevaluatedProperties, [Kind]: "Intersect", type: "object", allOf: T } : { ...clonedUnevaluatedProperties, [Kind]: "Intersect", allOf: T }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intersect/intersect-evaluated.mjs
function IsIntersectOptional(types2) {
  return types2.every((left) => IsOptional(left));
}
function RemoveOptionalFromType(type) {
  return Discard(type, [OptionalKind]);
}
function RemoveOptionalFromRest(types2) {
  return types2.map((left) => IsOptional(left) ? RemoveOptionalFromType(left) : left);
}
function ResolveIntersect(types2, options) {
  return IsIntersectOptional(types2) ? Optional(IntersectCreate(RemoveOptionalFromRest(types2), options)) : IntersectCreate(RemoveOptionalFromRest(types2), options);
}
function IntersectEvaluated(types2, options = {}) {
  if (types2.length === 1)
    return CreateType(types2[0], options);
  if (types2.length === 0)
    return Never(options);
  if (types2.some((schema) => IsTransform(schema)))
    throw new Error("Cannot intersect transform types");
  return ResolveIntersect(types2, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intersect/intersect.mjs
function Intersect(types2, options) {
  if (types2.length === 1)
    return CreateType(types2[0], options);
  if (types2.length === 0)
    return Never(options);
  if (types2.some((schema) => IsTransform(schema)))
    throw new Error("Cannot intersect transform types");
  return IntersectCreate(types2, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/union/union-create.mjs
function UnionCreate(T, options) {
  return CreateType({ [Kind]: "Union", anyOf: T }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/union/union-evaluated.mjs
function IsUnionOptional(types2) {
  return types2.some((type) => IsOptional(type));
}
function RemoveOptionalFromRest2(types2) {
  return types2.map((left) => IsOptional(left) ? RemoveOptionalFromType2(left) : left);
}
function RemoveOptionalFromType2(T) {
  return Discard(T, [OptionalKind]);
}
function ResolveUnion(types2, options) {
  const isOptional = IsUnionOptional(types2);
  return isOptional ? Optional(UnionCreate(RemoveOptionalFromRest2(types2), options)) : UnionCreate(RemoveOptionalFromRest2(types2), options);
}
function UnionEvaluated(T, options) {
  return T.length === 1 ? CreateType(T[0], options) : T.length === 0 ? Never(options) : ResolveUnion(T, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/union/union.mjs
function Union(types2, options) {
  return types2.length === 0 ? Never(options) : types2.length === 1 ? CreateType(types2[0], options) : UnionCreate(types2, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/parse.mjs
class TemplateLiteralParserError extends TypeBoxError {
}
function Unescape(pattern) {
  return pattern.replace(/\\\$/g, "$").replace(/\\\*/g, "*").replace(/\\\^/g, "^").replace(/\\\|/g, "|").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
}
function IsNonEscaped(pattern, index, char) {
  return pattern[index] === char && pattern.charCodeAt(index - 1) !== 92;
}
function IsOpenParen(pattern, index) {
  return IsNonEscaped(pattern, index, "(");
}
function IsCloseParen(pattern, index) {
  return IsNonEscaped(pattern, index, ")");
}
function IsSeparator(pattern, index) {
  return IsNonEscaped(pattern, index, "|");
}
function IsGroup(pattern) {
  if (!(IsOpenParen(pattern, 0) && IsCloseParen(pattern, pattern.length - 1)))
    return false;
  let count = 0;
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (count === 0 && index !== pattern.length - 1)
      return false;
  }
  return true;
}
function InGroup(pattern) {
  return pattern.slice(1, pattern.length - 1);
}
function IsPrecedenceOr(pattern) {
  let count = 0;
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (IsSeparator(pattern, index) && count === 0)
      return true;
  }
  return false;
}
function IsPrecedenceAnd(pattern) {
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      return true;
  }
  return false;
}
function Or(pattern) {
  let [count, start] = [0, 0];
  const expressions = [];
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (IsSeparator(pattern, index) && count === 0) {
      const range2 = pattern.slice(start, index);
      if (range2.length > 0)
        expressions.push(TemplateLiteralParse(range2));
      start = index + 1;
    }
  }
  const range = pattern.slice(start);
  if (range.length > 0)
    expressions.push(TemplateLiteralParse(range));
  if (expressions.length === 0)
    return { type: "const", const: "" };
  if (expressions.length === 1)
    return expressions[0];
  return { type: "or", expr: expressions };
}
function And(pattern) {
  function Group(value, index) {
    if (!IsOpenParen(value, index))
      throw new TemplateLiteralParserError(`TemplateLiteralParser: Index must point to open parens`);
    let count = 0;
    for (let scan = index;scan < value.length; scan++) {
      if (IsOpenParen(value, scan))
        count += 1;
      if (IsCloseParen(value, scan))
        count -= 1;
      if (count === 0)
        return [index, scan];
    }
    throw new TemplateLiteralParserError(`TemplateLiteralParser: Unclosed group parens in expression`);
  }
  function Range(pattern2, index) {
    for (let scan = index;scan < pattern2.length; scan++) {
      if (IsOpenParen(pattern2, scan))
        return [index, scan];
    }
    return [index, pattern2.length];
  }
  const expressions = [];
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index)) {
      const [start, end] = Group(pattern, index);
      const range = pattern.slice(start, end + 1);
      expressions.push(TemplateLiteralParse(range));
      index = end;
    } else {
      const [start, end] = Range(pattern, index);
      const range = pattern.slice(start, end);
      if (range.length > 0)
        expressions.push(TemplateLiteralParse(range));
      index = end - 1;
    }
  }
  return expressions.length === 0 ? { type: "const", const: "" } : expressions.length === 1 ? expressions[0] : { type: "and", expr: expressions };
}
function TemplateLiteralParse(pattern) {
  return IsGroup(pattern) ? TemplateLiteralParse(InGroup(pattern)) : IsPrecedenceOr(pattern) ? Or(pattern) : IsPrecedenceAnd(pattern) ? And(pattern) : { type: "const", const: Unescape(pattern) };
}
function TemplateLiteralParseExact(pattern) {
  return TemplateLiteralParse(pattern.slice(1, pattern.length - 1));
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/finite.mjs
class TemplateLiteralFiniteError extends TypeBoxError {
}
function IsNumberExpression(expression) {
  return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "0" && expression.expr[1].type === "const" && expression.expr[1].const === "[1-9][0-9]*";
}
function IsBooleanExpression(expression) {
  return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "true" && expression.expr[1].type === "const" && expression.expr[1].const === "false";
}
function IsStringExpression(expression) {
  return expression.type === "const" && expression.const === ".*";
}
function IsTemplateLiteralExpressionFinite(expression) {
  return IsNumberExpression(expression) || IsStringExpression(expression) ? false : IsBooleanExpression(expression) ? true : expression.type === "and" ? expression.expr.every((expr) => IsTemplateLiteralExpressionFinite(expr)) : expression.type === "or" ? expression.expr.every((expr) => IsTemplateLiteralExpressionFinite(expr)) : expression.type === "const" ? true : (() => {
    throw new TemplateLiteralFiniteError(`Unknown expression type`);
  })();
}
function IsTemplateLiteralFinite(schema) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  return IsTemplateLiteralExpressionFinite(expression);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/generate.mjs
class TemplateLiteralGenerateError extends TypeBoxError {
}
function* GenerateReduce(buffer) {
  if (buffer.length === 1)
    return yield* buffer[0];
  for (const left of buffer[0]) {
    for (const right of GenerateReduce(buffer.slice(1))) {
      yield `${left}${right}`;
    }
  }
}
function* GenerateAnd(expression) {
  return yield* GenerateReduce(expression.expr.map((expr) => [...TemplateLiteralExpressionGenerate(expr)]));
}
function* GenerateOr(expression) {
  for (const expr of expression.expr)
    yield* TemplateLiteralExpressionGenerate(expr);
}
function* GenerateConst(expression) {
  return yield expression.const;
}
function* TemplateLiteralExpressionGenerate(expression) {
  return expression.type === "and" ? yield* GenerateAnd(expression) : expression.type === "or" ? yield* GenerateOr(expression) : expression.type === "const" ? yield* GenerateConst(expression) : (() => {
    throw new TemplateLiteralGenerateError("Unknown expression");
  })();
}
function TemplateLiteralGenerate(schema) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  return IsTemplateLiteralExpressionFinite(expression) ? [...TemplateLiteralExpressionGenerate(expression)] : [];
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/literal/literal.mjs
function Literal(value, options) {
  return CreateType({
    [Kind]: "Literal",
    const: value,
    type: typeof value
  }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/boolean/boolean.mjs
function Boolean2(options) {
  return CreateType({ [Kind]: "Boolean", type: "boolean" }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/bigint/bigint.mjs
function BigInt2(options) {
  return CreateType({ [Kind]: "BigInt", type: "bigint" }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/number/number.mjs
function Number2(options) {
  return CreateType({ [Kind]: "Number", type: "number" }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/string/string.mjs
function String2(options) {
  return CreateType({ [Kind]: "String", type: "string" }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/syntax.mjs
function* FromUnion(syntax) {
  const trim = syntax.trim().replace(/"|'/g, "");
  return trim === "boolean" ? yield Boolean2() : trim === "number" ? yield Number2() : trim === "bigint" ? yield BigInt2() : trim === "string" ? yield String2() : yield (() => {
    const literals = trim.split("|").map((literal) => Literal(literal.trim()));
    return literals.length === 0 ? Never() : literals.length === 1 ? literals[0] : UnionEvaluated(literals);
  })();
}
function* FromTerminal(syntax) {
  if (syntax[1] !== "{") {
    const L = Literal("$");
    const R = FromSyntax(syntax.slice(1));
    return yield* [L, ...R];
  }
  for (let i = 2;i < syntax.length; i++) {
    if (syntax[i] === "}") {
      const L = FromUnion(syntax.slice(2, i));
      const R = FromSyntax(syntax.slice(i + 1));
      return yield* [...L, ...R];
    }
  }
  yield Literal(syntax);
}
function* FromSyntax(syntax) {
  for (let i = 0;i < syntax.length; i++) {
    if (syntax[i] === "$") {
      const L = Literal(syntax.slice(0, i));
      const R = FromTerminal(syntax.slice(i));
      return yield* [L, ...R];
    }
  }
  yield Literal(syntax);
}
function TemplateLiteralSyntax(syntax) {
  return [...FromSyntax(syntax)];
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/patterns/patterns.mjs
var PatternBoolean = "(true|false)";
var PatternNumber = "(0|[1-9][0-9]*)";
var PatternString = "(.*)";
var PatternNever = "(?!.*)";
var PatternBooleanExact = `^${PatternBoolean}$`;
var PatternNumberExact = `^${PatternNumber}$`;
var PatternStringExact = `^${PatternString}$`;
var PatternNeverExact = `^${PatternNever}$`;

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/pattern.mjs
class TemplateLiteralPatternError extends TypeBoxError {
}
function Escape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function Visit2(schema, acc) {
  return IsTemplateLiteral(schema) ? schema.pattern.slice(1, schema.pattern.length - 1) : IsUnion(schema) ? `(${schema.anyOf.map((schema2) => Visit2(schema2, acc)).join("|")})` : IsNumber3(schema) ? `${acc}${PatternNumber}` : IsInteger2(schema) ? `${acc}${PatternNumber}` : IsBigInt3(schema) ? `${acc}${PatternNumber}` : IsString3(schema) ? `${acc}${PatternString}` : IsLiteral(schema) ? `${acc}${Escape(schema.const.toString())}` : IsBoolean3(schema) ? `${acc}${PatternBoolean}` : (() => {
    throw new TemplateLiteralPatternError(`Unexpected Kind '${schema[Kind]}'`);
  })();
}
function TemplateLiteralPattern(kinds) {
  return `^${kinds.map((schema) => Visit2(schema, "")).join("")}$`;
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/union.mjs
function TemplateLiteralToUnion(schema) {
  const R = TemplateLiteralGenerate(schema);
  const L = R.map((S) => Literal(S));
  return UnionEvaluated(L);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/template-literal.mjs
function TemplateLiteral(unresolved, options) {
  const pattern = IsString2(unresolved) ? TemplateLiteralPattern(TemplateLiteralSyntax(unresolved)) : TemplateLiteralPattern(unresolved);
  return CreateType({ [Kind]: "TemplateLiteral", type: "string", pattern }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/indexed/indexed-property-keys.mjs
function FromTemplateLiteral(templateLiteral) {
  const keys = TemplateLiteralGenerate(templateLiteral);
  return keys.map((key) => key.toString());
}
function FromUnion2(types2) {
  const result = [];
  for (const type of types2)
    result.push(...IndexPropertyKeys(type));
  return result;
}
function FromLiteral(literalValue) {
  return [literalValue.toString()];
}
function IndexPropertyKeys(type) {
  return [...new Set(IsTemplateLiteral(type) ? FromTemplateLiteral(type) : IsUnion(type) ? FromUnion2(type.anyOf) : IsLiteral(type) ? FromLiteral(type.const) : IsNumber3(type) ? ["[number]"] : IsInteger2(type) ? ["[number]"] : [])];
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/indexed/indexed-from-mapped-result.mjs
function FromProperties2(type, properties, options) {
  const result = {};
  for (const K2 of Object.getOwnPropertyNames(properties)) {
    result[K2] = Index(type, IndexPropertyKeys(properties[K2]), options);
  }
  return result;
}
function FromMappedResult2(type, mappedResult, options) {
  return FromProperties2(type, mappedResult.properties, options);
}
function IndexFromMappedResult(type, mappedResult, options) {
  const properties = FromMappedResult2(type, mappedResult, options);
  return MappedResult(properties);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/indexed/indexed.mjs
function FromRest(types2, key) {
  return types2.map((type) => IndexFromPropertyKey(type, key));
}
function FromIntersectRest(types2) {
  return types2.filter((type) => !IsNever(type));
}
function FromIntersect(types2, key) {
  return IntersectEvaluated(FromIntersectRest(FromRest(types2, key)));
}
function FromUnionRest(types2) {
  return types2.some((L) => IsNever(L)) ? [] : types2;
}
function FromUnion3(types2, key) {
  return UnionEvaluated(FromUnionRest(FromRest(types2, key)));
}
function FromTuple(types2, key) {
  return key in types2 ? types2[key] : key === "[number]" ? UnionEvaluated(types2) : Never();
}
function FromArray(type, key) {
  return key === "[number]" ? type : Never();
}
function FromProperty(properties, propertyKey) {
  return propertyKey in properties ? properties[propertyKey] : Never();
}
function IndexFromPropertyKey(type, propertyKey) {
  return IsIntersect(type) ? FromIntersect(type.allOf, propertyKey) : IsUnion(type) ? FromUnion3(type.anyOf, propertyKey) : IsTuple(type) ? FromTuple(type.items ?? [], propertyKey) : IsArray3(type) ? FromArray(type.items, propertyKey) : IsObject3(type) ? FromProperty(type.properties, propertyKey) : Never();
}
function IndexFromPropertyKeys(type, propertyKeys) {
  return propertyKeys.map((propertyKey) => IndexFromPropertyKey(type, propertyKey));
}
function FromSchema(type, propertyKeys) {
  return UnionEvaluated(IndexFromPropertyKeys(type, propertyKeys));
}
function Index(type, key, options) {
  if (IsRef(type) || IsRef(key)) {
    const error = `Index types using Ref parameters require both Type and Key to be of TSchema`;
    if (!IsSchema(type) || !IsSchema(key))
      throw new TypeBoxError(error);
    return Computed("Index", [type, key]);
  }
  if (IsMappedResult(key))
    return IndexFromMappedResult(type, key, options);
  if (IsMappedKey(key))
    return IndexFromMappedKey(type, key, options);
  return CreateType(IsSchema(key) ? FromSchema(type, IndexPropertyKeys(key)) : FromSchema(type, key), options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/indexed/indexed-from-mapped-key.mjs
function MappedIndexPropertyKey(type, key, options) {
  return { [key]: Index(type, [key], Clone(options)) };
}
function MappedIndexPropertyKeys(type, propertyKeys, options) {
  return propertyKeys.reduce((result, left) => {
    return { ...result, ...MappedIndexPropertyKey(type, left, options) };
  }, {});
}
function MappedIndexProperties(type, mappedKey, options) {
  return MappedIndexPropertyKeys(type, mappedKey.keys, options);
}
function IndexFromMappedKey(type, mappedKey, options) {
  const properties = MappedIndexProperties(type, mappedKey, options);
  return MappedResult(properties);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/iterator/iterator.mjs
function Iterator(items, options) {
  return CreateType({ [Kind]: "Iterator", type: "Iterator", items }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/object/object.mjs
function RequiredArray(properties) {
  return globalThis.Object.keys(properties).filter((key) => !IsOptional(properties[key]));
}
function _Object(properties, options) {
  const required = RequiredArray(properties);
  const schema = required.length > 0 ? { [Kind]: "Object", type: "object", required, properties } : { [Kind]: "Object", type: "object", properties };
  return CreateType(schema, options);
}
var Object2 = _Object;

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/promise/promise.mjs
function Promise2(item, options) {
  return CreateType({ [Kind]: "Promise", type: "Promise", item }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/readonly/readonly.mjs
function RemoveReadonly(schema) {
  return CreateType(Discard(schema, [ReadonlyKind]));
}
function AddReadonly(schema) {
  return CreateType({ ...schema, [ReadonlyKind]: "Readonly" });
}
function ReadonlyWithFlag(schema, F) {
  return F === false ? RemoveReadonly(schema) : AddReadonly(schema);
}
function Readonly(schema, enable) {
  const F = enable ?? true;
  return IsMappedResult(schema) ? ReadonlyFromMappedResult(schema, F) : ReadonlyWithFlag(schema, F);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/readonly/readonly-from-mapped-result.mjs
function FromProperties3(K, F) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(K))
    Acc[K2] = Readonly(K[K2], F);
  return Acc;
}
function FromMappedResult3(R, F) {
  return FromProperties3(R.properties, F);
}
function ReadonlyFromMappedResult(R, F) {
  const P = FromMappedResult3(R, F);
  return MappedResult(P);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/tuple/tuple.mjs
function Tuple(types2, options) {
  return CreateType(types2.length > 0 ? { [Kind]: "Tuple", type: "array", items: types2, additionalItems: false, minItems: types2.length, maxItems: types2.length } : { [Kind]: "Tuple", type: "array", minItems: types2.length, maxItems: types2.length }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/sets/set.mjs
function SetIncludes(T, S) {
  return T.includes(S);
}
function SetDistinct(T) {
  return [...new Set(T)];
}
function SetIntersect(T, S) {
  return T.filter((L) => S.includes(L));
}
function SetIntersectManyResolve(T, Init) {
  return T.reduce((Acc, L) => {
    return SetIntersect(Acc, L);
  }, Init);
}
function SetIntersectMany(T) {
  return T.length === 1 ? T[0] : T.length > 1 ? SetIntersectManyResolve(T.slice(1), T[0]) : [];
}
function SetUnionMany(T) {
  const Acc = [];
  for (const L of T)
    Acc.push(...L);
  return Acc;
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/mapped/mapped.mjs
function FromMappedResult4(K, P) {
  return K in P ? FromSchemaType(K, P[K]) : MappedResult(P);
}
function MappedKeyToKnownMappedResultProperties(K) {
  return { [K]: Literal(K) };
}
function MappedKeyToUnknownMappedResultProperties(P) {
  const Acc = {};
  for (const L of P)
    Acc[L] = Literal(L);
  return Acc;
}
function MappedKeyToMappedResultProperties(K, P) {
  return SetIncludes(P, K) ? MappedKeyToKnownMappedResultProperties(K) : MappedKeyToUnknownMappedResultProperties(P);
}
function FromMappedKey(K, P) {
  const R = MappedKeyToMappedResultProperties(K, P);
  return FromMappedResult4(K, R);
}
function FromRest2(K, T) {
  return T.map((L) => FromSchemaType(K, L));
}
function FromProperties4(K, T) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(T))
    Acc[K2] = FromSchemaType(K, T[K2]);
  return Acc;
}
function FromSchemaType(K, T) {
  const options = { ...T };
  return IsOptional(T) ? Optional(FromSchemaType(K, Discard(T, [OptionalKind]))) : IsReadonly(T) ? Readonly(FromSchemaType(K, Discard(T, [ReadonlyKind]))) : IsMappedResult(T) ? FromMappedResult4(K, T.properties) : IsMappedKey(T) ? FromMappedKey(K, T.keys) : IsConstructor(T) ? Constructor(FromRest2(K, T.parameters), FromSchemaType(K, T.returns), options) : IsFunction3(T) ? Function2(FromRest2(K, T.parameters), FromSchemaType(K, T.returns), options) : IsAsyncIterator3(T) ? AsyncIterator(FromSchemaType(K, T.items), options) : IsIterator3(T) ? Iterator(FromSchemaType(K, T.items), options) : IsIntersect(T) ? Intersect(FromRest2(K, T.allOf), options) : IsUnion(T) ? Union(FromRest2(K, T.anyOf), options) : IsTuple(T) ? Tuple(FromRest2(K, T.items ?? []), options) : IsObject3(T) ? Object2(FromProperties4(K, T.properties), options) : IsArray3(T) ? Array2(FromSchemaType(K, T.items), options) : IsPromise2(T) ? Promise2(FromSchemaType(K, T.item), options) : T;
}
function MappedFunctionReturnType(K, T) {
  const Acc = {};
  for (const L of K)
    Acc[L] = FromSchemaType(L, T);
  return Acc;
}
function Mapped(key, map3, options) {
  const K = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const RT = map3({ [Kind]: "MappedKey", keys: K });
  const R = MappedFunctionReturnType(K, RT);
  return Object2(R, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/ref/ref.mjs
function Ref(...args) {
  const [$ref, options] = typeof args[0] === "string" ? [args[0], args[1]] : [args[0].$id, args[1]];
  if (typeof $ref !== "string")
    throw new TypeBoxError("Ref: $ref must be a string");
  return CreateType({ [Kind]: "Ref", $ref }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/keyof/keyof-property-keys.mjs
function FromRest3(types2) {
  const result = [];
  for (const L of types2)
    result.push(KeyOfPropertyKeys(L));
  return result;
}
function FromIntersect2(types2) {
  const propertyKeysArray = FromRest3(types2);
  const propertyKeys = SetUnionMany(propertyKeysArray);
  return propertyKeys;
}
function FromUnion4(types2) {
  const propertyKeysArray = FromRest3(types2);
  const propertyKeys = SetIntersectMany(propertyKeysArray);
  return propertyKeys;
}
function FromTuple2(types2) {
  return types2.map((_, indexer) => indexer.toString());
}
function FromArray2(_) {
  return ["[number]"];
}
function FromProperties5(T) {
  return globalThis.Object.getOwnPropertyNames(T);
}
function FromPatternProperties(patternProperties) {
  if (!includePatternProperties)
    return [];
  const patternPropertyKeys = globalThis.Object.getOwnPropertyNames(patternProperties);
  return patternPropertyKeys.map((key) => {
    return key[0] === "^" && key[key.length - 1] === "$" ? key.slice(1, key.length - 1) : key;
  });
}
function KeyOfPropertyKeys(type) {
  return IsIntersect(type) ? FromIntersect2(type.allOf) : IsUnion(type) ? FromUnion4(type.anyOf) : IsTuple(type) ? FromTuple2(type.items ?? []) : IsArray3(type) ? FromArray2(type.items) : IsObject3(type) ? FromProperties5(type.properties) : IsRecord(type) ? FromPatternProperties(type.patternProperties) : [];
}
var includePatternProperties = false;
function KeyOfPattern(schema) {
  includePatternProperties = true;
  const keys = KeyOfPropertyKeys(schema);
  includePatternProperties = false;
  const pattern = keys.map((key) => `(${key})`);
  return `^(${pattern.join("|")})$`;
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/keyof/keyof.mjs
function FromComputed(target, parameters) {
  return Computed("KeyOf", [Computed(target, parameters)]);
}
function FromRef($ref) {
  return Computed("KeyOf", [Ref($ref)]);
}
function KeyOfFromType(type, options) {
  const propertyKeys = KeyOfPropertyKeys(type);
  const propertyKeyTypes = KeyOfPropertyKeysToRest(propertyKeys);
  const result = UnionEvaluated(propertyKeyTypes);
  return CreateType(result, options);
}
function KeyOfPropertyKeysToRest(propertyKeys) {
  return propertyKeys.map((L) => L === "[number]" ? Number2() : Literal(L));
}
function KeyOf(type, options) {
  return IsComputed(type) ? FromComputed(type.target, type.parameters) : IsRef(type) ? FromRef(type.$ref) : IsMappedResult(type) ? KeyOfFromMappedResult(type, options) : KeyOfFromType(type, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/keyof/keyof-from-mapped-result.mjs
function FromProperties6(properties, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = KeyOf(properties[K2], Clone(options));
  return result;
}
function FromMappedResult5(mappedResult, options) {
  return FromProperties6(mappedResult.properties, options);
}
function KeyOfFromMappedResult(mappedResult, options) {
  const properties = FromMappedResult5(mappedResult, options);
  return MappedResult(properties);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/keyof/keyof-property-entries.mjs
function KeyOfPropertyEntries(schema) {
  const keys = KeyOfPropertyKeys(schema);
  const schemas = IndexFromPropertyKeys(schema, keys);
  return keys.map((_, index) => [keys[index], schemas[index]]);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extends/extends-undefined.mjs
function Intersect2(schema) {
  return schema.allOf.every((schema2) => ExtendsUndefinedCheck(schema2));
}
function Union2(schema) {
  return schema.anyOf.some((schema2) => ExtendsUndefinedCheck(schema2));
}
function Not(schema) {
  return !ExtendsUndefinedCheck(schema.not);
}
function ExtendsUndefinedCheck(schema) {
  return schema[Kind] === "Intersect" ? Intersect2(schema) : schema[Kind] === "Union" ? Union2(schema) : schema[Kind] === "Not" ? Not(schema) : schema[Kind] === "Undefined" ? true : false;
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/errors/function.mjs
function DefaultErrorFunction(error) {
  switch (error.errorType) {
    case ValueErrorType.ArrayContains:
      return "Expected array to contain at least one matching value";
    case ValueErrorType.ArrayMaxContains:
      return `Expected array to contain no more than ${error.schema.maxContains} matching values`;
    case ValueErrorType.ArrayMinContains:
      return `Expected array to contain at least ${error.schema.minContains} matching values`;
    case ValueErrorType.ArrayMaxItems:
      return `Expected array length to be less or equal to ${error.schema.maxItems}`;
    case ValueErrorType.ArrayMinItems:
      return `Expected array length to be greater or equal to ${error.schema.minItems}`;
    case ValueErrorType.ArrayUniqueItems:
      return "Expected array elements to be unique";
    case ValueErrorType.Array:
      return "Expected array";
    case ValueErrorType.AsyncIterator:
      return "Expected AsyncIterator";
    case ValueErrorType.BigIntExclusiveMaximum:
      return `Expected bigint to be less than ${error.schema.exclusiveMaximum}`;
    case ValueErrorType.BigIntExclusiveMinimum:
      return `Expected bigint to be greater than ${error.schema.exclusiveMinimum}`;
    case ValueErrorType.BigIntMaximum:
      return `Expected bigint to be less or equal to ${error.schema.maximum}`;
    case ValueErrorType.BigIntMinimum:
      return `Expected bigint to be greater or equal to ${error.schema.minimum}`;
    case ValueErrorType.BigIntMultipleOf:
      return `Expected bigint to be a multiple of ${error.schema.multipleOf}`;
    case ValueErrorType.BigInt:
      return "Expected bigint";
    case ValueErrorType.Boolean:
      return "Expected boolean";
    case ValueErrorType.DateExclusiveMinimumTimestamp:
      return `Expected Date timestamp to be greater than ${error.schema.exclusiveMinimumTimestamp}`;
    case ValueErrorType.DateExclusiveMaximumTimestamp:
      return `Expected Date timestamp to be less than ${error.schema.exclusiveMaximumTimestamp}`;
    case ValueErrorType.DateMinimumTimestamp:
      return `Expected Date timestamp to be greater or equal to ${error.schema.minimumTimestamp}`;
    case ValueErrorType.DateMaximumTimestamp:
      return `Expected Date timestamp to be less or equal to ${error.schema.maximumTimestamp}`;
    case ValueErrorType.DateMultipleOfTimestamp:
      return `Expected Date timestamp to be a multiple of ${error.schema.multipleOfTimestamp}`;
    case ValueErrorType.Date:
      return "Expected Date";
    case ValueErrorType.Function:
      return "Expected function";
    case ValueErrorType.IntegerExclusiveMaximum:
      return `Expected integer to be less than ${error.schema.exclusiveMaximum}`;
    case ValueErrorType.IntegerExclusiveMinimum:
      return `Expected integer to be greater than ${error.schema.exclusiveMinimum}`;
    case ValueErrorType.IntegerMaximum:
      return `Expected integer to be less or equal to ${error.schema.maximum}`;
    case ValueErrorType.IntegerMinimum:
      return `Expected integer to be greater or equal to ${error.schema.minimum}`;
    case ValueErrorType.IntegerMultipleOf:
      return `Expected integer to be a multiple of ${error.schema.multipleOf}`;
    case ValueErrorType.Integer:
      return "Expected integer";
    case ValueErrorType.IntersectUnevaluatedProperties:
      return "Unexpected property";
    case ValueErrorType.Intersect:
      return "Expected all values to match";
    case ValueErrorType.Iterator:
      return "Expected Iterator";
    case ValueErrorType.Literal:
      return `Expected ${typeof error.schema.const === "string" ? `'${error.schema.const}'` : error.schema.const}`;
    case ValueErrorType.Never:
      return "Never";
    case ValueErrorType.Not:
      return "Value should not match";
    case ValueErrorType.Null:
      return "Expected null";
    case ValueErrorType.NumberExclusiveMaximum:
      return `Expected number to be less than ${error.schema.exclusiveMaximum}`;
    case ValueErrorType.NumberExclusiveMinimum:
      return `Expected number to be greater than ${error.schema.exclusiveMinimum}`;
    case ValueErrorType.NumberMaximum:
      return `Expected number to be less or equal to ${error.schema.maximum}`;
    case ValueErrorType.NumberMinimum:
      return `Expected number to be greater or equal to ${error.schema.minimum}`;
    case ValueErrorType.NumberMultipleOf:
      return `Expected number to be a multiple of ${error.schema.multipleOf}`;
    case ValueErrorType.Number:
      return "Expected number";
    case ValueErrorType.Object:
      return "Expected object";
    case ValueErrorType.ObjectAdditionalProperties:
      return "Unexpected property";
    case ValueErrorType.ObjectMaxProperties:
      return `Expected object to have no more than ${error.schema.maxProperties} properties`;
    case ValueErrorType.ObjectMinProperties:
      return `Expected object to have at least ${error.schema.minProperties} properties`;
    case ValueErrorType.ObjectRequiredProperty:
      return "Expected required property";
    case ValueErrorType.Promise:
      return "Expected Promise";
    case ValueErrorType.RegExp:
      return "Expected string to match regular expression";
    case ValueErrorType.StringFormatUnknown:
      return `Unknown format '${error.schema.format}'`;
    case ValueErrorType.StringFormat:
      return `Expected string to match '${error.schema.format}' format`;
    case ValueErrorType.StringMaxLength:
      return `Expected string length less or equal to ${error.schema.maxLength}`;
    case ValueErrorType.StringMinLength:
      return `Expected string length greater or equal to ${error.schema.minLength}`;
    case ValueErrorType.StringPattern:
      return `Expected string to match '${error.schema.pattern}'`;
    case ValueErrorType.String:
      return "Expected string";
    case ValueErrorType.Symbol:
      return "Expected symbol";
    case ValueErrorType.TupleLength:
      return `Expected tuple to have ${error.schema.maxItems || 0} elements`;
    case ValueErrorType.Tuple:
      return "Expected tuple";
    case ValueErrorType.Uint8ArrayMaxByteLength:
      return `Expected byte length less or equal to ${error.schema.maxByteLength}`;
    case ValueErrorType.Uint8ArrayMinByteLength:
      return `Expected byte length greater or equal to ${error.schema.minByteLength}`;
    case ValueErrorType.Uint8Array:
      return "Expected Uint8Array";
    case ValueErrorType.Undefined:
      return "Expected undefined";
    case ValueErrorType.Union:
      return "Expected union value";
    case ValueErrorType.Void:
      return "Expected void";
    case ValueErrorType.Kind:
      return `Expected kind '${error.schema[Kind]}'`;
    default:
      return "Unknown error type";
  }
}
var errorFunction = DefaultErrorFunction;
function GetErrorFunction() {
  return errorFunction;
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/deref/deref.mjs
class TypeDereferenceError extends TypeBoxError {
  constructor(schema) {
    super(`Unable to dereference schema with $id '${schema.$ref}'`);
    this.schema = schema;
  }
}
function Resolve(schema, references) {
  const target = references.find((target2) => target2.$id === schema.$ref);
  if (target === undefined)
    throw new TypeDereferenceError(schema);
  return Deref(target, references);
}
function Pushref(schema, references) {
  if (!IsString(schema.$id) || references.some((target) => target.$id === schema.$id))
    return references;
  references.push(schema);
  return references;
}
function Deref(schema, references) {
  return schema[Kind] === "This" || schema[Kind] === "Ref" ? Resolve(schema, references) : schema;
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/hash/hash.mjs
class ValueHashError extends TypeBoxError {
  constructor(value) {
    super(`Unable to hash value`);
    this.value = value;
  }
}
var ByteMarker;
(function(ByteMarker2) {
  ByteMarker2[ByteMarker2["Undefined"] = 0] = "Undefined";
  ByteMarker2[ByteMarker2["Null"] = 1] = "Null";
  ByteMarker2[ByteMarker2["Boolean"] = 2] = "Boolean";
  ByteMarker2[ByteMarker2["Number"] = 3] = "Number";
  ByteMarker2[ByteMarker2["String"] = 4] = "String";
  ByteMarker2[ByteMarker2["Object"] = 5] = "Object";
  ByteMarker2[ByteMarker2["Array"] = 6] = "Array";
  ByteMarker2[ByteMarker2["Date"] = 7] = "Date";
  ByteMarker2[ByteMarker2["Uint8Array"] = 8] = "Uint8Array";
  ByteMarker2[ByteMarker2["Symbol"] = 9] = "Symbol";
  ByteMarker2[ByteMarker2["BigInt"] = 10] = "BigInt";
})(ByteMarker || (ByteMarker = {}));
var Accumulator = BigInt("14695981039346656037");
var [Prime, Size] = [BigInt("1099511628211"), BigInt("18446744073709551616")];
var Bytes = Array.from({ length: 256 }).map((_, i) => BigInt(i));
var F64 = new Float64Array(1);
var F64In = new DataView(F64.buffer);
var F64Out = new Uint8Array(F64.buffer);
function* NumberToBytes(value) {
  const byteCount = value === 0 ? 1 : Math.ceil(Math.floor(Math.log2(value) + 1) / 8);
  for (let i = 0;i < byteCount; i++) {
    yield value >> 8 * (byteCount - 1 - i) & 255;
  }
}
function ArrayType2(value) {
  FNV1A64(ByteMarker.Array);
  for (const item of value) {
    Visit3(item);
  }
}
function BooleanType(value) {
  FNV1A64(ByteMarker.Boolean);
  FNV1A64(value ? 1 : 0);
}
function BigIntType(value) {
  FNV1A64(ByteMarker.BigInt);
  F64In.setBigInt64(0, value);
  for (const byte of F64Out) {
    FNV1A64(byte);
  }
}
function DateType2(value) {
  FNV1A64(ByteMarker.Date);
  Visit3(value.getTime());
}
function NullType(value) {
  FNV1A64(ByteMarker.Null);
}
function NumberType(value) {
  FNV1A64(ByteMarker.Number);
  F64In.setFloat64(0, value);
  for (const byte of F64Out) {
    FNV1A64(byte);
  }
}
function ObjectType2(value) {
  FNV1A64(ByteMarker.Object);
  for (const key of globalThis.Object.getOwnPropertyNames(value).sort()) {
    Visit3(key);
    Visit3(value[key]);
  }
}
function StringType(value) {
  FNV1A64(ByteMarker.String);
  for (let i = 0;i < value.length; i++) {
    for (const byte of NumberToBytes(value.charCodeAt(i))) {
      FNV1A64(byte);
    }
  }
}
function SymbolType(value) {
  FNV1A64(ByteMarker.Symbol);
  Visit3(value.description);
}
function Uint8ArrayType2(value) {
  FNV1A64(ByteMarker.Uint8Array);
  for (let i = 0;i < value.length; i++) {
    FNV1A64(value[i]);
  }
}
function UndefinedType(value) {
  return FNV1A64(ByteMarker.Undefined);
}
function Visit3(value) {
  if (IsArray(value))
    return ArrayType2(value);
  if (IsBoolean(value))
    return BooleanType(value);
  if (IsBigInt(value))
    return BigIntType(value);
  if (IsDate(value))
    return DateType2(value);
  if (IsNull(value))
    return NullType(value);
  if (IsNumber(value))
    return NumberType(value);
  if (IsObject(value))
    return ObjectType2(value);
  if (IsString(value))
    return StringType(value);
  if (IsSymbol(value))
    return SymbolType(value);
  if (IsUint8Array(value))
    return Uint8ArrayType2(value);
  if (IsUndefined(value))
    return UndefinedType(value);
  throw new ValueHashError(value);
}
function FNV1A64(byte) {
  Accumulator = Accumulator ^ Bytes[byte];
  Accumulator = Accumulator * Prime % Size;
}
function Hash(value) {
  Accumulator = BigInt("14695981039346656037");
  Visit3(value);
  return Accumulator;
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/any/any.mjs
function Any(options) {
  return CreateType({ [Kind]: "Any" }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/unknown/unknown.mjs
function Unknown(options) {
  return CreateType({ [Kind]: "Unknown" }, options);
}
// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/guard/type.mjs
var exports_type2 = {};
__export(exports_type2, {
  TypeGuardUnknownTypeError: () => TypeGuardUnknownTypeError,
  IsVoid: () => IsVoid2,
  IsUnsafe: () => IsUnsafe2,
  IsUnknown: () => IsUnknown2,
  IsUnionLiteral: () => IsUnionLiteral,
  IsUnion: () => IsUnion2,
  IsUndefined: () => IsUndefined4,
  IsUint8Array: () => IsUint8Array4,
  IsTuple: () => IsTuple2,
  IsTransform: () => IsTransform2,
  IsThis: () => IsThis2,
  IsTemplateLiteral: () => IsTemplateLiteral2,
  IsSymbol: () => IsSymbol4,
  IsString: () => IsString4,
  IsSchema: () => IsSchema2,
  IsRegExp: () => IsRegExp3,
  IsRef: () => IsRef2,
  IsRecursive: () => IsRecursive,
  IsRecord: () => IsRecord2,
  IsReadonly: () => IsReadonly2,
  IsProperties: () => IsProperties,
  IsPromise: () => IsPromise3,
  IsOptional: () => IsOptional2,
  IsObject: () => IsObject4,
  IsNumber: () => IsNumber4,
  IsNull: () => IsNull4,
  IsNot: () => IsNot2,
  IsNever: () => IsNever2,
  IsMappedResult: () => IsMappedResult2,
  IsMappedKey: () => IsMappedKey2,
  IsLiteralValue: () => IsLiteralValue2,
  IsLiteralString: () => IsLiteralString,
  IsLiteralNumber: () => IsLiteralNumber,
  IsLiteralBoolean: () => IsLiteralBoolean,
  IsLiteral: () => IsLiteral2,
  IsKindOf: () => IsKindOf2,
  IsKind: () => IsKind2,
  IsIterator: () => IsIterator4,
  IsIntersect: () => IsIntersect2,
  IsInteger: () => IsInteger3,
  IsImport: () => IsImport,
  IsFunction: () => IsFunction4,
  IsDate: () => IsDate4,
  IsConstructor: () => IsConstructor2,
  IsComputed: () => IsComputed2,
  IsBoolean: () => IsBoolean4,
  IsBigInt: () => IsBigInt4,
  IsAsyncIterator: () => IsAsyncIterator4,
  IsArray: () => IsArray4,
  IsArgument: () => IsArgument2,
  IsAny: () => IsAny2
});
class TypeGuardUnknownTypeError extends TypeBoxError {
}
var KnownTypes = [
  "Argument",
  "Any",
  "Array",
  "AsyncIterator",
  "BigInt",
  "Boolean",
  "Computed",
  "Constructor",
  "Date",
  "Enum",
  "Function",
  "Integer",
  "Intersect",
  "Iterator",
  "Literal",
  "MappedKey",
  "MappedResult",
  "Not",
  "Null",
  "Number",
  "Object",
  "Promise",
  "Record",
  "Ref",
  "RegExp",
  "String",
  "Symbol",
  "TemplateLiteral",
  "This",
  "Tuple",
  "Undefined",
  "Union",
  "Uint8Array",
  "Unknown",
  "Void"
];
function IsPattern(value) {
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}
function IsControlCharacterFree(value) {
  if (!IsString2(value))
    return false;
  for (let i = 0;i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 7 && code <= 13 || code === 27 || code === 127) {
      return false;
    }
  }
  return true;
}
function IsAdditionalProperties(value) {
  return IsOptionalBoolean(value) || IsSchema2(value);
}
function IsOptionalBigInt(value) {
  return IsUndefined2(value) || IsBigInt2(value);
}
function IsOptionalNumber(value) {
  return IsUndefined2(value) || IsNumber2(value);
}
function IsOptionalBoolean(value) {
  return IsUndefined2(value) || IsBoolean2(value);
}
function IsOptionalString(value) {
  return IsUndefined2(value) || IsString2(value);
}
function IsOptionalPattern(value) {
  return IsUndefined2(value) || IsString2(value) && IsControlCharacterFree(value) && IsPattern(value);
}
function IsOptionalFormat(value) {
  return IsUndefined2(value) || IsString2(value) && IsControlCharacterFree(value);
}
function IsOptionalSchema(value) {
  return IsUndefined2(value) || IsSchema2(value);
}
function IsReadonly2(value) {
  return IsObject2(value) && value[ReadonlyKind] === "Readonly";
}
function IsOptional2(value) {
  return IsObject2(value) && value[OptionalKind] === "Optional";
}
function IsAny2(value) {
  return IsKindOf2(value, "Any") && IsOptionalString(value.$id);
}
function IsArgument2(value) {
  return IsKindOf2(value, "Argument") && IsNumber2(value.index);
}
function IsArray4(value) {
  return IsKindOf2(value, "Array") && value.type === "array" && IsOptionalString(value.$id) && IsSchema2(value.items) && IsOptionalNumber(value.minItems) && IsOptionalNumber(value.maxItems) && IsOptionalBoolean(value.uniqueItems) && IsOptionalSchema(value.contains) && IsOptionalNumber(value.minContains) && IsOptionalNumber(value.maxContains);
}
function IsAsyncIterator4(value) {
  return IsKindOf2(value, "AsyncIterator") && value.type === "AsyncIterator" && IsOptionalString(value.$id) && IsSchema2(value.items);
}
function IsBigInt4(value) {
  return IsKindOf2(value, "BigInt") && value.type === "bigint" && IsOptionalString(value.$id) && IsOptionalBigInt(value.exclusiveMaximum) && IsOptionalBigInt(value.exclusiveMinimum) && IsOptionalBigInt(value.maximum) && IsOptionalBigInt(value.minimum) && IsOptionalBigInt(value.multipleOf);
}
function IsBoolean4(value) {
  return IsKindOf2(value, "Boolean") && value.type === "boolean" && IsOptionalString(value.$id);
}
function IsComputed2(value) {
  return IsKindOf2(value, "Computed") && IsString2(value.target) && IsArray2(value.parameters) && value.parameters.every((schema) => IsSchema2(schema));
}
function IsConstructor2(value) {
  return IsKindOf2(value, "Constructor") && value.type === "Constructor" && IsOptionalString(value.$id) && IsArray2(value.parameters) && value.parameters.every((schema) => IsSchema2(schema)) && IsSchema2(value.returns);
}
function IsDate4(value) {
  return IsKindOf2(value, "Date") && value.type === "Date" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximumTimestamp) && IsOptionalNumber(value.exclusiveMinimumTimestamp) && IsOptionalNumber(value.maximumTimestamp) && IsOptionalNumber(value.minimumTimestamp) && IsOptionalNumber(value.multipleOfTimestamp);
}
function IsFunction4(value) {
  return IsKindOf2(value, "Function") && value.type === "Function" && IsOptionalString(value.$id) && IsArray2(value.parameters) && value.parameters.every((schema) => IsSchema2(schema)) && IsSchema2(value.returns);
}
function IsImport(value) {
  return IsKindOf2(value, "Import") && HasPropertyKey2(value, "$defs") && IsObject2(value.$defs) && IsProperties(value.$defs) && HasPropertyKey2(value, "$ref") && IsString2(value.$ref) && value.$ref in value.$defs;
}
function IsInteger3(value) {
  return IsKindOf2(value, "Integer") && value.type === "integer" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximum) && IsOptionalNumber(value.exclusiveMinimum) && IsOptionalNumber(value.maximum) && IsOptionalNumber(value.minimum) && IsOptionalNumber(value.multipleOf);
}
function IsProperties(value) {
  return IsObject2(value) && Object.entries(value).every(([key, schema]) => IsControlCharacterFree(key) && IsSchema2(schema));
}
function IsIntersect2(value) {
  return IsKindOf2(value, "Intersect") && (IsString2(value.type) && value.type !== "object" ? false : true) && IsArray2(value.allOf) && value.allOf.every((schema) => IsSchema2(schema) && !IsTransform2(schema)) && IsOptionalString(value.type) && (IsOptionalBoolean(value.unevaluatedProperties) || IsOptionalSchema(value.unevaluatedProperties)) && IsOptionalString(value.$id);
}
function IsIterator4(value) {
  return IsKindOf2(value, "Iterator") && value.type === "Iterator" && IsOptionalString(value.$id) && IsSchema2(value.items);
}
function IsKindOf2(value, kind) {
  return IsObject2(value) && Kind in value && value[Kind] === kind;
}
function IsLiteralString(value) {
  return IsLiteral2(value) && IsString2(value.const);
}
function IsLiteralNumber(value) {
  return IsLiteral2(value) && IsNumber2(value.const);
}
function IsLiteralBoolean(value) {
  return IsLiteral2(value) && IsBoolean2(value.const);
}
function IsLiteral2(value) {
  return IsKindOf2(value, "Literal") && IsOptionalString(value.$id) && IsLiteralValue2(value.const);
}
function IsLiteralValue2(value) {
  return IsBoolean2(value) || IsNumber2(value) || IsString2(value);
}
function IsMappedKey2(value) {
  return IsKindOf2(value, "MappedKey") && IsArray2(value.keys) && value.keys.every((key) => IsNumber2(key) || IsString2(key));
}
function IsMappedResult2(value) {
  return IsKindOf2(value, "MappedResult") && IsProperties(value.properties);
}
function IsNever2(value) {
  return IsKindOf2(value, "Never") && IsObject2(value.not) && Object.getOwnPropertyNames(value.not).length === 0;
}
function IsNot2(value) {
  return IsKindOf2(value, "Not") && IsSchema2(value.not);
}
function IsNull4(value) {
  return IsKindOf2(value, "Null") && value.type === "null" && IsOptionalString(value.$id);
}
function IsNumber4(value) {
  return IsKindOf2(value, "Number") && value.type === "number" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximum) && IsOptionalNumber(value.exclusiveMinimum) && IsOptionalNumber(value.maximum) && IsOptionalNumber(value.minimum) && IsOptionalNumber(value.multipleOf);
}
function IsObject4(value) {
  return IsKindOf2(value, "Object") && value.type === "object" && IsOptionalString(value.$id) && IsProperties(value.properties) && IsAdditionalProperties(value.additionalProperties) && IsOptionalNumber(value.minProperties) && IsOptionalNumber(value.maxProperties);
}
function IsPromise3(value) {
  return IsKindOf2(value, "Promise") && value.type === "Promise" && IsOptionalString(value.$id) && IsSchema2(value.item);
}
function IsRecord2(value) {
  return IsKindOf2(value, "Record") && value.type === "object" && IsOptionalString(value.$id) && IsAdditionalProperties(value.additionalProperties) && IsObject2(value.patternProperties) && ((schema) => {
    const keys = Object.getOwnPropertyNames(schema.patternProperties);
    return keys.length === 1 && IsPattern(keys[0]) && IsObject2(schema.patternProperties) && IsSchema2(schema.patternProperties[keys[0]]);
  })(value);
}
function IsRecursive(value) {
  return IsObject2(value) && Hint in value && value[Hint] === "Recursive";
}
function IsRef2(value) {
  return IsKindOf2(value, "Ref") && IsOptionalString(value.$id) && IsString2(value.$ref);
}
function IsRegExp3(value) {
  return IsKindOf2(value, "RegExp") && IsOptionalString(value.$id) && IsString2(value.source) && IsString2(value.flags) && IsOptionalNumber(value.maxLength) && IsOptionalNumber(value.minLength);
}
function IsString4(value) {
  return IsKindOf2(value, "String") && value.type === "string" && IsOptionalString(value.$id) && IsOptionalNumber(value.minLength) && IsOptionalNumber(value.maxLength) && IsOptionalPattern(value.pattern) && IsOptionalFormat(value.format);
}
function IsSymbol4(value) {
  return IsKindOf2(value, "Symbol") && value.type === "symbol" && IsOptionalString(value.$id);
}
function IsTemplateLiteral2(value) {
  return IsKindOf2(value, "TemplateLiteral") && value.type === "string" && IsString2(value.pattern) && value.pattern[0] === "^" && value.pattern[value.pattern.length - 1] === "$";
}
function IsThis2(value) {
  return IsKindOf2(value, "This") && IsOptionalString(value.$id) && IsString2(value.$ref);
}
function IsTransform2(value) {
  return IsObject2(value) && TransformKind in value;
}
function IsTuple2(value) {
  return IsKindOf2(value, "Tuple") && value.type === "array" && IsOptionalString(value.$id) && IsNumber2(value.minItems) && IsNumber2(value.maxItems) && value.minItems === value.maxItems && (IsUndefined2(value.items) && IsUndefined2(value.additionalItems) && value.minItems === 0 || IsArray2(value.items) && value.items.every((schema) => IsSchema2(schema)));
}
function IsUndefined4(value) {
  return IsKindOf2(value, "Undefined") && value.type === "undefined" && IsOptionalString(value.$id);
}
function IsUnionLiteral(value) {
  return IsUnion2(value) && value.anyOf.every((schema) => IsLiteralString(schema) || IsLiteralNumber(schema));
}
function IsUnion2(value) {
  return IsKindOf2(value, "Union") && IsOptionalString(value.$id) && IsObject2(value) && IsArray2(value.anyOf) && value.anyOf.every((schema) => IsSchema2(schema));
}
function IsUint8Array4(value) {
  return IsKindOf2(value, "Uint8Array") && value.type === "Uint8Array" && IsOptionalString(value.$id) && IsOptionalNumber(value.minByteLength) && IsOptionalNumber(value.maxByteLength);
}
function IsUnknown2(value) {
  return IsKindOf2(value, "Unknown") && IsOptionalString(value.$id);
}
function IsUnsafe2(value) {
  return IsKindOf2(value, "Unsafe");
}
function IsVoid2(value) {
  return IsKindOf2(value, "Void") && value.type === "void" && IsOptionalString(value.$id);
}
function IsKind2(value) {
  return IsObject2(value) && Kind in value && IsString2(value[Kind]) && !KnownTypes.includes(value[Kind]);
}
function IsSchema2(value) {
  return IsObject2(value) && (IsAny2(value) || IsArgument2(value) || IsArray4(value) || IsBoolean4(value) || IsBigInt4(value) || IsAsyncIterator4(value) || IsComputed2(value) || IsConstructor2(value) || IsDate4(value) || IsFunction4(value) || IsInteger3(value) || IsIntersect2(value) || IsIterator4(value) || IsLiteral2(value) || IsMappedKey2(value) || IsMappedResult2(value) || IsNever2(value) || IsNot2(value) || IsNull4(value) || IsNumber4(value) || IsObject4(value) || IsPromise3(value) || IsRecord2(value) || IsRef2(value) || IsRegExp3(value) || IsString4(value) || IsSymbol4(value) || IsTemplateLiteral2(value) || IsThis2(value) || IsTuple2(value) || IsUndefined4(value) || IsUnion2(value) || IsUint8Array4(value) || IsUnknown2(value) || IsUnsafe2(value) || IsVoid2(value) || IsKind2(value));
}
// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extends/extends-check.mjs
class ExtendsResolverError extends TypeBoxError {
}
var ExtendsResult;
(function(ExtendsResult2) {
  ExtendsResult2[ExtendsResult2["Union"] = 0] = "Union";
  ExtendsResult2[ExtendsResult2["True"] = 1] = "True";
  ExtendsResult2[ExtendsResult2["False"] = 2] = "False";
})(ExtendsResult || (ExtendsResult = {}));
function IntoBooleanResult(result) {
  return result === ExtendsResult.False ? result : ExtendsResult.True;
}
function Throw(message) {
  throw new ExtendsResolverError(message);
}
function IsStructuralRight(right) {
  return exports_type2.IsNever(right) || exports_type2.IsIntersect(right) || exports_type2.IsUnion(right) || exports_type2.IsUnknown(right) || exports_type2.IsAny(right);
}
function StructuralRight(left, right) {
  return exports_type2.IsNever(right) ? FromNeverRight(left, right) : exports_type2.IsIntersect(right) ? FromIntersectRight(left, right) : exports_type2.IsUnion(right) ? FromUnionRight(left, right) : exports_type2.IsUnknown(right) ? FromUnknownRight(left, right) : exports_type2.IsAny(right) ? FromAnyRight(left, right) : Throw("StructuralRight");
}
function FromAnyRight(left, right) {
  return ExtendsResult.True;
}
function FromAny(left, right) {
  return exports_type2.IsIntersect(right) ? FromIntersectRight(left, right) : exports_type2.IsUnion(right) && right.anyOf.some((schema) => exports_type2.IsAny(schema) || exports_type2.IsUnknown(schema)) ? ExtendsResult.True : exports_type2.IsUnion(right) ? ExtendsResult.Union : exports_type2.IsUnknown(right) ? ExtendsResult.True : exports_type2.IsAny(right) ? ExtendsResult.True : ExtendsResult.Union;
}
function FromArrayRight(left, right) {
  return exports_type2.IsUnknown(left) ? ExtendsResult.False : exports_type2.IsAny(left) ? ExtendsResult.Union : exports_type2.IsNever(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromArray3(left, right) {
  return exports_type2.IsObject(right) && IsObjectArrayLike(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : !exports_type2.IsArray(right) ? ExtendsResult.False : IntoBooleanResult(Visit4(left.items, right.items));
}
function FromAsyncIterator(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : !exports_type2.IsAsyncIterator(right) ? ExtendsResult.False : IntoBooleanResult(Visit4(left.items, right.items));
}
function FromBigInt(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsBigInt(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromBooleanRight(left, right) {
  return exports_type2.IsLiteralBoolean(left) ? ExtendsResult.True : exports_type2.IsBoolean(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromBoolean(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsBoolean(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromConstructor(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : !exports_type2.IsConstructor(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit4(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit4(left.returns, right.returns));
}
function FromDate(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsDate(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromFunction(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : !exports_type2.IsFunction(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit4(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit4(left.returns, right.returns));
}
function FromIntegerRight(left, right) {
  return exports_type2.IsLiteral(left) && exports_value.IsNumber(left.const) ? ExtendsResult.True : exports_type2.IsNumber(left) || exports_type2.IsInteger(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromInteger(left, right) {
  return exports_type2.IsInteger(right) || exports_type2.IsNumber(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : ExtendsResult.False;
}
function FromIntersectRight(left, right) {
  return right.allOf.every((schema) => Visit4(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromIntersect3(left, right) {
  return left.allOf.some((schema) => Visit4(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromIterator(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : !exports_type2.IsIterator(right) ? ExtendsResult.False : IntoBooleanResult(Visit4(left.items, right.items));
}
function FromLiteral2(left, right) {
  return exports_type2.IsLiteral(right) && right.const === left.const ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsString(right) ? FromStringRight(left, right) : exports_type2.IsNumber(right) ? FromNumberRight(left, right) : exports_type2.IsInteger(right) ? FromIntegerRight(left, right) : exports_type2.IsBoolean(right) ? FromBooleanRight(left, right) : ExtendsResult.False;
}
function FromNeverRight(left, right) {
  return ExtendsResult.False;
}
function FromNever(left, right) {
  return ExtendsResult.True;
}
function UnwrapTNot(schema) {
  let [current, depth] = [schema, 0];
  while (true) {
    if (!exports_type2.IsNot(current))
      break;
    current = current.not;
    depth += 1;
  }
  return depth % 2 === 0 ? current : Unknown();
}
function FromNot(left, right) {
  return exports_type2.IsNot(left) ? Visit4(UnwrapTNot(left), right) : exports_type2.IsNot(right) ? Visit4(left, UnwrapTNot(right)) : Throw("Invalid fallthrough for Not");
}
function FromNull(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsNull(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromNumberRight(left, right) {
  return exports_type2.IsLiteralNumber(left) ? ExtendsResult.True : exports_type2.IsNumber(left) || exports_type2.IsInteger(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromNumber(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsInteger(right) || exports_type2.IsNumber(right) ? ExtendsResult.True : ExtendsResult.False;
}
function IsObjectPropertyCount(schema, count) {
  return Object.getOwnPropertyNames(schema.properties).length === count;
}
function IsObjectStringLike(schema) {
  return IsObjectArrayLike(schema);
}
function IsObjectSymbolLike(schema) {
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "description" in schema.properties && exports_type2.IsUnion(schema.properties.description) && schema.properties.description.anyOf.length === 2 && (exports_type2.IsString(schema.properties.description.anyOf[0]) && exports_type2.IsUndefined(schema.properties.description.anyOf[1]) || exports_type2.IsString(schema.properties.description.anyOf[1]) && exports_type2.IsUndefined(schema.properties.description.anyOf[0]));
}
function IsObjectNumberLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectBooleanLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectBigIntLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectDateLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectUint8ArrayLike(schema) {
  return IsObjectArrayLike(schema);
}
function IsObjectFunctionLike(schema) {
  const length = Number2();
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit4(schema.properties["length"], length)) === ExtendsResult.True;
}
function IsObjectConstructorLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectArrayLike(schema) {
  const length = Number2();
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit4(schema.properties["length"], length)) === ExtendsResult.True;
}
function IsObjectPromiseLike(schema) {
  const then = Function2([Any()], Any());
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "then" in schema.properties && IntoBooleanResult(Visit4(schema.properties["then"], then)) === ExtendsResult.True;
}
function Property(left, right) {
  return Visit4(left, right) === ExtendsResult.False ? ExtendsResult.False : exports_type2.IsOptional(left) && !exports_type2.IsOptional(right) ? ExtendsResult.False : ExtendsResult.True;
}
function FromObjectRight(left, right) {
  return exports_type2.IsUnknown(left) ? ExtendsResult.False : exports_type2.IsAny(left) ? ExtendsResult.Union : exports_type2.IsNever(left) || exports_type2.IsLiteralString(left) && IsObjectStringLike(right) || exports_type2.IsLiteralNumber(left) && IsObjectNumberLike(right) || exports_type2.IsLiteralBoolean(left) && IsObjectBooleanLike(right) || exports_type2.IsSymbol(left) && IsObjectSymbolLike(right) || exports_type2.IsBigInt(left) && IsObjectBigIntLike(right) || exports_type2.IsString(left) && IsObjectStringLike(right) || exports_type2.IsSymbol(left) && IsObjectSymbolLike(right) || exports_type2.IsNumber(left) && IsObjectNumberLike(right) || exports_type2.IsInteger(left) && IsObjectNumberLike(right) || exports_type2.IsBoolean(left) && IsObjectBooleanLike(right) || exports_type2.IsUint8Array(left) && IsObjectUint8ArrayLike(right) || exports_type2.IsDate(left) && IsObjectDateLike(right) || exports_type2.IsConstructor(left) && IsObjectConstructorLike(right) || exports_type2.IsFunction(left) && IsObjectFunctionLike(right) ? ExtendsResult.True : exports_type2.IsRecord(left) && exports_type2.IsString(RecordKey(left)) ? (() => {
    return right[Hint] === "Record" ? ExtendsResult.True : ExtendsResult.False;
  })() : exports_type2.IsRecord(left) && exports_type2.IsNumber(RecordKey(left)) ? (() => {
    return IsObjectPropertyCount(right, 0) ? ExtendsResult.True : ExtendsResult.False;
  })() : ExtendsResult.False;
}
function FromObject(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : !exports_type2.IsObject(right) ? ExtendsResult.False : (() => {
    for (const key of Object.getOwnPropertyNames(right.properties)) {
      if (!(key in left.properties) && !exports_type2.IsOptional(right.properties[key])) {
        return ExtendsResult.False;
      }
      if (exports_type2.IsOptional(right.properties[key])) {
        return ExtendsResult.True;
      }
      if (Property(left.properties[key], right.properties[key]) === ExtendsResult.False) {
        return ExtendsResult.False;
      }
    }
    return ExtendsResult.True;
  })();
}
function FromPromise(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) && IsObjectPromiseLike(right) ? ExtendsResult.True : !exports_type2.IsPromise(right) ? ExtendsResult.False : IntoBooleanResult(Visit4(left.item, right.item));
}
function RecordKey(schema) {
  return PatternNumberExact in schema.patternProperties ? Number2() : (PatternStringExact in schema.patternProperties) ? String2() : Throw("Unknown record key pattern");
}
function RecordValue(schema) {
  return PatternNumberExact in schema.patternProperties ? schema.patternProperties[PatternNumberExact] : (PatternStringExact in schema.patternProperties) ? schema.patternProperties[PatternStringExact] : Throw("Unable to get record value schema");
}
function FromRecordRight(left, right) {
  const [Key, Value] = [RecordKey(right), RecordValue(right)];
  return exports_type2.IsLiteralString(left) && exports_type2.IsNumber(Key) && IntoBooleanResult(Visit4(left, Value)) === ExtendsResult.True ? ExtendsResult.True : exports_type2.IsUint8Array(left) && exports_type2.IsNumber(Key) ? Visit4(left, Value) : exports_type2.IsString(left) && exports_type2.IsNumber(Key) ? Visit4(left, Value) : exports_type2.IsArray(left) && exports_type2.IsNumber(Key) ? Visit4(left, Value) : exports_type2.IsObject(left) ? (() => {
    for (const key of Object.getOwnPropertyNames(left.properties)) {
      if (Property(Value, left.properties[key]) === ExtendsResult.False) {
        return ExtendsResult.False;
      }
    }
    return ExtendsResult.True;
  })() : ExtendsResult.False;
}
function FromRecord(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : !exports_type2.IsRecord(right) ? ExtendsResult.False : Visit4(RecordValue(left), RecordValue(right));
}
function FromRegExp(left, right) {
  const L = exports_type2.IsRegExp(left) ? String2() : left;
  const R = exports_type2.IsRegExp(right) ? String2() : right;
  return Visit4(L, R);
}
function FromStringRight(left, right) {
  return exports_type2.IsLiteral(left) && exports_value.IsString(left.const) ? ExtendsResult.True : exports_type2.IsString(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromString(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsString(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromSymbol(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsSymbol(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromTemplateLiteral2(left, right) {
  return exports_type2.IsTemplateLiteral(left) ? Visit4(TemplateLiteralToUnion(left), right) : exports_type2.IsTemplateLiteral(right) ? Visit4(left, TemplateLiteralToUnion(right)) : Throw("Invalid fallthrough for TemplateLiteral");
}
function IsArrayOfTuple(left, right) {
  return exports_type2.IsArray(right) && left.items !== undefined && left.items.every((schema) => Visit4(schema, right.items) === ExtendsResult.True);
}
function FromTupleRight(left, right) {
  return exports_type2.IsNever(left) ? ExtendsResult.True : exports_type2.IsUnknown(left) ? ExtendsResult.False : exports_type2.IsAny(left) ? ExtendsResult.Union : ExtendsResult.False;
}
function FromTuple3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) && IsObjectArrayLike(right) ? ExtendsResult.True : exports_type2.IsArray(right) && IsArrayOfTuple(left, right) ? ExtendsResult.True : !exports_type2.IsTuple(right) ? ExtendsResult.False : exports_value.IsUndefined(left.items) && !exports_value.IsUndefined(right.items) || !exports_value.IsUndefined(left.items) && exports_value.IsUndefined(right.items) ? ExtendsResult.False : exports_value.IsUndefined(left.items) && !exports_value.IsUndefined(right.items) ? ExtendsResult.True : left.items.every((schema, index) => Visit4(schema, right.items[index]) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUint8Array(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsUint8Array(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUndefined(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsVoid(right) ? FromVoidRight(left, right) : exports_type2.IsUndefined(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnionRight(left, right) {
  return right.anyOf.some((schema) => Visit4(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnion5(left, right) {
  return left.anyOf.every((schema) => Visit4(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnknownRight(left, right) {
  return ExtendsResult.True;
}
function FromUnknown(left, right) {
  return exports_type2.IsNever(right) ? FromNeverRight(left, right) : exports_type2.IsIntersect(right) ? FromIntersectRight(left, right) : exports_type2.IsUnion(right) ? FromUnionRight(left, right) : exports_type2.IsAny(right) ? FromAnyRight(left, right) : exports_type2.IsString(right) ? FromStringRight(left, right) : exports_type2.IsNumber(right) ? FromNumberRight(left, right) : exports_type2.IsInteger(right) ? FromIntegerRight(left, right) : exports_type2.IsBoolean(right) ? FromBooleanRight(left, right) : exports_type2.IsArray(right) ? FromArrayRight(left, right) : exports_type2.IsTuple(right) ? FromTupleRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsUnknown(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromVoidRight(left, right) {
  return exports_type2.IsUndefined(left) ? ExtendsResult.True : exports_type2.IsUndefined(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromVoid(left, right) {
  return exports_type2.IsIntersect(right) ? FromIntersectRight(left, right) : exports_type2.IsUnion(right) ? FromUnionRight(left, right) : exports_type2.IsUnknown(right) ? FromUnknownRight(left, right) : exports_type2.IsAny(right) ? FromAnyRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsVoid(right) ? ExtendsResult.True : ExtendsResult.False;
}
function Visit4(left, right) {
  return exports_type2.IsTemplateLiteral(left) || exports_type2.IsTemplateLiteral(right) ? FromTemplateLiteral2(left, right) : exports_type2.IsRegExp(left) || exports_type2.IsRegExp(right) ? FromRegExp(left, right) : exports_type2.IsNot(left) || exports_type2.IsNot(right) ? FromNot(left, right) : exports_type2.IsAny(left) ? FromAny(left, right) : exports_type2.IsArray(left) ? FromArray3(left, right) : exports_type2.IsBigInt(left) ? FromBigInt(left, right) : exports_type2.IsBoolean(left) ? FromBoolean(left, right) : exports_type2.IsAsyncIterator(left) ? FromAsyncIterator(left, right) : exports_type2.IsConstructor(left) ? FromConstructor(left, right) : exports_type2.IsDate(left) ? FromDate(left, right) : exports_type2.IsFunction(left) ? FromFunction(left, right) : exports_type2.IsInteger(left) ? FromInteger(left, right) : exports_type2.IsIntersect(left) ? FromIntersect3(left, right) : exports_type2.IsIterator(left) ? FromIterator(left, right) : exports_type2.IsLiteral(left) ? FromLiteral2(left, right) : exports_type2.IsNever(left) ? FromNever(left, right) : exports_type2.IsNull(left) ? FromNull(left, right) : exports_type2.IsNumber(left) ? FromNumber(left, right) : exports_type2.IsObject(left) ? FromObject(left, right) : exports_type2.IsRecord(left) ? FromRecord(left, right) : exports_type2.IsString(left) ? FromString(left, right) : exports_type2.IsSymbol(left) ? FromSymbol(left, right) : exports_type2.IsTuple(left) ? FromTuple3(left, right) : exports_type2.IsPromise(left) ? FromPromise(left, right) : exports_type2.IsUint8Array(left) ? FromUint8Array(left, right) : exports_type2.IsUndefined(left) ? FromUndefined(left, right) : exports_type2.IsUnion(left) ? FromUnion5(left, right) : exports_type2.IsUnknown(left) ? FromUnknown(left, right) : exports_type2.IsVoid(left) ? FromVoid(left, right) : Throw(`Unknown left type operand '${left[Kind]}'`);
}
function ExtendsCheck(left, right) {
  return Visit4(left, right);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extends/extends-from-mapped-result.mjs
function FromProperties7(P, Right, True, False, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Extends(P[K2], Right, True, False, Clone(options));
  return Acc;
}
function FromMappedResult6(Left, Right, True, False, options) {
  return FromProperties7(Left.properties, Right, True, False, options);
}
function ExtendsFromMappedResult(Left, Right, True, False, options) {
  const P = FromMappedResult6(Left, Right, True, False, options);
  return MappedResult(P);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extends/extends.mjs
function ExtendsResolve(left, right, trueType, falseType) {
  const R = ExtendsCheck(left, right);
  return R === ExtendsResult.Union ? Union([trueType, falseType]) : R === ExtendsResult.True ? trueType : falseType;
}
function Extends(L, R, T, F, options) {
  return IsMappedResult(L) ? ExtendsFromMappedResult(L, R, T, F, options) : IsMappedKey(L) ? CreateType(ExtendsFromMappedKey(L, R, T, F, options)) : CreateType(ExtendsResolve(L, R, T, F), options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extends/extends-from-mapped-key.mjs
function FromPropertyKey(K, U, L, R, options) {
  return {
    [K]: Extends(Literal(K), U, L, R, Clone(options))
  };
}
function FromPropertyKeys(K, U, L, R, options) {
  return K.reduce((Acc, LK) => {
    return { ...Acc, ...FromPropertyKey(LK, U, L, R, options) };
  }, {});
}
function FromMappedKey2(K, U, L, R, options) {
  return FromPropertyKeys(K.keys, U, L, R, options);
}
function ExtendsFromMappedKey(T, U, L, R, options) {
  const P = FromMappedKey2(T, U, L, R, options);
  return MappedResult(P);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/check/check.mjs
class ValueCheckUnknownTypeError extends TypeBoxError {
  constructor(schema) {
    super(`Unknown type`);
    this.schema = schema;
  }
}
function IsAnyOrUnknown(schema) {
  return schema[Kind] === "Any" || schema[Kind] === "Unknown";
}
function IsDefined(value) {
  return value !== undefined;
}
function FromAny2(schema, references, value) {
  return true;
}
function FromArgument(schema, references, value) {
  return true;
}
function FromArray4(schema, references, value) {
  if (!IsArray(value))
    return false;
  if (IsDefined(schema.minItems) && !(value.length >= schema.minItems)) {
    return false;
  }
  if (IsDefined(schema.maxItems) && !(value.length <= schema.maxItems)) {
    return false;
  }
  for (const element of value) {
    if (!Visit5(schema.items, references, element))
      return false;
  }
  if (schema.uniqueItems === true && !function() {
    const set = new Set;
    for (const element of value) {
      const hashed = Hash(element);
      if (set.has(hashed)) {
        return false;
      } else {
        set.add(hashed);
      }
    }
    return true;
  }()) {
    return false;
  }
  if (!(IsDefined(schema.contains) || IsNumber(schema.minContains) || IsNumber(schema.maxContains))) {
    return true;
  }
  const containsSchema = IsDefined(schema.contains) ? schema.contains : Never();
  const containsCount = value.reduce((acc, value2) => Visit5(containsSchema, references, value2) ? acc + 1 : acc, 0);
  if (containsCount === 0) {
    return false;
  }
  if (IsNumber(schema.minContains) && containsCount < schema.minContains) {
    return false;
  }
  if (IsNumber(schema.maxContains) && containsCount > schema.maxContains) {
    return false;
  }
  return true;
}
function FromAsyncIterator2(schema, references, value) {
  return IsAsyncIterator(value);
}
function FromBigInt2(schema, references, value) {
  if (!IsBigInt(value))
    return false;
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === BigInt(0))) {
    return false;
  }
  return true;
}
function FromBoolean2(schema, references, value) {
  return IsBoolean(value);
}
function FromConstructor2(schema, references, value) {
  return Visit5(schema.returns, references, value.prototype);
}
function FromDate2(schema, references, value) {
  if (!IsDate(value))
    return false;
  if (IsDefined(schema.exclusiveMaximumTimestamp) && !(value.getTime() < schema.exclusiveMaximumTimestamp)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMinimumTimestamp) && !(value.getTime() > schema.exclusiveMinimumTimestamp)) {
    return false;
  }
  if (IsDefined(schema.maximumTimestamp) && !(value.getTime() <= schema.maximumTimestamp)) {
    return false;
  }
  if (IsDefined(schema.minimumTimestamp) && !(value.getTime() >= schema.minimumTimestamp)) {
    return false;
  }
  if (IsDefined(schema.multipleOfTimestamp) && !(value.getTime() % schema.multipleOfTimestamp === 0)) {
    return false;
  }
  return true;
}
function FromFunction2(schema, references, value) {
  return IsFunction(value);
}
function FromImport(schema, references, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit5(target, [...references, ...definitions], value);
}
function FromInteger2(schema, references, value) {
  if (!IsInteger(value)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    return false;
  }
  return true;
}
function FromIntersect4(schema, references, value) {
  const check1 = schema.allOf.every((schema2) => Visit5(schema2, references, value));
  if (schema.unevaluatedProperties === false) {
    const keyPattern = new RegExp(KeyOfPattern(schema));
    const check2 = Object.getOwnPropertyNames(value).every((key) => keyPattern.test(key));
    return check1 && check2;
  } else if (IsSchema(schema.unevaluatedProperties)) {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    const check2 = Object.getOwnPropertyNames(value).every((key) => keyCheck.test(key) || Visit5(schema.unevaluatedProperties, references, value[key]));
    return check1 && check2;
  } else {
    return check1;
  }
}
function FromIterator2(schema, references, value) {
  return IsIterator(value);
}
function FromLiteral3(schema, references, value) {
  return value === schema.const;
}
function FromNever2(schema, references, value) {
  return false;
}
function FromNot2(schema, references, value) {
  return !Visit5(schema.not, references, value);
}
function FromNull2(schema, references, value) {
  return IsNull(value);
}
function FromNumber2(schema, references, value) {
  if (!TypeSystemPolicy.IsNumberLike(value))
    return false;
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    return false;
  }
  return true;
}
function FromObject2(schema, references, value) {
  if (!TypeSystemPolicy.IsObjectLike(value))
    return false;
  if (IsDefined(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    return false;
  }
  if (IsDefined(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    return false;
  }
  const knownKeys = Object.getOwnPropertyNames(schema.properties);
  for (const knownKey of knownKeys) {
    const property = schema.properties[knownKey];
    if (schema.required && schema.required.includes(knownKey)) {
      if (!Visit5(property, references, value[knownKey])) {
        return false;
      }
      if ((ExtendsUndefinedCheck(property) || IsAnyOrUnknown(property)) && !(knownKey in value)) {
        return false;
      }
    } else {
      if (TypeSystemPolicy.IsExactOptionalProperty(value, knownKey) && !Visit5(property, references, value[knownKey])) {
        return false;
      }
    }
  }
  if (schema.additionalProperties === false) {
    const valueKeys = Object.getOwnPropertyNames(value);
    if (schema.required && schema.required.length === knownKeys.length && valueKeys.length === knownKeys.length) {
      return true;
    } else {
      return valueKeys.every((valueKey) => knownKeys.includes(valueKey));
    }
  } else if (typeof schema.additionalProperties === "object") {
    const valueKeys = Object.getOwnPropertyNames(value);
    return valueKeys.every((key) => knownKeys.includes(key) || Visit5(schema.additionalProperties, references, value[key]));
  } else {
    return true;
  }
}
function FromPromise2(schema, references, value) {
  return IsPromise(value);
}
function FromRecord2(schema, references, value) {
  if (!TypeSystemPolicy.IsRecordLike(value)) {
    return false;
  }
  if (IsDefined(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    return false;
  }
  if (IsDefined(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    return false;
  }
  const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0];
  const regex = new RegExp(patternKey);
  const check1 = Object.entries(value).every(([key, value2]) => {
    return regex.test(key) ? Visit5(patternSchema, references, value2) : true;
  });
  const check2 = typeof schema.additionalProperties === "object" ? Object.entries(value).every(([key, value2]) => {
    return !regex.test(key) ? Visit5(schema.additionalProperties, references, value2) : true;
  }) : true;
  const check3 = schema.additionalProperties === false ? Object.getOwnPropertyNames(value).every((key) => {
    return regex.test(key);
  }) : true;
  return check1 && check2 && check3;
}
function FromRef2(schema, references, value) {
  return Visit5(Deref(schema, references), references, value);
}
function FromRegExp2(schema, references, value) {
  const regex = new RegExp(schema.source, schema.flags);
  if (IsDefined(schema.minLength)) {
    if (!(value.length >= schema.minLength))
      return false;
  }
  if (IsDefined(schema.maxLength)) {
    if (!(value.length <= schema.maxLength))
      return false;
  }
  return regex.test(value);
}
function FromString2(schema, references, value) {
  if (!IsString(value)) {
    return false;
  }
  if (IsDefined(schema.minLength)) {
    if (!(value.length >= schema.minLength))
      return false;
  }
  if (IsDefined(schema.maxLength)) {
    if (!(value.length <= schema.maxLength))
      return false;
  }
  if (IsDefined(schema.pattern)) {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(value))
      return false;
  }
  if (IsDefined(schema.format)) {
    if (!exports_format.Has(schema.format))
      return false;
    const func = exports_format.Get(schema.format);
    return func(value);
  }
  return true;
}
function FromSymbol2(schema, references, value) {
  return IsSymbol(value);
}
function FromTemplateLiteral3(schema, references, value) {
  return IsString(value) && new RegExp(schema.pattern).test(value);
}
function FromThis(schema, references, value) {
  return Visit5(Deref(schema, references), references, value);
}
function FromTuple4(schema, references, value) {
  if (!IsArray(value)) {
    return false;
  }
  if (schema.items === undefined && !(value.length === 0)) {
    return false;
  }
  if (!(value.length === schema.maxItems)) {
    return false;
  }
  if (!schema.items) {
    return true;
  }
  for (let i = 0;i < schema.items.length; i++) {
    if (!Visit5(schema.items[i], references, value[i]))
      return false;
  }
  return true;
}
function FromUndefined2(schema, references, value) {
  return IsUndefined(value);
}
function FromUnion6(schema, references, value) {
  return schema.anyOf.some((inner) => Visit5(inner, references, value));
}
function FromUint8Array2(schema, references, value) {
  if (!IsUint8Array(value)) {
    return false;
  }
  if (IsDefined(schema.maxByteLength) && !(value.length <= schema.maxByteLength)) {
    return false;
  }
  if (IsDefined(schema.minByteLength) && !(value.length >= schema.minByteLength)) {
    return false;
  }
  return true;
}
function FromUnknown2(schema, references, value) {
  return true;
}
function FromVoid2(schema, references, value) {
  return TypeSystemPolicy.IsVoidLike(value);
}
function FromKind(schema, references, value) {
  if (!exports_type.Has(schema[Kind]))
    return false;
  const func = exports_type.Get(schema[Kind]);
  return func(schema, value);
}
function Visit5(schema, references, value) {
  const references_ = IsDefined(schema.$id) ? Pushref(schema, references) : references;
  const schema_ = schema;
  switch (schema_[Kind]) {
    case "Any":
      return FromAny2(schema_, references_, value);
    case "Argument":
      return FromArgument(schema_, references_, value);
    case "Array":
      return FromArray4(schema_, references_, value);
    case "AsyncIterator":
      return FromAsyncIterator2(schema_, references_, value);
    case "BigInt":
      return FromBigInt2(schema_, references_, value);
    case "Boolean":
      return FromBoolean2(schema_, references_, value);
    case "Constructor":
      return FromConstructor2(schema_, references_, value);
    case "Date":
      return FromDate2(schema_, references_, value);
    case "Function":
      return FromFunction2(schema_, references_, value);
    case "Import":
      return FromImport(schema_, references_, value);
    case "Integer":
      return FromInteger2(schema_, references_, value);
    case "Intersect":
      return FromIntersect4(schema_, references_, value);
    case "Iterator":
      return FromIterator2(schema_, references_, value);
    case "Literal":
      return FromLiteral3(schema_, references_, value);
    case "Never":
      return FromNever2(schema_, references_, value);
    case "Not":
      return FromNot2(schema_, references_, value);
    case "Null":
      return FromNull2(schema_, references_, value);
    case "Number":
      return FromNumber2(schema_, references_, value);
    case "Object":
      return FromObject2(schema_, references_, value);
    case "Promise":
      return FromPromise2(schema_, references_, value);
    case "Record":
      return FromRecord2(schema_, references_, value);
    case "Ref":
      return FromRef2(schema_, references_, value);
    case "RegExp":
      return FromRegExp2(schema_, references_, value);
    case "String":
      return FromString2(schema_, references_, value);
    case "Symbol":
      return FromSymbol2(schema_, references_, value);
    case "TemplateLiteral":
      return FromTemplateLiteral3(schema_, references_, value);
    case "This":
      return FromThis(schema_, references_, value);
    case "Tuple":
      return FromTuple4(schema_, references_, value);
    case "Undefined":
      return FromUndefined2(schema_, references_, value);
    case "Union":
      return FromUnion6(schema_, references_, value);
    case "Uint8Array":
      return FromUint8Array2(schema_, references_, value);
    case "Unknown":
      return FromUnknown2(schema_, references_, value);
    case "Void":
      return FromVoid2(schema_, references_, value);
    default:
      if (!exports_type.Has(schema_[Kind]))
        throw new ValueCheckUnknownTypeError(schema_);
      return FromKind(schema_, references_, value);
  }
}
function Check(...args) {
  return args.length === 3 ? Visit5(args[0], args[1], args[2]) : Visit5(args[0], [], args[1]);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/errors/errors.mjs
var ValueErrorType;
(function(ValueErrorType2) {
  ValueErrorType2[ValueErrorType2["ArrayContains"] = 0] = "ArrayContains";
  ValueErrorType2[ValueErrorType2["ArrayMaxContains"] = 1] = "ArrayMaxContains";
  ValueErrorType2[ValueErrorType2["ArrayMaxItems"] = 2] = "ArrayMaxItems";
  ValueErrorType2[ValueErrorType2["ArrayMinContains"] = 3] = "ArrayMinContains";
  ValueErrorType2[ValueErrorType2["ArrayMinItems"] = 4] = "ArrayMinItems";
  ValueErrorType2[ValueErrorType2["ArrayUniqueItems"] = 5] = "ArrayUniqueItems";
  ValueErrorType2[ValueErrorType2["Array"] = 6] = "Array";
  ValueErrorType2[ValueErrorType2["AsyncIterator"] = 7] = "AsyncIterator";
  ValueErrorType2[ValueErrorType2["BigIntExclusiveMaximum"] = 8] = "BigIntExclusiveMaximum";
  ValueErrorType2[ValueErrorType2["BigIntExclusiveMinimum"] = 9] = "BigIntExclusiveMinimum";
  ValueErrorType2[ValueErrorType2["BigIntMaximum"] = 10] = "BigIntMaximum";
  ValueErrorType2[ValueErrorType2["BigIntMinimum"] = 11] = "BigIntMinimum";
  ValueErrorType2[ValueErrorType2["BigIntMultipleOf"] = 12] = "BigIntMultipleOf";
  ValueErrorType2[ValueErrorType2["BigInt"] = 13] = "BigInt";
  ValueErrorType2[ValueErrorType2["Boolean"] = 14] = "Boolean";
  ValueErrorType2[ValueErrorType2["DateExclusiveMaximumTimestamp"] = 15] = "DateExclusiveMaximumTimestamp";
  ValueErrorType2[ValueErrorType2["DateExclusiveMinimumTimestamp"] = 16] = "DateExclusiveMinimumTimestamp";
  ValueErrorType2[ValueErrorType2["DateMaximumTimestamp"] = 17] = "DateMaximumTimestamp";
  ValueErrorType2[ValueErrorType2["DateMinimumTimestamp"] = 18] = "DateMinimumTimestamp";
  ValueErrorType2[ValueErrorType2["DateMultipleOfTimestamp"] = 19] = "DateMultipleOfTimestamp";
  ValueErrorType2[ValueErrorType2["Date"] = 20] = "Date";
  ValueErrorType2[ValueErrorType2["Function"] = 21] = "Function";
  ValueErrorType2[ValueErrorType2["IntegerExclusiveMaximum"] = 22] = "IntegerExclusiveMaximum";
  ValueErrorType2[ValueErrorType2["IntegerExclusiveMinimum"] = 23] = "IntegerExclusiveMinimum";
  ValueErrorType2[ValueErrorType2["IntegerMaximum"] = 24] = "IntegerMaximum";
  ValueErrorType2[ValueErrorType2["IntegerMinimum"] = 25] = "IntegerMinimum";
  ValueErrorType2[ValueErrorType2["IntegerMultipleOf"] = 26] = "IntegerMultipleOf";
  ValueErrorType2[ValueErrorType2["Integer"] = 27] = "Integer";
  ValueErrorType2[ValueErrorType2["IntersectUnevaluatedProperties"] = 28] = "IntersectUnevaluatedProperties";
  ValueErrorType2[ValueErrorType2["Intersect"] = 29] = "Intersect";
  ValueErrorType2[ValueErrorType2["Iterator"] = 30] = "Iterator";
  ValueErrorType2[ValueErrorType2["Kind"] = 31] = "Kind";
  ValueErrorType2[ValueErrorType2["Literal"] = 32] = "Literal";
  ValueErrorType2[ValueErrorType2["Never"] = 33] = "Never";
  ValueErrorType2[ValueErrorType2["Not"] = 34] = "Not";
  ValueErrorType2[ValueErrorType2["Null"] = 35] = "Null";
  ValueErrorType2[ValueErrorType2["NumberExclusiveMaximum"] = 36] = "NumberExclusiveMaximum";
  ValueErrorType2[ValueErrorType2["NumberExclusiveMinimum"] = 37] = "NumberExclusiveMinimum";
  ValueErrorType2[ValueErrorType2["NumberMaximum"] = 38] = "NumberMaximum";
  ValueErrorType2[ValueErrorType2["NumberMinimum"] = 39] = "NumberMinimum";
  ValueErrorType2[ValueErrorType2["NumberMultipleOf"] = 40] = "NumberMultipleOf";
  ValueErrorType2[ValueErrorType2["Number"] = 41] = "Number";
  ValueErrorType2[ValueErrorType2["ObjectAdditionalProperties"] = 42] = "ObjectAdditionalProperties";
  ValueErrorType2[ValueErrorType2["ObjectMaxProperties"] = 43] = "ObjectMaxProperties";
  ValueErrorType2[ValueErrorType2["ObjectMinProperties"] = 44] = "ObjectMinProperties";
  ValueErrorType2[ValueErrorType2["ObjectRequiredProperty"] = 45] = "ObjectRequiredProperty";
  ValueErrorType2[ValueErrorType2["Object"] = 46] = "Object";
  ValueErrorType2[ValueErrorType2["Promise"] = 47] = "Promise";
  ValueErrorType2[ValueErrorType2["RegExp"] = 48] = "RegExp";
  ValueErrorType2[ValueErrorType2["StringFormatUnknown"] = 49] = "StringFormatUnknown";
  ValueErrorType2[ValueErrorType2["StringFormat"] = 50] = "StringFormat";
  ValueErrorType2[ValueErrorType2["StringMaxLength"] = 51] = "StringMaxLength";
  ValueErrorType2[ValueErrorType2["StringMinLength"] = 52] = "StringMinLength";
  ValueErrorType2[ValueErrorType2["StringPattern"] = 53] = "StringPattern";
  ValueErrorType2[ValueErrorType2["String"] = 54] = "String";
  ValueErrorType2[ValueErrorType2["Symbol"] = 55] = "Symbol";
  ValueErrorType2[ValueErrorType2["TupleLength"] = 56] = "TupleLength";
  ValueErrorType2[ValueErrorType2["Tuple"] = 57] = "Tuple";
  ValueErrorType2[ValueErrorType2["Uint8ArrayMaxByteLength"] = 58] = "Uint8ArrayMaxByteLength";
  ValueErrorType2[ValueErrorType2["Uint8ArrayMinByteLength"] = 59] = "Uint8ArrayMinByteLength";
  ValueErrorType2[ValueErrorType2["Uint8Array"] = 60] = "Uint8Array";
  ValueErrorType2[ValueErrorType2["Undefined"] = 61] = "Undefined";
  ValueErrorType2[ValueErrorType2["Union"] = 62] = "Union";
  ValueErrorType2[ValueErrorType2["Void"] = 63] = "Void";
})(ValueErrorType || (ValueErrorType = {}));

class ValueErrorsUnknownTypeError extends TypeBoxError {
  constructor(schema) {
    super("Unknown type");
    this.schema = schema;
  }
}
function EscapeKey(key) {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}
function IsDefined2(value) {
  return value !== undefined;
}

class ValueErrorIterator {
  constructor(iterator) {
    this.iterator = iterator;
  }
  [Symbol.iterator]() {
    return this.iterator;
  }
  First() {
    const next = this.iterator.next();
    return next.done ? undefined : next.value;
  }
}
function Create(errorType, schema, path, value, errors = []) {
  return {
    type: errorType,
    schema,
    path,
    value,
    message: GetErrorFunction()({ errorType, path, schema, value, errors }),
    errors
  };
}
function* FromAny3(schema, references, path, value) {}
function* FromArgument2(schema, references, path, value) {}
function* FromArray5(schema, references, path, value) {
  if (!IsArray(value)) {
    return yield Create(ValueErrorType.Array, schema, path, value);
  }
  if (IsDefined2(schema.minItems) && !(value.length >= schema.minItems)) {
    yield Create(ValueErrorType.ArrayMinItems, schema, path, value);
  }
  if (IsDefined2(schema.maxItems) && !(value.length <= schema.maxItems)) {
    yield Create(ValueErrorType.ArrayMaxItems, schema, path, value);
  }
  for (let i = 0;i < value.length; i++) {
    yield* Visit6(schema.items, references, `${path}/${i}`, value[i]);
  }
  if (schema.uniqueItems === true && !function() {
    const set = new Set;
    for (const element of value) {
      const hashed = Hash(element);
      if (set.has(hashed)) {
        return false;
      } else {
        set.add(hashed);
      }
    }
    return true;
  }()) {
    yield Create(ValueErrorType.ArrayUniqueItems, schema, path, value);
  }
  if (!(IsDefined2(schema.contains) || IsDefined2(schema.minContains) || IsDefined2(schema.maxContains))) {
    return;
  }
  const containsSchema = IsDefined2(schema.contains) ? schema.contains : Never();
  const containsCount = value.reduce((acc, value2, index) => Visit6(containsSchema, references, `${path}${index}`, value2).next().done === true ? acc + 1 : acc, 0);
  if (containsCount === 0) {
    yield Create(ValueErrorType.ArrayContains, schema, path, value);
  }
  if (IsNumber(schema.minContains) && containsCount < schema.minContains) {
    yield Create(ValueErrorType.ArrayMinContains, schema, path, value);
  }
  if (IsNumber(schema.maxContains) && containsCount > schema.maxContains) {
    yield Create(ValueErrorType.ArrayMaxContains, schema, path, value);
  }
}
function* FromAsyncIterator3(schema, references, path, value) {
  if (!IsAsyncIterator(value))
    yield Create(ValueErrorType.AsyncIterator, schema, path, value);
}
function* FromBigInt3(schema, references, path, value) {
  if (!IsBigInt(value))
    return yield Create(ValueErrorType.BigInt, schema, path, value);
  if (IsDefined2(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create(ValueErrorType.BigIntExclusiveMaximum, schema, path, value);
  }
  if (IsDefined2(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create(ValueErrorType.BigIntExclusiveMinimum, schema, path, value);
  }
  if (IsDefined2(schema.maximum) && !(value <= schema.maximum)) {
    yield Create(ValueErrorType.BigIntMaximum, schema, path, value);
  }
  if (IsDefined2(schema.minimum) && !(value >= schema.minimum)) {
    yield Create(ValueErrorType.BigIntMinimum, schema, path, value);
  }
  if (IsDefined2(schema.multipleOf) && !(value % schema.multipleOf === BigInt(0))) {
    yield Create(ValueErrorType.BigIntMultipleOf, schema, path, value);
  }
}
function* FromBoolean3(schema, references, path, value) {
  if (!IsBoolean(value))
    yield Create(ValueErrorType.Boolean, schema, path, value);
}
function* FromConstructor3(schema, references, path, value) {
  yield* Visit6(schema.returns, references, path, value.prototype);
}
function* FromDate3(schema, references, path, value) {
  if (!IsDate(value))
    return yield Create(ValueErrorType.Date, schema, path, value);
  if (IsDefined2(schema.exclusiveMaximumTimestamp) && !(value.getTime() < schema.exclusiveMaximumTimestamp)) {
    yield Create(ValueErrorType.DateExclusiveMaximumTimestamp, schema, path, value);
  }
  if (IsDefined2(schema.exclusiveMinimumTimestamp) && !(value.getTime() > schema.exclusiveMinimumTimestamp)) {
    yield Create(ValueErrorType.DateExclusiveMinimumTimestamp, schema, path, value);
  }
  if (IsDefined2(schema.maximumTimestamp) && !(value.getTime() <= schema.maximumTimestamp)) {
    yield Create(ValueErrorType.DateMaximumTimestamp, schema, path, value);
  }
  if (IsDefined2(schema.minimumTimestamp) && !(value.getTime() >= schema.minimumTimestamp)) {
    yield Create(ValueErrorType.DateMinimumTimestamp, schema, path, value);
  }
  if (IsDefined2(schema.multipleOfTimestamp) && !(value.getTime() % schema.multipleOfTimestamp === 0)) {
    yield Create(ValueErrorType.DateMultipleOfTimestamp, schema, path, value);
  }
}
function* FromFunction3(schema, references, path, value) {
  if (!IsFunction(value))
    yield Create(ValueErrorType.Function, schema, path, value);
}
function* FromImport2(schema, references, path, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  yield* Visit6(target, [...references, ...definitions], path, value);
}
function* FromInteger3(schema, references, path, value) {
  if (!IsInteger(value))
    return yield Create(ValueErrorType.Integer, schema, path, value);
  if (IsDefined2(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create(ValueErrorType.IntegerExclusiveMaximum, schema, path, value);
  }
  if (IsDefined2(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create(ValueErrorType.IntegerExclusiveMinimum, schema, path, value);
  }
  if (IsDefined2(schema.maximum) && !(value <= schema.maximum)) {
    yield Create(ValueErrorType.IntegerMaximum, schema, path, value);
  }
  if (IsDefined2(schema.minimum) && !(value >= schema.minimum)) {
    yield Create(ValueErrorType.IntegerMinimum, schema, path, value);
  }
  if (IsDefined2(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    yield Create(ValueErrorType.IntegerMultipleOf, schema, path, value);
  }
}
function* FromIntersect5(schema, references, path, value) {
  let hasError = false;
  for (const inner of schema.allOf) {
    for (const error of Visit6(inner, references, path, value)) {
      hasError = true;
      yield error;
    }
  }
  if (hasError) {
    return yield Create(ValueErrorType.Intersect, schema, path, value);
  }
  if (schema.unevaluatedProperties === false) {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    for (const valueKey of Object.getOwnPropertyNames(value)) {
      if (!keyCheck.test(valueKey)) {
        yield Create(ValueErrorType.IntersectUnevaluatedProperties, schema, `${path}/${valueKey}`, value);
      }
    }
  }
  if (typeof schema.unevaluatedProperties === "object") {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    for (const valueKey of Object.getOwnPropertyNames(value)) {
      if (!keyCheck.test(valueKey)) {
        const next = Visit6(schema.unevaluatedProperties, references, `${path}/${valueKey}`, value[valueKey]).next();
        if (!next.done)
          yield next.value;
      }
    }
  }
}
function* FromIterator3(schema, references, path, value) {
  if (!IsIterator(value))
    yield Create(ValueErrorType.Iterator, schema, path, value);
}
function* FromLiteral4(schema, references, path, value) {
  if (!(value === schema.const))
    yield Create(ValueErrorType.Literal, schema, path, value);
}
function* FromNever3(schema, references, path, value) {
  yield Create(ValueErrorType.Never, schema, path, value);
}
function* FromNot3(schema, references, path, value) {
  if (Visit6(schema.not, references, path, value).next().done === true)
    yield Create(ValueErrorType.Not, schema, path, value);
}
function* FromNull3(schema, references, path, value) {
  if (!IsNull(value))
    yield Create(ValueErrorType.Null, schema, path, value);
}
function* FromNumber3(schema, references, path, value) {
  if (!TypeSystemPolicy.IsNumberLike(value))
    return yield Create(ValueErrorType.Number, schema, path, value);
  if (IsDefined2(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create(ValueErrorType.NumberExclusiveMaximum, schema, path, value);
  }
  if (IsDefined2(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create(ValueErrorType.NumberExclusiveMinimum, schema, path, value);
  }
  if (IsDefined2(schema.maximum) && !(value <= schema.maximum)) {
    yield Create(ValueErrorType.NumberMaximum, schema, path, value);
  }
  if (IsDefined2(schema.minimum) && !(value >= schema.minimum)) {
    yield Create(ValueErrorType.NumberMinimum, schema, path, value);
  }
  if (IsDefined2(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    yield Create(ValueErrorType.NumberMultipleOf, schema, path, value);
  }
}
function* FromObject3(schema, references, path, value) {
  if (!TypeSystemPolicy.IsObjectLike(value))
    return yield Create(ValueErrorType.Object, schema, path, value);
  if (IsDefined2(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    yield Create(ValueErrorType.ObjectMinProperties, schema, path, value);
  }
  if (IsDefined2(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    yield Create(ValueErrorType.ObjectMaxProperties, schema, path, value);
  }
  const requiredKeys = Array.isArray(schema.required) ? schema.required : [];
  const knownKeys = Object.getOwnPropertyNames(schema.properties);
  const unknownKeys = Object.getOwnPropertyNames(value);
  for (const requiredKey of requiredKeys) {
    if (unknownKeys.includes(requiredKey))
      continue;
    yield Create(ValueErrorType.ObjectRequiredProperty, schema.properties[requiredKey], `${path}/${EscapeKey(requiredKey)}`, undefined);
  }
  if (schema.additionalProperties === false) {
    for (const valueKey of unknownKeys) {
      if (!knownKeys.includes(valueKey)) {
        yield Create(ValueErrorType.ObjectAdditionalProperties, schema, `${path}/${EscapeKey(valueKey)}`, value[valueKey]);
      }
    }
  }
  if (typeof schema.additionalProperties === "object") {
    for (const valueKey of unknownKeys) {
      if (knownKeys.includes(valueKey))
        continue;
      yield* Visit6(schema.additionalProperties, references, `${path}/${EscapeKey(valueKey)}`, value[valueKey]);
    }
  }
  for (const knownKey of knownKeys) {
    const property = schema.properties[knownKey];
    if (schema.required && schema.required.includes(knownKey)) {
      yield* Visit6(property, references, `${path}/${EscapeKey(knownKey)}`, value[knownKey]);
      if (ExtendsUndefinedCheck(schema) && !(knownKey in value)) {
        yield Create(ValueErrorType.ObjectRequiredProperty, property, `${path}/${EscapeKey(knownKey)}`, undefined);
      }
    } else {
      if (TypeSystemPolicy.IsExactOptionalProperty(value, knownKey)) {
        yield* Visit6(property, references, `${path}/${EscapeKey(knownKey)}`, value[knownKey]);
      }
    }
  }
}
function* FromPromise3(schema, references, path, value) {
  if (!IsPromise(value))
    yield Create(ValueErrorType.Promise, schema, path, value);
}
function* FromRecord3(schema, references, path, value) {
  if (!TypeSystemPolicy.IsRecordLike(value))
    return yield Create(ValueErrorType.Object, schema, path, value);
  if (IsDefined2(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    yield Create(ValueErrorType.ObjectMinProperties, schema, path, value);
  }
  if (IsDefined2(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    yield Create(ValueErrorType.ObjectMaxProperties, schema, path, value);
  }
  const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0];
  const regex = new RegExp(patternKey);
  for (const [propertyKey, propertyValue] of Object.entries(value)) {
    if (regex.test(propertyKey))
      yield* Visit6(patternSchema, references, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
  }
  if (typeof schema.additionalProperties === "object") {
    for (const [propertyKey, propertyValue] of Object.entries(value)) {
      if (!regex.test(propertyKey))
        yield* Visit6(schema.additionalProperties, references, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
    }
  }
  if (schema.additionalProperties === false) {
    for (const [propertyKey, propertyValue] of Object.entries(value)) {
      if (regex.test(propertyKey))
        continue;
      return yield Create(ValueErrorType.ObjectAdditionalProperties, schema, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
    }
  }
}
function* FromRef3(schema, references, path, value) {
  yield* Visit6(Deref(schema, references), references, path, value);
}
function* FromRegExp3(schema, references, path, value) {
  if (!IsString(value))
    return yield Create(ValueErrorType.String, schema, path, value);
  if (IsDefined2(schema.minLength) && !(value.length >= schema.minLength)) {
    yield Create(ValueErrorType.StringMinLength, schema, path, value);
  }
  if (IsDefined2(schema.maxLength) && !(value.length <= schema.maxLength)) {
    yield Create(ValueErrorType.StringMaxLength, schema, path, value);
  }
  const regex = new RegExp(schema.source, schema.flags);
  if (!regex.test(value)) {
    return yield Create(ValueErrorType.RegExp, schema, path, value);
  }
}
function* FromString3(schema, references, path, value) {
  if (!IsString(value))
    return yield Create(ValueErrorType.String, schema, path, value);
  if (IsDefined2(schema.minLength) && !(value.length >= schema.minLength)) {
    yield Create(ValueErrorType.StringMinLength, schema, path, value);
  }
  if (IsDefined2(schema.maxLength) && !(value.length <= schema.maxLength)) {
    yield Create(ValueErrorType.StringMaxLength, schema, path, value);
  }
  if (IsString(schema.pattern)) {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(value)) {
      yield Create(ValueErrorType.StringPattern, schema, path, value);
    }
  }
  if (IsString(schema.format)) {
    if (!exports_format.Has(schema.format)) {
      yield Create(ValueErrorType.StringFormatUnknown, schema, path, value);
    } else {
      const format = exports_format.Get(schema.format);
      if (!format(value)) {
        yield Create(ValueErrorType.StringFormat, schema, path, value);
      }
    }
  }
}
function* FromSymbol3(schema, references, path, value) {
  if (!IsSymbol(value))
    yield Create(ValueErrorType.Symbol, schema, path, value);
}
function* FromTemplateLiteral4(schema, references, path, value) {
  if (!IsString(value))
    return yield Create(ValueErrorType.String, schema, path, value);
  const regex = new RegExp(schema.pattern);
  if (!regex.test(value)) {
    yield Create(ValueErrorType.StringPattern, schema, path, value);
  }
}
function* FromThis2(schema, references, path, value) {
  yield* Visit6(Deref(schema, references), references, path, value);
}
function* FromTuple5(schema, references, path, value) {
  if (!IsArray(value))
    return yield Create(ValueErrorType.Tuple, schema, path, value);
  if (schema.items === undefined && !(value.length === 0)) {
    return yield Create(ValueErrorType.TupleLength, schema, path, value);
  }
  if (!(value.length === schema.maxItems)) {
    return yield Create(ValueErrorType.TupleLength, schema, path, value);
  }
  if (!schema.items) {
    return;
  }
  for (let i = 0;i < schema.items.length; i++) {
    yield* Visit6(schema.items[i], references, `${path}/${i}`, value[i]);
  }
}
function* FromUndefined3(schema, references, path, value) {
  if (!IsUndefined(value))
    yield Create(ValueErrorType.Undefined, schema, path, value);
}
function* FromUnion7(schema, references, path, value) {
  if (Check(schema, references, value))
    return;
  const errors = schema.anyOf.map((variant) => new ValueErrorIterator(Visit6(variant, references, path, value)));
  yield Create(ValueErrorType.Union, schema, path, value, errors);
}
function* FromUint8Array3(schema, references, path, value) {
  if (!IsUint8Array(value))
    return yield Create(ValueErrorType.Uint8Array, schema, path, value);
  if (IsDefined2(schema.maxByteLength) && !(value.length <= schema.maxByteLength)) {
    yield Create(ValueErrorType.Uint8ArrayMaxByteLength, schema, path, value);
  }
  if (IsDefined2(schema.minByteLength) && !(value.length >= schema.minByteLength)) {
    yield Create(ValueErrorType.Uint8ArrayMinByteLength, schema, path, value);
  }
}
function* FromUnknown3(schema, references, path, value) {}
function* FromVoid3(schema, references, path, value) {
  if (!TypeSystemPolicy.IsVoidLike(value))
    yield Create(ValueErrorType.Void, schema, path, value);
}
function* FromKind2(schema, references, path, value) {
  const check = exports_type.Get(schema[Kind]);
  if (!check(schema, value))
    yield Create(ValueErrorType.Kind, schema, path, value);
}
function* Visit6(schema, references, path, value) {
  const references_ = IsDefined2(schema.$id) ? [...references, schema] : references;
  const schema_ = schema;
  switch (schema_[Kind]) {
    case "Any":
      return yield* FromAny3(schema_, references_, path, value);
    case "Argument":
      return yield* FromArgument2(schema_, references_, path, value);
    case "Array":
      return yield* FromArray5(schema_, references_, path, value);
    case "AsyncIterator":
      return yield* FromAsyncIterator3(schema_, references_, path, value);
    case "BigInt":
      return yield* FromBigInt3(schema_, references_, path, value);
    case "Boolean":
      return yield* FromBoolean3(schema_, references_, path, value);
    case "Constructor":
      return yield* FromConstructor3(schema_, references_, path, value);
    case "Date":
      return yield* FromDate3(schema_, references_, path, value);
    case "Function":
      return yield* FromFunction3(schema_, references_, path, value);
    case "Import":
      return yield* FromImport2(schema_, references_, path, value);
    case "Integer":
      return yield* FromInteger3(schema_, references_, path, value);
    case "Intersect":
      return yield* FromIntersect5(schema_, references_, path, value);
    case "Iterator":
      return yield* FromIterator3(schema_, references_, path, value);
    case "Literal":
      return yield* FromLiteral4(schema_, references_, path, value);
    case "Never":
      return yield* FromNever3(schema_, references_, path, value);
    case "Not":
      return yield* FromNot3(schema_, references_, path, value);
    case "Null":
      return yield* FromNull3(schema_, references_, path, value);
    case "Number":
      return yield* FromNumber3(schema_, references_, path, value);
    case "Object":
      return yield* FromObject3(schema_, references_, path, value);
    case "Promise":
      return yield* FromPromise3(schema_, references_, path, value);
    case "Record":
      return yield* FromRecord3(schema_, references_, path, value);
    case "Ref":
      return yield* FromRef3(schema_, references_, path, value);
    case "RegExp":
      return yield* FromRegExp3(schema_, references_, path, value);
    case "String":
      return yield* FromString3(schema_, references_, path, value);
    case "Symbol":
      return yield* FromSymbol3(schema_, references_, path, value);
    case "TemplateLiteral":
      return yield* FromTemplateLiteral4(schema_, references_, path, value);
    case "This":
      return yield* FromThis2(schema_, references_, path, value);
    case "Tuple":
      return yield* FromTuple5(schema_, references_, path, value);
    case "Undefined":
      return yield* FromUndefined3(schema_, references_, path, value);
    case "Union":
      return yield* FromUnion7(schema_, references_, path, value);
    case "Uint8Array":
      return yield* FromUint8Array3(schema_, references_, path, value);
    case "Unknown":
      return yield* FromUnknown3(schema_, references_, path, value);
    case "Void":
      return yield* FromVoid3(schema_, references_, path, value);
    default:
      if (!exports_type.Has(schema_[Kind]))
        throw new ValueErrorsUnknownTypeError(schema);
      return yield* FromKind2(schema_, references_, path, value);
  }
}
function Errors(...args) {
  const iterator = args.length === 3 ? Visit6(args[0], args[1], "", args[2]) : Visit6(args[0], [], "", args[1]);
  return new ValueErrorIterator(iterator);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/transform/decode.mjs
class TransformDecodeCheckError extends TypeBoxError {
  constructor(schema, value, error) {
    super(`Unable to decode value as it does not match the expected schema`);
    this.schema = schema;
    this.value = value;
    this.error = error;
  }
}

class TransformDecodeError extends TypeBoxError {
  constructor(schema, path, value, error) {
    super(error instanceof Error ? error.message : "Unknown error");
    this.schema = schema;
    this.path = path;
    this.value = value;
    this.error = error;
  }
}
function Default(schema, path, value) {
  try {
    return IsTransform(schema) ? schema[TransformKind].Decode(value) : value;
  } catch (error) {
    throw new TransformDecodeError(schema, path, value, error);
  }
}
function FromArray6(schema, references, path, value) {
  return IsArray(value) ? Default(schema, path, value.map((value2, index) => Visit7(schema.items, references, `${path}/${index}`, value2))) : Default(schema, path, value);
}
function FromIntersect6(schema, references, path, value) {
  if (!IsObject(value) || IsValueType(value))
    return Default(schema, path, value);
  const knownEntries = KeyOfPropertyEntries(schema);
  const knownKeys = knownEntries.map((entry) => entry[0]);
  const knownProperties = { ...value };
  for (const [knownKey, knownSchema] of knownEntries)
    if (knownKey in knownProperties) {
      knownProperties[knownKey] = Visit7(knownSchema, references, `${path}/${knownKey}`, knownProperties[knownKey]);
    }
  if (!IsTransform(schema.unevaluatedProperties)) {
    return Default(schema, path, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const unevaluatedProperties = schema.unevaluatedProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      unknownProperties[key] = Default(unevaluatedProperties, `${path}/${key}`, unknownProperties[key]);
    }
  return Default(schema, path, unknownProperties);
}
function FromImport3(schema, references, path, value) {
  const additional = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  const result = Visit7(target, [...references, ...additional], path, value);
  return Default(schema, path, result);
}
function FromNot4(schema, references, path, value) {
  return Default(schema, path, Visit7(schema.not, references, path, value));
}
function FromObject4(schema, references, path, value) {
  if (!IsObject(value))
    return Default(schema, path, value);
  const knownKeys = KeyOfPropertyKeys(schema);
  const knownProperties = { ...value };
  for (const key of knownKeys) {
    if (!HasPropertyKey(knownProperties, key))
      continue;
    if (IsUndefined(knownProperties[key]) && (!IsUndefined3(schema.properties[key]) || TypeSystemPolicy.IsExactOptionalProperty(knownProperties, key)))
      continue;
    knownProperties[key] = Visit7(schema.properties[key], references, `${path}/${key}`, knownProperties[key]);
  }
  if (!IsSchema(schema.additionalProperties)) {
    return Default(schema, path, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      unknownProperties[key] = Default(additionalProperties, `${path}/${key}`, unknownProperties[key]);
    }
  return Default(schema, path, unknownProperties);
}
function FromRecord4(schema, references, path, value) {
  if (!IsObject(value))
    return Default(schema, path, value);
  const pattern = Object.getOwnPropertyNames(schema.patternProperties)[0];
  const knownKeys = new RegExp(pattern);
  const knownProperties = { ...value };
  for (const key of Object.getOwnPropertyNames(value))
    if (knownKeys.test(key)) {
      knownProperties[key] = Visit7(schema.patternProperties[pattern], references, `${path}/${key}`, knownProperties[key]);
    }
  if (!IsSchema(schema.additionalProperties)) {
    return Default(schema, path, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.test(key)) {
      unknownProperties[key] = Default(additionalProperties, `${path}/${key}`, unknownProperties[key]);
    }
  return Default(schema, path, unknownProperties);
}
function FromRef4(schema, references, path, value) {
  const target = Deref(schema, references);
  return Default(schema, path, Visit7(target, references, path, value));
}
function FromThis3(schema, references, path, value) {
  const target = Deref(schema, references);
  return Default(schema, path, Visit7(target, references, path, value));
}
function FromTuple6(schema, references, path, value) {
  return IsArray(value) && IsArray(schema.items) ? Default(schema, path, schema.items.map((schema2, index) => Visit7(schema2, references, `${path}/${index}`, value[index]))) : Default(schema, path, value);
}
function FromUnion8(schema, references, path, value) {
  for (const subschema of schema.anyOf) {
    if (!Check(subschema, references, value))
      continue;
    const decoded = Visit7(subschema, references, path, value);
    return Default(schema, path, decoded);
  }
  return Default(schema, path, value);
}
function Visit7(schema, references, path, value) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema[Kind]) {
    case "Array":
      return FromArray6(schema_, references_, path, value);
    case "Import":
      return FromImport3(schema_, references_, path, value);
    case "Intersect":
      return FromIntersect6(schema_, references_, path, value);
    case "Not":
      return FromNot4(schema_, references_, path, value);
    case "Object":
      return FromObject4(schema_, references_, path, value);
    case "Record":
      return FromRecord4(schema_, references_, path, value);
    case "Ref":
      return FromRef4(schema_, references_, path, value);
    case "Symbol":
      return Default(schema_, path, value);
    case "This":
      return FromThis3(schema_, references_, path, value);
    case "Tuple":
      return FromTuple6(schema_, references_, path, value);
    case "Union":
      return FromUnion8(schema_, references_, path, value);
    default:
      return Default(schema_, path, value);
  }
}
function TransformDecode(schema, references, value) {
  return Visit7(schema, references, "", value);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/transform/encode.mjs
class TransformEncodeCheckError extends TypeBoxError {
  constructor(schema, value, error) {
    super(`The encoded value does not match the expected schema`);
    this.schema = schema;
    this.value = value;
    this.error = error;
  }
}

class TransformEncodeError extends TypeBoxError {
  constructor(schema, path, value, error) {
    super(`${error instanceof Error ? error.message : "Unknown error"}`);
    this.schema = schema;
    this.path = path;
    this.value = value;
    this.error = error;
  }
}
function Default2(schema, path, value) {
  try {
    return IsTransform(schema) ? schema[TransformKind].Encode(value) : value;
  } catch (error) {
    throw new TransformEncodeError(schema, path, value, error);
  }
}
function FromArray7(schema, references, path, value) {
  const defaulted = Default2(schema, path, value);
  return IsArray(defaulted) ? defaulted.map((value2, index) => Visit8(schema.items, references, `${path}/${index}`, value2)) : defaulted;
}
function FromImport4(schema, references, path, value) {
  const additional = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  const result = Default2(schema, path, value);
  return Visit8(target, [...references, ...additional], path, result);
}
function FromIntersect7(schema, references, path, value) {
  const defaulted = Default2(schema, path, value);
  if (!IsObject(value) || IsValueType(value))
    return defaulted;
  const knownEntries = KeyOfPropertyEntries(schema);
  const knownKeys = knownEntries.map((entry) => entry[0]);
  const knownProperties = { ...defaulted };
  for (const [knownKey, knownSchema] of knownEntries)
    if (knownKey in knownProperties) {
      knownProperties[knownKey] = Visit8(knownSchema, references, `${path}/${knownKey}`, knownProperties[knownKey]);
    }
  if (!IsTransform(schema.unevaluatedProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const unevaluatedProperties = schema.unevaluatedProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      properties[key] = Default2(unevaluatedProperties, `${path}/${key}`, properties[key]);
    }
  return properties;
}
function FromNot5(schema, references, path, value) {
  return Default2(schema.not, path, Default2(schema, path, value));
}
function FromObject5(schema, references, path, value) {
  const defaulted = Default2(schema, path, value);
  if (!IsObject(defaulted))
    return defaulted;
  const knownKeys = KeyOfPropertyKeys(schema);
  const knownProperties = { ...defaulted };
  for (const key of knownKeys) {
    if (!HasPropertyKey(knownProperties, key))
      continue;
    if (IsUndefined(knownProperties[key]) && (!IsUndefined3(schema.properties[key]) || TypeSystemPolicy.IsExactOptionalProperty(knownProperties, key)))
      continue;
    knownProperties[key] = Visit8(schema.properties[key], references, `${path}/${key}`, knownProperties[key]);
  }
  if (!IsSchema(schema.additionalProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      properties[key] = Default2(additionalProperties, `${path}/${key}`, properties[key]);
    }
  return properties;
}
function FromRecord5(schema, references, path, value) {
  const defaulted = Default2(schema, path, value);
  if (!IsObject(value))
    return defaulted;
  const pattern = Object.getOwnPropertyNames(schema.patternProperties)[0];
  const knownKeys = new RegExp(pattern);
  const knownProperties = { ...defaulted };
  for (const key of Object.getOwnPropertyNames(value))
    if (knownKeys.test(key)) {
      knownProperties[key] = Visit8(schema.patternProperties[pattern], references, `${path}/${key}`, knownProperties[key]);
    }
  if (!IsSchema(schema.additionalProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.test(key)) {
      properties[key] = Default2(additionalProperties, `${path}/${key}`, properties[key]);
    }
  return properties;
}
function FromRef5(schema, references, path, value) {
  const target = Deref(schema, references);
  const resolved = Visit8(target, references, path, value);
  return Default2(schema, path, resolved);
}
function FromThis4(schema, references, path, value) {
  const target = Deref(schema, references);
  const resolved = Visit8(target, references, path, value);
  return Default2(schema, path, resolved);
}
function FromTuple7(schema, references, path, value) {
  const value1 = Default2(schema, path, value);
  return IsArray(schema.items) ? schema.items.map((schema2, index) => Visit8(schema2, references, `${path}/${index}`, value1[index])) : [];
}
function FromUnion9(schema, references, path, value) {
  for (const subschema of schema.anyOf) {
    if (!Check(subschema, references, value))
      continue;
    const value1 = Visit8(subschema, references, path, value);
    return Default2(schema, path, value1);
  }
  for (const subschema of schema.anyOf) {
    const value1 = Visit8(subschema, references, path, value);
    if (!Check(schema, references, value1))
      continue;
    return Default2(schema, path, value1);
  }
  return Default2(schema, path, value);
}
function Visit8(schema, references, path, value) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema[Kind]) {
    case "Array":
      return FromArray7(schema_, references_, path, value);
    case "Import":
      return FromImport4(schema_, references_, path, value);
    case "Intersect":
      return FromIntersect7(schema_, references_, path, value);
    case "Not":
      return FromNot5(schema_, references_, path, value);
    case "Object":
      return FromObject5(schema_, references_, path, value);
    case "Record":
      return FromRecord5(schema_, references_, path, value);
    case "Ref":
      return FromRef5(schema_, references_, path, value);
    case "This":
      return FromThis4(schema_, references_, path, value);
    case "Tuple":
      return FromTuple7(schema_, references_, path, value);
    case "Union":
      return FromUnion9(schema_, references_, path, value);
    default:
      return Default2(schema_, path, value);
  }
}
function TransformEncode(schema, references, value) {
  return Visit8(schema, references, "", value);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/transform/has.mjs
function FromArray8(schema, references) {
  return IsTransform(schema) || Visit9(schema.items, references);
}
function FromAsyncIterator4(schema, references) {
  return IsTransform(schema) || Visit9(schema.items, references);
}
function FromConstructor4(schema, references) {
  return IsTransform(schema) || Visit9(schema.returns, references) || schema.parameters.some((schema2) => Visit9(schema2, references));
}
function FromFunction4(schema, references) {
  return IsTransform(schema) || Visit9(schema.returns, references) || schema.parameters.some((schema2) => Visit9(schema2, references));
}
function FromIntersect8(schema, references) {
  return IsTransform(schema) || IsTransform(schema.unevaluatedProperties) || schema.allOf.some((schema2) => Visit9(schema2, references));
}
function FromImport5(schema, references) {
  const additional = globalThis.Object.getOwnPropertyNames(schema.$defs).reduce((result, key) => [...result, schema.$defs[key]], []);
  const target = schema.$defs[schema.$ref];
  return IsTransform(schema) || Visit9(target, [...additional, ...references]);
}
function FromIterator4(schema, references) {
  return IsTransform(schema) || Visit9(schema.items, references);
}
function FromNot6(schema, references) {
  return IsTransform(schema) || Visit9(schema.not, references);
}
function FromObject6(schema, references) {
  return IsTransform(schema) || Object.values(schema.properties).some((schema2) => Visit9(schema2, references)) || IsSchema(schema.additionalProperties) && Visit9(schema.additionalProperties, references);
}
function FromPromise4(schema, references) {
  return IsTransform(schema) || Visit9(schema.item, references);
}
function FromRecord6(schema, references) {
  const pattern = Object.getOwnPropertyNames(schema.patternProperties)[0];
  const property = schema.patternProperties[pattern];
  return IsTransform(schema) || Visit9(property, references) || IsSchema(schema.additionalProperties) && IsTransform(schema.additionalProperties);
}
function FromRef6(schema, references) {
  if (IsTransform(schema))
    return true;
  return Visit9(Deref(schema, references), references);
}
function FromThis5(schema, references) {
  if (IsTransform(schema))
    return true;
  return Visit9(Deref(schema, references), references);
}
function FromTuple8(schema, references) {
  return IsTransform(schema) || !IsUndefined(schema.items) && schema.items.some((schema2) => Visit9(schema2, references));
}
function FromUnion10(schema, references) {
  return IsTransform(schema) || schema.anyOf.some((schema2) => Visit9(schema2, references));
}
function Visit9(schema, references) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  if (schema.$id && visited.has(schema.$id))
    return false;
  if (schema.$id)
    visited.add(schema.$id);
  switch (schema[Kind]) {
    case "Array":
      return FromArray8(schema_, references_);
    case "AsyncIterator":
      return FromAsyncIterator4(schema_, references_);
    case "Constructor":
      return FromConstructor4(schema_, references_);
    case "Function":
      return FromFunction4(schema_, references_);
    case "Import":
      return FromImport5(schema_, references_);
    case "Intersect":
      return FromIntersect8(schema_, references_);
    case "Iterator":
      return FromIterator4(schema_, references_);
    case "Not":
      return FromNot6(schema_, references_);
    case "Object":
      return FromObject6(schema_, references_);
    case "Promise":
      return FromPromise4(schema_, references_);
    case "Record":
      return FromRecord6(schema_, references_);
    case "Ref":
      return FromRef6(schema_, references_);
    case "This":
      return FromThis5(schema_, references_);
    case "Tuple":
      return FromTuple8(schema_, references_);
    case "Union":
      return FromUnion10(schema_, references_);
    default:
      return IsTransform(schema);
  }
}
var visited = new Set;
function HasTransform(schema, references) {
  visited.clear();
  return Visit9(schema, references);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/compiler/compiler.mjs
class TypeCheck {
  constructor(schema, references, checkFunc, code) {
    this.schema = schema;
    this.references = references;
    this.checkFunc = checkFunc;
    this.code = code;
    this.hasTransform = HasTransform(schema, references);
  }
  Code() {
    return this.code;
  }
  Schema() {
    return this.schema;
  }
  References() {
    return this.references;
  }
  Errors(value) {
    return Errors(this.schema, this.references, value);
  }
  Check(value) {
    return this.checkFunc(value);
  }
  Decode(value) {
    if (!this.checkFunc(value))
      throw new TransformDecodeCheckError(this.schema, value, this.Errors(value).First());
    return this.hasTransform ? TransformDecode(this.schema, this.references, value) : value;
  }
  Encode(value) {
    const encoded = this.hasTransform ? TransformEncode(this.schema, this.references, value) : value;
    if (!this.checkFunc(encoded))
      throw new TransformEncodeCheckError(this.schema, value, this.Errors(value).First());
    return encoded;
  }
}
var Character;
(function(Character2) {
  function DollarSign(code) {
    return code === 36;
  }
  Character2.DollarSign = DollarSign;
  function IsUnderscore(code) {
    return code === 95;
  }
  Character2.IsUnderscore = IsUnderscore;
  function IsAlpha(code) {
    return code >= 65 && code <= 90 || code >= 97 && code <= 122;
  }
  Character2.IsAlpha = IsAlpha;
  function IsNumeric(code) {
    return code >= 48 && code <= 57;
  }
  Character2.IsNumeric = IsNumeric;
})(Character || (Character = {}));
var MemberExpression;
(function(MemberExpression2) {
  function IsFirstCharacterNumeric(value) {
    if (value.length === 0)
      return false;
    return Character.IsNumeric(value.charCodeAt(0));
  }
  function IsAccessor(value) {
    if (IsFirstCharacterNumeric(value))
      return false;
    for (let i = 0;i < value.length; i++) {
      const code = value.charCodeAt(i);
      const check = Character.IsAlpha(code) || Character.IsNumeric(code) || Character.DollarSign(code) || Character.IsUnderscore(code);
      if (!check)
        return false;
    }
    return true;
  }
  function EscapeHyphen(key) {
    return key.replace(/'/g, "\\'");
  }
  function Encode(object, key) {
    return IsAccessor(key) ? `${object}.${key}` : `${object}['${EscapeHyphen(key)}']`;
  }
  MemberExpression2.Encode = Encode;
})(MemberExpression || (MemberExpression = {}));
var Identifier;
(function(Identifier2) {
  function Encode($id) {
    const buffer = [];
    for (let i = 0;i < $id.length; i++) {
      const code = $id.charCodeAt(i);
      if (Character.IsNumeric(code) || Character.IsAlpha(code)) {
        buffer.push($id.charAt(i));
      } else {
        buffer.push(`_${code}_`);
      }
    }
    return buffer.join("").replace(/__/g, "_");
  }
  Identifier2.Encode = Encode;
})(Identifier || (Identifier = {}));
var LiteralString;
(function(LiteralString2) {
  function Escape2(content) {
    return content.replace(/'/g, "\\'");
  }
  LiteralString2.Escape = Escape2;
})(LiteralString || (LiteralString = {}));

class TypeCompilerUnknownTypeError extends TypeBoxError {
  constructor(schema) {
    super("Unknown type");
    this.schema = schema;
  }
}

class TypeCompilerTypeGuardError extends TypeBoxError {
  constructor(schema) {
    super("Preflight validation check failed to guard for the given schema");
    this.schema = schema;
  }
}
var Policy;
(function(Policy2) {
  function IsExactOptionalProperty(value, key, expression) {
    return TypeSystemPolicy.ExactOptionalPropertyTypes ? `('${key}' in ${value} ? ${expression} : true)` : `(${MemberExpression.Encode(value, key)} !== undefined ? ${expression} : true)`;
  }
  Policy2.IsExactOptionalProperty = IsExactOptionalProperty;
  function IsObjectLike(value) {
    return !TypeSystemPolicy.AllowArrayObject ? `(typeof ${value} === 'object' && ${value} !== null && !Array.isArray(${value}))` : `(typeof ${value} === 'object' && ${value} !== null)`;
  }
  Policy2.IsObjectLike = IsObjectLike;
  function IsRecordLike(value) {
    return !TypeSystemPolicy.AllowArrayObject ? `(typeof ${value} === 'object' && ${value} !== null && !Array.isArray(${value}) && !(${value} instanceof Date) && !(${value} instanceof Uint8Array))` : `(typeof ${value} === 'object' && ${value} !== null && !(${value} instanceof Date) && !(${value} instanceof Uint8Array))`;
  }
  Policy2.IsRecordLike = IsRecordLike;
  function IsNumberLike(value) {
    return TypeSystemPolicy.AllowNaN ? `typeof ${value} === 'number'` : `Number.isFinite(${value})`;
  }
  Policy2.IsNumberLike = IsNumberLike;
  function IsVoidLike(value) {
    return TypeSystemPolicy.AllowNullVoid ? `(${value} === undefined || ${value} === null)` : `${value} === undefined`;
  }
  Policy2.IsVoidLike = IsVoidLike;
})(Policy || (Policy = {}));
var TypeCompiler;
(function(TypeCompiler2) {
  function IsAnyOrUnknown2(schema) {
    return schema[Kind] === "Any" || schema[Kind] === "Unknown";
  }
  function* FromAny4(schema, references, value) {
    yield "true";
  }
  function* FromArgument3(schema, references, value) {
    yield "true";
  }
  function* FromArray9(schema, references, value) {
    yield `Array.isArray(${value})`;
    const [parameter, accumulator] = [CreateParameter("value", "any"), CreateParameter("acc", "number")];
    if (IsNumber(schema.maxItems))
      yield `${value}.length <= ${schema.maxItems}`;
    if (IsNumber(schema.minItems))
      yield `${value}.length >= ${schema.minItems}`;
    const elementExpression = CreateExpression(schema.items, references, "value");
    yield `((array) => { for(const ${parameter} of array) if(!(${elementExpression})) { return false }; return true; })(${value})`;
    if (IsSchema2(schema.contains) || IsNumber(schema.minContains) || IsNumber(schema.maxContains)) {
      const containsSchema = IsSchema2(schema.contains) ? schema.contains : Never();
      const checkExpression = CreateExpression(containsSchema, references, "value");
      const checkMinContains = IsNumber(schema.minContains) ? [`(count >= ${schema.minContains})`] : [];
      const checkMaxContains = IsNumber(schema.maxContains) ? [`(count <= ${schema.maxContains})`] : [];
      const checkCount = `const count = value.reduce((${accumulator}, ${parameter}) => ${checkExpression} ? acc + 1 : acc, 0)`;
      const check = [`(count > 0)`, ...checkMinContains, ...checkMaxContains].join(" && ");
      yield `((${parameter}) => { ${checkCount}; return ${check}})(${value})`;
    }
    if (schema.uniqueItems === true) {
      const check = `const hashed = hash(element); if(set.has(hashed)) { return false } else { set.add(hashed) } } return true`;
      const block = `const set = new Set(); for(const element of value) { ${check} }`;
      yield `((${parameter}) => { ${block} )(${value})`;
    }
  }
  function* FromAsyncIterator5(schema, references, value) {
    yield `(typeof value === 'object' && Symbol.asyncIterator in ${value})`;
  }
  function* FromBigInt4(schema, references, value) {
    yield `(typeof ${value} === 'bigint')`;
    if (IsBigInt(schema.exclusiveMaximum))
      yield `${value} < BigInt(${schema.exclusiveMaximum})`;
    if (IsBigInt(schema.exclusiveMinimum))
      yield `${value} > BigInt(${schema.exclusiveMinimum})`;
    if (IsBigInt(schema.maximum))
      yield `${value} <= BigInt(${schema.maximum})`;
    if (IsBigInt(schema.minimum))
      yield `${value} >= BigInt(${schema.minimum})`;
    if (IsBigInt(schema.multipleOf))
      yield `(${value} % BigInt(${schema.multipleOf})) === 0`;
  }
  function* FromBoolean4(schema, references, value) {
    yield `(typeof ${value} === 'boolean')`;
  }
  function* FromConstructor5(schema, references, value) {
    yield* Visit10(schema.returns, references, `${value}.prototype`);
  }
  function* FromDate4(schema, references, value) {
    yield `(${value} instanceof Date) && Number.isFinite(${value}.getTime())`;
    if (IsNumber(schema.exclusiveMaximumTimestamp))
      yield `${value}.getTime() < ${schema.exclusiveMaximumTimestamp}`;
    if (IsNumber(schema.exclusiveMinimumTimestamp))
      yield `${value}.getTime() > ${schema.exclusiveMinimumTimestamp}`;
    if (IsNumber(schema.maximumTimestamp))
      yield `${value}.getTime() <= ${schema.maximumTimestamp}`;
    if (IsNumber(schema.minimumTimestamp))
      yield `${value}.getTime() >= ${schema.minimumTimestamp}`;
    if (IsNumber(schema.multipleOfTimestamp))
      yield `(${value}.getTime() % ${schema.multipleOfTimestamp}) === 0`;
  }
  function* FromFunction5(schema, references, value) {
    yield `(typeof ${value} === 'function')`;
  }
  function* FromImport6(schema, references, value) {
    const members = globalThis.Object.getOwnPropertyNames(schema.$defs).reduce((result, key) => {
      return [...result, schema.$defs[key]];
    }, []);
    yield* Visit10(Ref(schema.$ref), [...references, ...members], value);
  }
  function* FromInteger4(schema, references, value) {
    yield `Number.isInteger(${value})`;
    if (IsNumber(schema.exclusiveMaximum))
      yield `${value} < ${schema.exclusiveMaximum}`;
    if (IsNumber(schema.exclusiveMinimum))
      yield `${value} > ${schema.exclusiveMinimum}`;
    if (IsNumber(schema.maximum))
      yield `${value} <= ${schema.maximum}`;
    if (IsNumber(schema.minimum))
      yield `${value} >= ${schema.minimum}`;
    if (IsNumber(schema.multipleOf))
      yield `(${value} % ${schema.multipleOf}) === 0`;
  }
  function* FromIntersect9(schema, references, value) {
    const check1 = schema.allOf.map((schema2) => CreateExpression(schema2, references, value)).join(" && ");
    if (schema.unevaluatedProperties === false) {
      const keyCheck = CreateVariable(`${new RegExp(KeyOfPattern(schema))};`);
      const check2 = `Object.getOwnPropertyNames(${value}).every(key => ${keyCheck}.test(key))`;
      yield `(${check1} && ${check2})`;
    } else if (IsSchema2(schema.unevaluatedProperties)) {
      const keyCheck = CreateVariable(`${new RegExp(KeyOfPattern(schema))};`);
      const check2 = `Object.getOwnPropertyNames(${value}).every(key => ${keyCheck}.test(key) || ${CreateExpression(schema.unevaluatedProperties, references, `${value}[key]`)})`;
      yield `(${check1} && ${check2})`;
    } else {
      yield `(${check1})`;
    }
  }
  function* FromIterator5(schema, references, value) {
    yield `(typeof value === 'object' && Symbol.iterator in ${value})`;
  }
  function* FromLiteral5(schema, references, value) {
    if (typeof schema.const === "number" || typeof schema.const === "boolean") {
      yield `(${value} === ${schema.const})`;
    } else {
      yield `(${value} === '${LiteralString.Escape(schema.const)}')`;
    }
  }
  function* FromNever4(schema, references, value) {
    yield `false`;
  }
  function* FromNot7(schema, references, value) {
    const expression = CreateExpression(schema.not, references, value);
    yield `(!${expression})`;
  }
  function* FromNull4(schema, references, value) {
    yield `(${value} === null)`;
  }
  function* FromNumber4(schema, references, value) {
    yield Policy.IsNumberLike(value);
    if (IsNumber(schema.exclusiveMaximum))
      yield `${value} < ${schema.exclusiveMaximum}`;
    if (IsNumber(schema.exclusiveMinimum))
      yield `${value} > ${schema.exclusiveMinimum}`;
    if (IsNumber(schema.maximum))
      yield `${value} <= ${schema.maximum}`;
    if (IsNumber(schema.minimum))
      yield `${value} >= ${schema.minimum}`;
    if (IsNumber(schema.multipleOf))
      yield `(${value} % ${schema.multipleOf}) === 0`;
  }
  function* FromObject7(schema, references, value) {
    yield Policy.IsObjectLike(value);
    if (IsNumber(schema.minProperties))
      yield `Object.getOwnPropertyNames(${value}).length >= ${schema.minProperties}`;
    if (IsNumber(schema.maxProperties))
      yield `Object.getOwnPropertyNames(${value}).length <= ${schema.maxProperties}`;
    const knownKeys = Object.getOwnPropertyNames(schema.properties);
    for (const knownKey of knownKeys) {
      const memberExpression = MemberExpression.Encode(value, knownKey);
      const property = schema.properties[knownKey];
      if (schema.required && schema.required.includes(knownKey)) {
        yield* Visit10(property, references, memberExpression);
        if (ExtendsUndefinedCheck(property) || IsAnyOrUnknown2(property))
          yield `('${knownKey}' in ${value})`;
      } else {
        const expression = CreateExpression(property, references, memberExpression);
        yield Policy.IsExactOptionalProperty(value, knownKey, expression);
      }
    }
    if (schema.additionalProperties === false) {
      if (schema.required && schema.required.length === knownKeys.length) {
        yield `Object.getOwnPropertyNames(${value}).length === ${knownKeys.length}`;
      } else {
        const keys = `[${knownKeys.map((key) => `'${key}'`).join(", ")}]`;
        yield `Object.getOwnPropertyNames(${value}).every(key => ${keys}.includes(key))`;
      }
    }
    if (typeof schema.additionalProperties === "object") {
      const expression = CreateExpression(schema.additionalProperties, references, `${value}[key]`);
      const keys = `[${knownKeys.map((key) => `'${key}'`).join(", ")}]`;
      yield `(Object.getOwnPropertyNames(${value}).every(key => ${keys}.includes(key) || ${expression}))`;
    }
  }
  function* FromPromise5(schema, references, value) {
    yield `${value} instanceof Promise`;
  }
  function* FromRecord7(schema, references, value) {
    yield Policy.IsRecordLike(value);
    if (IsNumber(schema.minProperties))
      yield `Object.getOwnPropertyNames(${value}).length >= ${schema.minProperties}`;
    if (IsNumber(schema.maxProperties))
      yield `Object.getOwnPropertyNames(${value}).length <= ${schema.maxProperties}`;
    const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0];
    const variable = CreateVariable(`${new RegExp(patternKey)}`);
    const check1 = CreateExpression(patternSchema, references, "value");
    const check2 = IsSchema2(schema.additionalProperties) ? CreateExpression(schema.additionalProperties, references, value) : schema.additionalProperties === false ? "false" : "true";
    const expression = `(${variable}.test(key) ? ${check1} : ${check2})`;
    yield `(Object.entries(${value}).every(([key, value]) => ${expression}))`;
  }
  function* FromRef7(schema, references, value) {
    const target = Deref(schema, references);
    if (state.functions.has(schema.$ref))
      return yield `${CreateFunctionName(schema.$ref)}(${value})`;
    yield* Visit10(target, references, value);
  }
  function* FromRegExp4(schema, references, value) {
    const variable = CreateVariable(`${new RegExp(schema.source, schema.flags)};`);
    yield `(typeof ${value} === 'string')`;
    if (IsNumber(schema.maxLength))
      yield `${value}.length <= ${schema.maxLength}`;
    if (IsNumber(schema.minLength))
      yield `${value}.length >= ${schema.minLength}`;
    yield `${variable}.test(${value})`;
  }
  function* FromString4(schema, references, value) {
    yield `(typeof ${value} === 'string')`;
    if (IsNumber(schema.maxLength))
      yield `${value}.length <= ${schema.maxLength}`;
    if (IsNumber(schema.minLength))
      yield `${value}.length >= ${schema.minLength}`;
    if (schema.pattern !== undefined) {
      const variable = CreateVariable(`${new RegExp(schema.pattern)};`);
      yield `${variable}.test(${value})`;
    }
    if (schema.format !== undefined) {
      yield `format('${schema.format}', ${value})`;
    }
  }
  function* FromSymbol4(schema, references, value) {
    yield `(typeof ${value} === 'symbol')`;
  }
  function* FromTemplateLiteral5(schema, references, value) {
    yield `(typeof ${value} === 'string')`;
    const variable = CreateVariable(`${new RegExp(schema.pattern)};`);
    yield `${variable}.test(${value})`;
  }
  function* FromThis6(schema, references, value) {
    yield `${CreateFunctionName(schema.$ref)}(${value})`;
  }
  function* FromTuple9(schema, references, value) {
    yield `Array.isArray(${value})`;
    if (schema.items === undefined)
      return yield `${value}.length === 0`;
    yield `(${value}.length === ${schema.maxItems})`;
    for (let i = 0;i < schema.items.length; i++) {
      const expression = CreateExpression(schema.items[i], references, `${value}[${i}]`);
      yield `${expression}`;
    }
  }
  function* FromUndefined4(schema, references, value) {
    yield `${value} === undefined`;
  }
  function* FromUnion11(schema, references, value) {
    const expressions = schema.anyOf.map((schema2) => CreateExpression(schema2, references, value));
    yield `(${expressions.join(" || ")})`;
  }
  function* FromUint8Array4(schema, references, value) {
    yield `${value} instanceof Uint8Array`;
    if (IsNumber(schema.maxByteLength))
      yield `(${value}.length <= ${schema.maxByteLength})`;
    if (IsNumber(schema.minByteLength))
      yield `(${value}.length >= ${schema.minByteLength})`;
  }
  function* FromUnknown4(schema, references, value) {
    yield "true";
  }
  function* FromVoid4(schema, references, value) {
    yield Policy.IsVoidLike(value);
  }
  function* FromKind3(schema, references, value) {
    const instance = state.instances.size;
    state.instances.set(instance, schema);
    yield `kind('${schema[Kind]}', ${instance}, ${value})`;
  }
  function* Visit10(schema, references, value, useHoisting = true) {
    const references_ = IsString(schema.$id) ? [...references, schema] : references;
    const schema_ = schema;
    if (useHoisting && IsString(schema.$id)) {
      const functionName = CreateFunctionName(schema.$id);
      if (state.functions.has(functionName)) {
        return yield `${functionName}(${value})`;
      } else {
        state.functions.set(functionName, "<deferred>");
        const functionCode = CreateFunction(functionName, schema, references, "value", false);
        state.functions.set(functionName, functionCode);
        return yield `${functionName}(${value})`;
      }
    }
    switch (schema_[Kind]) {
      case "Any":
        return yield* FromAny4(schema_, references_, value);
      case "Argument":
        return yield* FromArgument3(schema_, references_, value);
      case "Array":
        return yield* FromArray9(schema_, references_, value);
      case "AsyncIterator":
        return yield* FromAsyncIterator5(schema_, references_, value);
      case "BigInt":
        return yield* FromBigInt4(schema_, references_, value);
      case "Boolean":
        return yield* FromBoolean4(schema_, references_, value);
      case "Constructor":
        return yield* FromConstructor5(schema_, references_, value);
      case "Date":
        return yield* FromDate4(schema_, references_, value);
      case "Function":
        return yield* FromFunction5(schema_, references_, value);
      case "Import":
        return yield* FromImport6(schema_, references_, value);
      case "Integer":
        return yield* FromInteger4(schema_, references_, value);
      case "Intersect":
        return yield* FromIntersect9(schema_, references_, value);
      case "Iterator":
        return yield* FromIterator5(schema_, references_, value);
      case "Literal":
        return yield* FromLiteral5(schema_, references_, value);
      case "Never":
        return yield* FromNever4(schema_, references_, value);
      case "Not":
        return yield* FromNot7(schema_, references_, value);
      case "Null":
        return yield* FromNull4(schema_, references_, value);
      case "Number":
        return yield* FromNumber4(schema_, references_, value);
      case "Object":
        return yield* FromObject7(schema_, references_, value);
      case "Promise":
        return yield* FromPromise5(schema_, references_, value);
      case "Record":
        return yield* FromRecord7(schema_, references_, value);
      case "Ref":
        return yield* FromRef7(schema_, references_, value);
      case "RegExp":
        return yield* FromRegExp4(schema_, references_, value);
      case "String":
        return yield* FromString4(schema_, references_, value);
      case "Symbol":
        return yield* FromSymbol4(schema_, references_, value);
      case "TemplateLiteral":
        return yield* FromTemplateLiteral5(schema_, references_, value);
      case "This":
        return yield* FromThis6(schema_, references_, value);
      case "Tuple":
        return yield* FromTuple9(schema_, references_, value);
      case "Undefined":
        return yield* FromUndefined4(schema_, references_, value);
      case "Union":
        return yield* FromUnion11(schema_, references_, value);
      case "Uint8Array":
        return yield* FromUint8Array4(schema_, references_, value);
      case "Unknown":
        return yield* FromUnknown4(schema_, references_, value);
      case "Void":
        return yield* FromVoid4(schema_, references_, value);
      default:
        if (!exports_type.Has(schema_[Kind]))
          throw new TypeCompilerUnknownTypeError(schema);
        return yield* FromKind3(schema_, references_, value);
    }
  }
  const state = {
    language: "javascript",
    functions: new Map,
    variables: new Map,
    instances: new Map
  };
  function CreateExpression(schema, references, value, useHoisting = true) {
    return `(${[...Visit10(schema, references, value, useHoisting)].join(" && ")})`;
  }
  function CreateFunctionName($id) {
    return `check_${Identifier.Encode($id)}`;
  }
  function CreateVariable(expression) {
    const variableName = `local_${state.variables.size}`;
    state.variables.set(variableName, `const ${variableName} = ${expression}`);
    return variableName;
  }
  function CreateFunction(name, schema, references, value, useHoisting = true) {
    const [newline, pad] = [`
`, (length) => "".padStart(length, " ")];
    const parameter = CreateParameter("value", "any");
    const returns = CreateReturns("boolean");
    const expression = [...Visit10(schema, references, value, useHoisting)].map((expression2) => `${pad(4)}${expression2}`).join(` &&${newline}`);
    return `function ${name}(${parameter})${returns} {${newline}${pad(2)}return (${newline}${expression}${newline}${pad(2)})
}`;
  }
  function CreateParameter(name, type) {
    const annotation = state.language === "typescript" ? `: ${type}` : "";
    return `${name}${annotation}`;
  }
  function CreateReturns(type) {
    return state.language === "typescript" ? `: ${type}` : "";
  }
  function Build(schema, references, options) {
    const functionCode = CreateFunction("check", schema, references, "value");
    const parameter = CreateParameter("value", "any");
    const returns = CreateReturns("boolean");
    const functions = [...state.functions.values()];
    const variables = [...state.variables.values()];
    const checkFunction = IsString(schema.$id) ? `return function check(${parameter})${returns} {
  return ${CreateFunctionName(schema.$id)}(value)
}` : `return ${functionCode}`;
    return [...variables, ...functions, checkFunction].join(`
`);
  }
  function Code(...args) {
    const defaults = { language: "javascript" };
    const [schema, references, options] = args.length === 2 && IsArray(args[1]) ? [args[0], args[1], defaults] : args.length === 2 && !IsArray(args[1]) ? [args[0], [], args[1]] : args.length === 3 ? [args[0], args[1], args[2]] : args.length === 1 ? [args[0], [], defaults] : [null, [], defaults];
    state.language = options.language;
    state.variables.clear();
    state.functions.clear();
    state.instances.clear();
    if (!IsSchema2(schema))
      throw new TypeCompilerTypeGuardError(schema);
    for (const schema2 of references)
      if (!IsSchema2(schema2))
        throw new TypeCompilerTypeGuardError(schema2);
    return Build(schema, references, options);
  }
  TypeCompiler2.Code = Code;
  function Compile(schema, references = []) {
    const generatedCode = Code(schema, references, { language: "javascript" });
    const compiledFunction = globalThis.Function("kind", "format", "hash", generatedCode);
    const instances = new Map(state.instances);
    function typeRegistryFunction(kind, instance, value) {
      if (!exports_type.Has(kind) || !instances.has(instance))
        return false;
      const checkFunc = exports_type.Get(kind);
      const schema2 = instances.get(instance);
      return checkFunc(schema2, value);
    }
    function formatRegistryFunction(format, value) {
      if (!exports_format.Has(format))
        return false;
      const checkFunc = exports_format.Get(format);
      return checkFunc(value);
    }
    function hashFunction(value) {
      return Hash(value);
    }
    const checkFunction = compiledFunction(typeRegistryFunction, formatRegistryFunction, hashFunction);
    return new TypeCheck(schema, references, checkFunction, generatedCode);
  }
  TypeCompiler2.Compile = Compile;
})(TypeCompiler || (TypeCompiler = {}));

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/clone/type.mjs
function CloneType(schema, options) {
  return options === undefined ? Clone(schema) : Clone({ ...options, ...schema });
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/argument/argument.mjs
function Argument(index) {
  return CreateType({ [Kind]: "Argument", index });
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/awaited/awaited.mjs
function FromComputed2(target, parameters) {
  return Computed("Awaited", [Computed(target, parameters)]);
}
function FromRef7($ref) {
  return Computed("Awaited", [Ref($ref)]);
}
function FromIntersect9(types2) {
  return Intersect(FromRest4(types2));
}
function FromUnion11(types2) {
  return Union(FromRest4(types2));
}
function FromPromise5(type) {
  return Awaited(type);
}
function FromRest4(types2) {
  return types2.map((type) => Awaited(type));
}
function Awaited(type, options) {
  return CreateType(IsComputed(type) ? FromComputed2(type.target, type.parameters) : IsIntersect(type) ? FromIntersect9(type.allOf) : IsUnion(type) ? FromUnion11(type.anyOf) : IsPromise2(type) ? FromPromise5(type.item) : IsRef(type) ? FromRef7(type.$ref) : type, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/composite/composite.mjs
function CompositeKeys(T) {
  const Acc = [];
  for (const L of T)
    Acc.push(...KeyOfPropertyKeys(L));
  return SetDistinct(Acc);
}
function FilterNever(T) {
  return T.filter((L) => !IsNever(L));
}
function CompositeProperty(T, K) {
  const Acc = [];
  for (const L of T)
    Acc.push(...IndexFromPropertyKeys(L, [K]));
  return FilterNever(Acc);
}
function CompositeProperties(T, K) {
  const Acc = {};
  for (const L of K) {
    Acc[L] = IntersectEvaluated(CompositeProperty(T, L));
  }
  return Acc;
}
function Composite(T, options) {
  const K = CompositeKeys(T);
  const P = CompositeProperties(T, K);
  const R = Object2(P, options);
  return R;
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/date/date.mjs
function Date2(options) {
  return CreateType({ [Kind]: "Date", type: "Date" }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/null/null.mjs
function Null(options) {
  return CreateType({ [Kind]: "Null", type: "null" }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/symbol/symbol.mjs
function Symbol2(options) {
  return CreateType({ [Kind]: "Symbol", type: "symbol" }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/undefined/undefined.mjs
function Undefined(options) {
  return CreateType({ [Kind]: "Undefined", type: "undefined" }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/uint8array/uint8array.mjs
function Uint8Array2(options) {
  return CreateType({ [Kind]: "Uint8Array", type: "Uint8Array" }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/const/const.mjs
function FromArray9(T) {
  return T.map((L) => FromValue(L, false));
}
function FromProperties8(value) {
  const Acc = {};
  for (const K of globalThis.Object.getOwnPropertyNames(value))
    Acc[K] = Readonly(FromValue(value[K], false));
  return Acc;
}
function ConditionalReadonly(T, root) {
  return root === true ? T : Readonly(T);
}
function FromValue(value, root) {
  return IsAsyncIterator2(value) ? ConditionalReadonly(Any(), root) : IsIterator2(value) ? ConditionalReadonly(Any(), root) : IsArray2(value) ? Readonly(Tuple(FromArray9(value))) : IsUint8Array2(value) ? Uint8Array2() : IsDate2(value) ? Date2() : IsObject2(value) ? ConditionalReadonly(Object2(FromProperties8(value)), root) : IsFunction2(value) ? ConditionalReadonly(Function2([], Unknown()), root) : IsUndefined2(value) ? Undefined() : IsNull2(value) ? Null() : IsSymbol2(value) ? Symbol2() : IsBigInt2(value) ? BigInt2() : IsNumber2(value) ? Literal(value) : IsBoolean2(value) ? Literal(value) : IsString2(value) ? Literal(value) : Object2({});
}
function Const(T, options) {
  return CreateType(FromValue(T, true), options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/constructor-parameters/constructor-parameters.mjs
function ConstructorParameters(schema, options) {
  return IsConstructor(schema) ? Tuple(schema.parameters, options) : Never(options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/enum/enum.mjs
function Enum(item, options) {
  if (IsUndefined2(item))
    throw new Error("Enum undefined or empty");
  const values1 = globalThis.Object.getOwnPropertyNames(item).filter((key) => isNaN(key)).map((key) => item[key]);
  const values2 = [...new Set(values1)];
  const anyOf = values2.map((value) => Literal(value));
  return Union(anyOf, { ...options, [Hint]: "Enum" });
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/exclude/exclude-from-template-literal.mjs
function ExcludeFromTemplateLiteral(L, R) {
  return Exclude(TemplateLiteralToUnion(L), R);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/exclude/exclude.mjs
function ExcludeRest(L, R) {
  const excluded = L.filter((inner) => ExtendsCheck(inner, R) === ExtendsResult.False);
  return excluded.length === 1 ? excluded[0] : Union(excluded);
}
function Exclude(L, R, options = {}) {
  if (IsTemplateLiteral(L))
    return CreateType(ExcludeFromTemplateLiteral(L, R), options);
  if (IsMappedResult(L))
    return CreateType(ExcludeFromMappedResult(L, R), options);
  return CreateType(IsUnion(L) ? ExcludeRest(L.anyOf, R) : ExtendsCheck(L, R) !== ExtendsResult.False ? Never() : L, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/exclude/exclude-from-mapped-result.mjs
function FromProperties9(P, U) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Exclude(P[K2], U);
  return Acc;
}
function FromMappedResult7(R, T) {
  return FromProperties9(R.properties, T);
}
function ExcludeFromMappedResult(R, T) {
  const P = FromMappedResult7(R, T);
  return MappedResult(P);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extract/extract-from-template-literal.mjs
function ExtractFromTemplateLiteral(L, R) {
  return Extract(TemplateLiteralToUnion(L), R);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extract/extract.mjs
function ExtractRest(L, R) {
  const extracted = L.filter((inner) => ExtendsCheck(inner, R) !== ExtendsResult.False);
  return extracted.length === 1 ? extracted[0] : Union(extracted);
}
function Extract(L, R, options) {
  if (IsTemplateLiteral(L))
    return CreateType(ExtractFromTemplateLiteral(L, R), options);
  if (IsMappedResult(L))
    return CreateType(ExtractFromMappedResult(L, R), options);
  return CreateType(IsUnion(L) ? ExtractRest(L.anyOf, R) : ExtendsCheck(L, R) !== ExtendsResult.False ? L : Never(), options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extract/extract-from-mapped-result.mjs
function FromProperties10(P, T) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Extract(P[K2], T);
  return Acc;
}
function FromMappedResult8(R, T) {
  return FromProperties10(R.properties, T);
}
function ExtractFromMappedResult(R, T) {
  const P = FromMappedResult8(R, T);
  return MappedResult(P);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/instance-type/instance-type.mjs
function InstanceType(schema, options) {
  return IsConstructor(schema) ? CreateType(schema.returns, options) : Never(options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/readonly-optional/readonly-optional.mjs
function ReadonlyOptional(schema) {
  return Readonly(Optional(schema));
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/record/record.mjs
function RecordCreateFromPattern(pattern, T, options) {
  return CreateType({ [Kind]: "Record", type: "object", patternProperties: { [pattern]: T } }, options);
}
function RecordCreateFromKeys(K, T, options) {
  const result = {};
  for (const K2 of K)
    result[K2] = T;
  return Object2(result, { ...options, [Hint]: "Record" });
}
function FromTemplateLiteralKey(K, T, options) {
  return IsTemplateLiteralFinite(K) ? RecordCreateFromKeys(IndexPropertyKeys(K), T, options) : RecordCreateFromPattern(K.pattern, T, options);
}
function FromUnionKey(key, type, options) {
  return RecordCreateFromKeys(IndexPropertyKeys(Union(key)), type, options);
}
function FromLiteralKey(key, type, options) {
  return RecordCreateFromKeys([key.toString()], type, options);
}
function FromRegExpKey(key, type, options) {
  return RecordCreateFromPattern(key.source, type, options);
}
function FromStringKey(key, type, options) {
  const pattern = IsUndefined2(key.pattern) ? PatternStringExact : key.pattern;
  return RecordCreateFromPattern(pattern, type, options);
}
function FromAnyKey(_, type, options) {
  return RecordCreateFromPattern(PatternStringExact, type, options);
}
function FromNeverKey(_key, type, options) {
  return RecordCreateFromPattern(PatternNeverExact, type, options);
}
function FromBooleanKey(_key, type, options) {
  return Object2({ true: type, false: type }, options);
}
function FromIntegerKey(_key, type, options) {
  return RecordCreateFromPattern(PatternNumberExact, type, options);
}
function FromNumberKey(_, type, options) {
  return RecordCreateFromPattern(PatternNumberExact, type, options);
}
function Record(key, type, options = {}) {
  return IsUnion(key) ? FromUnionKey(key.anyOf, type, options) : IsTemplateLiteral(key) ? FromTemplateLiteralKey(key, type, options) : IsLiteral(key) ? FromLiteralKey(key.const, type, options) : IsBoolean3(key) ? FromBooleanKey(key, type, options) : IsInteger2(key) ? FromIntegerKey(key, type, options) : IsNumber3(key) ? FromNumberKey(key, type, options) : IsRegExp2(key) ? FromRegExpKey(key, type, options) : IsString3(key) ? FromStringKey(key, type, options) : IsAny(key) ? FromAnyKey(key, type, options) : IsNever(key) ? FromNeverKey(key, type, options) : Never(options);
}
function RecordPattern(record) {
  return globalThis.Object.getOwnPropertyNames(record.patternProperties)[0];
}
function RecordKey2(type) {
  const pattern = RecordPattern(type);
  return pattern === PatternStringExact ? String2() : pattern === PatternNumberExact ? Number2() : String2({ pattern });
}
function RecordValue2(type) {
  return type.patternProperties[RecordPattern(type)];
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/instantiate/instantiate.mjs
function FromConstructor5(args, type) {
  type.parameters = FromTypes(args, type.parameters);
  type.returns = FromType(args, type.returns);
  return type;
}
function FromFunction5(args, type) {
  type.parameters = FromTypes(args, type.parameters);
  type.returns = FromType(args, type.returns);
  return type;
}
function FromIntersect10(args, type) {
  type.allOf = FromTypes(args, type.allOf);
  return type;
}
function FromUnion12(args, type) {
  type.anyOf = FromTypes(args, type.anyOf);
  return type;
}
function FromTuple9(args, type) {
  if (IsUndefined2(type.items))
    return type;
  type.items = FromTypes(args, type.items);
  return type;
}
function FromArray10(args, type) {
  type.items = FromType(args, type.items);
  return type;
}
function FromAsyncIterator5(args, type) {
  type.items = FromType(args, type.items);
  return type;
}
function FromIterator5(args, type) {
  type.items = FromType(args, type.items);
  return type;
}
function FromPromise6(args, type) {
  type.item = FromType(args, type.item);
  return type;
}
function FromObject7(args, type) {
  const mappedProperties = FromProperties11(args, type.properties);
  return { ...type, ...Object2(mappedProperties) };
}
function FromRecord7(args, type) {
  const mappedKey = FromType(args, RecordKey2(type));
  const mappedValue = FromType(args, RecordValue2(type));
  const result = Record(mappedKey, mappedValue);
  return { ...type, ...result };
}
function FromArgument3(args, argument) {
  return argument.index in args ? args[argument.index] : Unknown();
}
function FromProperty2(args, type) {
  const isReadonly = IsReadonly(type);
  const isOptional = IsOptional(type);
  const mapped = FromType(args, type);
  return isReadonly && isOptional ? ReadonlyOptional(mapped) : isReadonly && !isOptional ? Readonly(mapped) : !isReadonly && isOptional ? Optional(mapped) : mapped;
}
function FromProperties11(args, properties) {
  return globalThis.Object.getOwnPropertyNames(properties).reduce((result, key) => {
    return { ...result, [key]: FromProperty2(args, properties[key]) };
  }, {});
}
function FromTypes(args, types2) {
  return types2.map((type) => FromType(args, type));
}
function FromType(args, type) {
  return IsConstructor(type) ? FromConstructor5(args, type) : IsFunction3(type) ? FromFunction5(args, type) : IsIntersect(type) ? FromIntersect10(args, type) : IsUnion(type) ? FromUnion12(args, type) : IsTuple(type) ? FromTuple9(args, type) : IsArray3(type) ? FromArray10(args, type) : IsAsyncIterator3(type) ? FromAsyncIterator5(args, type) : IsIterator3(type) ? FromIterator5(args, type) : IsPromise2(type) ? FromPromise6(args, type) : IsObject3(type) ? FromObject7(args, type) : IsRecord(type) ? FromRecord7(args, type) : IsArgument(type) ? FromArgument3(args, type) : type;
}
function Instantiate(type, args) {
  return FromType(args, CloneType(type));
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/integer/integer.mjs
function Integer(options) {
  return CreateType({ [Kind]: "Integer", type: "integer" }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intrinsic/intrinsic-from-mapped-key.mjs
function MappedIntrinsicPropertyKey(K, M, options) {
  return {
    [K]: Intrinsic(Literal(K), M, Clone(options))
  };
}
function MappedIntrinsicPropertyKeys(K, M, options) {
  const result = K.reduce((Acc, L) => {
    return { ...Acc, ...MappedIntrinsicPropertyKey(L, M, options) };
  }, {});
  return result;
}
function MappedIntrinsicProperties(T, M, options) {
  return MappedIntrinsicPropertyKeys(T["keys"], M, options);
}
function IntrinsicFromMappedKey(T, M, options) {
  const P = MappedIntrinsicProperties(T, M, options);
  return MappedResult(P);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intrinsic/intrinsic.mjs
function ApplyUncapitalize(value) {
  const [first, rest] = [value.slice(0, 1), value.slice(1)];
  return [first.toLowerCase(), rest].join("");
}
function ApplyCapitalize(value) {
  const [first, rest] = [value.slice(0, 1), value.slice(1)];
  return [first.toUpperCase(), rest].join("");
}
function ApplyUppercase(value) {
  return value.toUpperCase();
}
function ApplyLowercase(value) {
  return value.toLowerCase();
}
function FromTemplateLiteral5(schema, mode, options) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  const finite = IsTemplateLiteralExpressionFinite(expression);
  if (!finite)
    return { ...schema, pattern: FromLiteralValue(schema.pattern, mode) };
  const strings = [...TemplateLiteralExpressionGenerate(expression)];
  const literals = strings.map((value) => Literal(value));
  const mapped = FromRest5(literals, mode);
  const union = Union(mapped);
  return TemplateLiteral([union], options);
}
function FromLiteralValue(value, mode) {
  return typeof value === "string" ? mode === "Uncapitalize" ? ApplyUncapitalize(value) : mode === "Capitalize" ? ApplyCapitalize(value) : mode === "Uppercase" ? ApplyUppercase(value) : mode === "Lowercase" ? ApplyLowercase(value) : value : value.toString();
}
function FromRest5(T, M) {
  return T.map((L) => Intrinsic(L, M));
}
function Intrinsic(schema, mode, options = {}) {
  return IsMappedKey(schema) ? IntrinsicFromMappedKey(schema, mode, options) : IsTemplateLiteral(schema) ? FromTemplateLiteral5(schema, mode, options) : IsUnion(schema) ? Union(FromRest5(schema.anyOf, mode), options) : IsLiteral(schema) ? Literal(FromLiteralValue(schema.const, mode), options) : CreateType(schema, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intrinsic/capitalize.mjs
function Capitalize(T, options = {}) {
  return Intrinsic(T, "Capitalize", options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intrinsic/lowercase.mjs
function Lowercase(T, options = {}) {
  return Intrinsic(T, "Lowercase", options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intrinsic/uncapitalize.mjs
function Uncapitalize(T, options = {}) {
  return Intrinsic(T, "Uncapitalize", options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intrinsic/uppercase.mjs
function Uppercase(T, options = {}) {
  return Intrinsic(T, "Uppercase", options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/omit/omit-from-mapped-result.mjs
function FromProperties12(properties, propertyKeys, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = Omit(properties[K2], propertyKeys, Clone(options));
  return result;
}
function FromMappedResult9(mappedResult, propertyKeys, options) {
  return FromProperties12(mappedResult.properties, propertyKeys, options);
}
function OmitFromMappedResult(mappedResult, propertyKeys, options) {
  const properties = FromMappedResult9(mappedResult, propertyKeys, options);
  return MappedResult(properties);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/omit/omit.mjs
function FromIntersect11(types2, propertyKeys) {
  return types2.map((type) => OmitResolve(type, propertyKeys));
}
function FromUnion13(types2, propertyKeys) {
  return types2.map((type) => OmitResolve(type, propertyKeys));
}
function FromProperty3(properties, key) {
  const { [key]: _, ...R } = properties;
  return R;
}
function FromProperties13(properties, propertyKeys) {
  return propertyKeys.reduce((T, K2) => FromProperty3(T, K2), properties);
}
function FromObject8(type, propertyKeys, properties) {
  const options = Discard(type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties13(properties, propertyKeys);
  return Object2(mappedProperties, options);
}
function UnionFromPropertyKeys(propertyKeys) {
  const result = propertyKeys.reduce((result2, key) => IsLiteralValue(key) ? [...result2, Literal(key)] : result2, []);
  return Union(result);
}
function OmitResolve(type, propertyKeys) {
  return IsIntersect(type) ? Intersect(FromIntersect11(type.allOf, propertyKeys)) : IsUnion(type) ? Union(FromUnion13(type.anyOf, propertyKeys)) : IsObject3(type) ? FromObject8(type, propertyKeys, type.properties) : Object2({});
}
function Omit(type, key, options) {
  const typeKey = IsArray2(key) ? UnionFromPropertyKeys(key) : key;
  const propertyKeys = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const isTypeRef = IsRef(type);
  const isKeyRef = IsRef(key);
  return IsMappedResult(type) ? OmitFromMappedResult(type, propertyKeys, options) : IsMappedKey(key) ? OmitFromMappedKey(type, key, options) : isTypeRef && isKeyRef ? Computed("Omit", [type, typeKey], options) : !isTypeRef && isKeyRef ? Computed("Omit", [type, typeKey], options) : isTypeRef && !isKeyRef ? Computed("Omit", [type, typeKey], options) : CreateType({ ...OmitResolve(type, propertyKeys), ...options });
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/omit/omit-from-mapped-key.mjs
function FromPropertyKey2(type, key, options) {
  return { [key]: Omit(type, [key], Clone(options)) };
}
function FromPropertyKeys2(type, propertyKeys, options) {
  return propertyKeys.reduce((Acc, LK) => {
    return { ...Acc, ...FromPropertyKey2(type, LK, options) };
  }, {});
}
function FromMappedKey3(type, mappedKey, options) {
  return FromPropertyKeys2(type, mappedKey.keys, options);
}
function OmitFromMappedKey(type, mappedKey, options) {
  const properties = FromMappedKey3(type, mappedKey, options);
  return MappedResult(properties);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/pick/pick-from-mapped-result.mjs
function FromProperties14(properties, propertyKeys, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = Pick(properties[K2], propertyKeys, Clone(options));
  return result;
}
function FromMappedResult10(mappedResult, propertyKeys, options) {
  return FromProperties14(mappedResult.properties, propertyKeys, options);
}
function PickFromMappedResult(mappedResult, propertyKeys, options) {
  const properties = FromMappedResult10(mappedResult, propertyKeys, options);
  return MappedResult(properties);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/pick/pick.mjs
function FromIntersect12(types2, propertyKeys) {
  return types2.map((type) => PickResolve(type, propertyKeys));
}
function FromUnion14(types2, propertyKeys) {
  return types2.map((type) => PickResolve(type, propertyKeys));
}
function FromProperties15(properties, propertyKeys) {
  const result = {};
  for (const K2 of propertyKeys)
    if (K2 in properties)
      result[K2] = properties[K2];
  return result;
}
function FromObject9(Type, keys, properties) {
  const options = Discard(Type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties15(properties, keys);
  return Object2(mappedProperties, options);
}
function UnionFromPropertyKeys2(propertyKeys) {
  const result = propertyKeys.reduce((result2, key) => IsLiteralValue(key) ? [...result2, Literal(key)] : result2, []);
  return Union(result);
}
function PickResolve(type, propertyKeys) {
  return IsIntersect(type) ? Intersect(FromIntersect12(type.allOf, propertyKeys)) : IsUnion(type) ? Union(FromUnion14(type.anyOf, propertyKeys)) : IsObject3(type) ? FromObject9(type, propertyKeys, type.properties) : Object2({});
}
function Pick(type, key, options) {
  const typeKey = IsArray2(key) ? UnionFromPropertyKeys2(key) : key;
  const propertyKeys = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const isTypeRef = IsRef(type);
  const isKeyRef = IsRef(key);
  return IsMappedResult(type) ? PickFromMappedResult(type, propertyKeys, options) : IsMappedKey(key) ? PickFromMappedKey(type, key, options) : isTypeRef && isKeyRef ? Computed("Pick", [type, typeKey], options) : !isTypeRef && isKeyRef ? Computed("Pick", [type, typeKey], options) : isTypeRef && !isKeyRef ? Computed("Pick", [type, typeKey], options) : CreateType({ ...PickResolve(type, propertyKeys), ...options });
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/pick/pick-from-mapped-key.mjs
function FromPropertyKey3(type, key, options) {
  return {
    [key]: Pick(type, [key], Clone(options))
  };
}
function FromPropertyKeys3(type, propertyKeys, options) {
  return propertyKeys.reduce((result, leftKey) => {
    return { ...result, ...FromPropertyKey3(type, leftKey, options) };
  }, {});
}
function FromMappedKey4(type, mappedKey, options) {
  return FromPropertyKeys3(type, mappedKey.keys, options);
}
function PickFromMappedKey(type, mappedKey, options) {
  const properties = FromMappedKey4(type, mappedKey, options);
  return MappedResult(properties);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/partial/partial.mjs
function FromComputed3(target, parameters) {
  return Computed("Partial", [Computed(target, parameters)]);
}
function FromRef8($ref) {
  return Computed("Partial", [Ref($ref)]);
}
function FromProperties16(properties) {
  const partialProperties = {};
  for (const K of globalThis.Object.getOwnPropertyNames(properties))
    partialProperties[K] = Optional(properties[K]);
  return partialProperties;
}
function FromObject10(type, properties) {
  const options = Discard(type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties16(properties);
  return Object2(mappedProperties, options);
}
function FromRest6(types2) {
  return types2.map((type) => PartialResolve(type));
}
function PartialResolve(type) {
  return IsComputed(type) ? FromComputed3(type.target, type.parameters) : IsRef(type) ? FromRef8(type.$ref) : IsIntersect(type) ? Intersect(FromRest6(type.allOf)) : IsUnion(type) ? Union(FromRest6(type.anyOf)) : IsObject3(type) ? FromObject10(type, type.properties) : IsBigInt3(type) ? type : IsBoolean3(type) ? type : IsInteger2(type) ? type : IsLiteral(type) ? type : IsNull3(type) ? type : IsNumber3(type) ? type : IsString3(type) ? type : IsSymbol3(type) ? type : IsUndefined3(type) ? type : Object2({});
}
function Partial(type, options) {
  if (IsMappedResult(type)) {
    return PartialFromMappedResult(type, options);
  } else {
    return CreateType({ ...PartialResolve(type), ...options });
  }
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/partial/partial-from-mapped-result.mjs
function FromProperties17(K, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(K))
    Acc[K2] = Partial(K[K2], Clone(options));
  return Acc;
}
function FromMappedResult11(R, options) {
  return FromProperties17(R.properties, options);
}
function PartialFromMappedResult(R, options) {
  const P = FromMappedResult11(R, options);
  return MappedResult(P);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/required/required.mjs
function FromComputed4(target, parameters) {
  return Computed("Required", [Computed(target, parameters)]);
}
function FromRef9($ref) {
  return Computed("Required", [Ref($ref)]);
}
function FromProperties18(properties) {
  const requiredProperties = {};
  for (const K of globalThis.Object.getOwnPropertyNames(properties))
    requiredProperties[K] = Discard(properties[K], [OptionalKind]);
  return requiredProperties;
}
function FromObject11(type, properties) {
  const options = Discard(type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties18(properties);
  return Object2(mappedProperties, options);
}
function FromRest7(types2) {
  return types2.map((type) => RequiredResolve(type));
}
function RequiredResolve(type) {
  return IsComputed(type) ? FromComputed4(type.target, type.parameters) : IsRef(type) ? FromRef9(type.$ref) : IsIntersect(type) ? Intersect(FromRest7(type.allOf)) : IsUnion(type) ? Union(FromRest7(type.anyOf)) : IsObject3(type) ? FromObject11(type, type.properties) : IsBigInt3(type) ? type : IsBoolean3(type) ? type : IsInteger2(type) ? type : IsLiteral(type) ? type : IsNull3(type) ? type : IsNumber3(type) ? type : IsString3(type) ? type : IsSymbol3(type) ? type : IsUndefined3(type) ? type : Object2({});
}
function Required(type, options) {
  if (IsMappedResult(type)) {
    return RequiredFromMappedResult(type, options);
  } else {
    return CreateType({ ...RequiredResolve(type), ...options });
  }
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/required/required-from-mapped-result.mjs
function FromProperties19(P, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Required(P[K2], options);
  return Acc;
}
function FromMappedResult12(R, options) {
  return FromProperties19(R.properties, options);
}
function RequiredFromMappedResult(R, options) {
  const P = FromMappedResult12(R, options);
  return MappedResult(P);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/module/compute.mjs
function DereferenceParameters(moduleProperties, types2) {
  return types2.map((type) => {
    return IsRef(type) ? Dereference(moduleProperties, type.$ref) : FromType2(moduleProperties, type);
  });
}
function Dereference(moduleProperties, ref) {
  return ref in moduleProperties ? IsRef(moduleProperties[ref]) ? Dereference(moduleProperties, moduleProperties[ref].$ref) : FromType2(moduleProperties, moduleProperties[ref]) : Never();
}
function FromAwaited(parameters) {
  return Awaited(parameters[0]);
}
function FromIndex(parameters) {
  return Index(parameters[0], parameters[1]);
}
function FromKeyOf(parameters) {
  return KeyOf(parameters[0]);
}
function FromPartial(parameters) {
  return Partial(parameters[0]);
}
function FromOmit(parameters) {
  return Omit(parameters[0], parameters[1]);
}
function FromPick(parameters) {
  return Pick(parameters[0], parameters[1]);
}
function FromRequired(parameters) {
  return Required(parameters[0]);
}
function FromComputed5(moduleProperties, target, parameters) {
  const dereferenced = DereferenceParameters(moduleProperties, parameters);
  return target === "Awaited" ? FromAwaited(dereferenced) : target === "Index" ? FromIndex(dereferenced) : target === "KeyOf" ? FromKeyOf(dereferenced) : target === "Partial" ? FromPartial(dereferenced) : target === "Omit" ? FromOmit(dereferenced) : target === "Pick" ? FromPick(dereferenced) : target === "Required" ? FromRequired(dereferenced) : Never();
}
function FromArray11(moduleProperties, type) {
  return Array2(FromType2(moduleProperties, type));
}
function FromAsyncIterator6(moduleProperties, type) {
  return AsyncIterator(FromType2(moduleProperties, type));
}
function FromConstructor6(moduleProperties, parameters, instanceType) {
  return Constructor(FromTypes2(moduleProperties, parameters), FromType2(moduleProperties, instanceType));
}
function FromFunction6(moduleProperties, parameters, returnType) {
  return Function2(FromTypes2(moduleProperties, parameters), FromType2(moduleProperties, returnType));
}
function FromIntersect13(moduleProperties, types2) {
  return Intersect(FromTypes2(moduleProperties, types2));
}
function FromIterator6(moduleProperties, type) {
  return Iterator(FromType2(moduleProperties, type));
}
function FromObject12(moduleProperties, properties) {
  return Object2(globalThis.Object.keys(properties).reduce((result, key) => {
    return { ...result, [key]: FromType2(moduleProperties, properties[key]) };
  }, {}));
}
function FromRecord8(moduleProperties, type) {
  const [value, pattern] = [FromType2(moduleProperties, RecordValue2(type)), RecordPattern(type)];
  const result = CloneType(type);
  result.patternProperties[pattern] = value;
  return result;
}
function FromTransform(moduleProperties, transform) {
  return IsRef(transform) ? { ...Dereference(moduleProperties, transform.$ref), [TransformKind]: transform[TransformKind] } : transform;
}
function FromTuple10(moduleProperties, types2) {
  return Tuple(FromTypes2(moduleProperties, types2));
}
function FromUnion15(moduleProperties, types2) {
  return Union(FromTypes2(moduleProperties, types2));
}
function FromTypes2(moduleProperties, types2) {
  return types2.map((type) => FromType2(moduleProperties, type));
}
function FromType2(moduleProperties, type) {
  return IsOptional(type) ? CreateType(FromType2(moduleProperties, Discard(type, [OptionalKind])), type) : IsReadonly(type) ? CreateType(FromType2(moduleProperties, Discard(type, [ReadonlyKind])), type) : IsTransform(type) ? CreateType(FromTransform(moduleProperties, type), type) : IsArray3(type) ? CreateType(FromArray11(moduleProperties, type.items), type) : IsAsyncIterator3(type) ? CreateType(FromAsyncIterator6(moduleProperties, type.items), type) : IsComputed(type) ? CreateType(FromComputed5(moduleProperties, type.target, type.parameters)) : IsConstructor(type) ? CreateType(FromConstructor6(moduleProperties, type.parameters, type.returns), type) : IsFunction3(type) ? CreateType(FromFunction6(moduleProperties, type.parameters, type.returns), type) : IsIntersect(type) ? CreateType(FromIntersect13(moduleProperties, type.allOf), type) : IsIterator3(type) ? CreateType(FromIterator6(moduleProperties, type.items), type) : IsObject3(type) ? CreateType(FromObject12(moduleProperties, type.properties), type) : IsRecord(type) ? CreateType(FromRecord8(moduleProperties, type)) : IsTuple(type) ? CreateType(FromTuple10(moduleProperties, type.items || []), type) : IsUnion(type) ? CreateType(FromUnion15(moduleProperties, type.anyOf), type) : type;
}
function ComputeType(moduleProperties, key) {
  return key in moduleProperties ? FromType2(moduleProperties, moduleProperties[key]) : Never();
}
function ComputeModuleProperties(moduleProperties) {
  return globalThis.Object.getOwnPropertyNames(moduleProperties).reduce((result, key) => {
    return { ...result, [key]: ComputeType(moduleProperties, key) };
  }, {});
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/module/module.mjs
class TModule {
  constructor($defs) {
    const computed = ComputeModuleProperties($defs);
    const identified = this.WithIdentifiers(computed);
    this.$defs = identified;
  }
  Import(key, options) {
    const $defs = { ...this.$defs, [key]: CreateType(this.$defs[key], options) };
    return CreateType({ [Kind]: "Import", $defs, $ref: key });
  }
  WithIdentifiers($defs) {
    return globalThis.Object.getOwnPropertyNames($defs).reduce((result, key) => {
      return { ...result, [key]: { ...$defs[key], $id: key } };
    }, {});
  }
}
function Module(properties) {
  return new TModule(properties);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/not/not.mjs
function Not2(type, options) {
  return CreateType({ [Kind]: "Not", not: type }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/parameters/parameters.mjs
function Parameters(schema, options) {
  return IsFunction3(schema) ? Tuple(schema.parameters, options) : Never();
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/recursive/recursive.mjs
var Ordinal = 0;
function Recursive(callback, options = {}) {
  if (IsUndefined2(options.$id))
    options.$id = `T${Ordinal++}`;
  const thisType = CloneType(callback({ [Kind]: "This", $ref: `${options.$id}` }));
  thisType.$id = options.$id;
  return CreateType({ [Hint]: "Recursive", ...thisType }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/regexp/regexp.mjs
function RegExp2(unresolved, options) {
  const expr = IsString2(unresolved) ? new globalThis.RegExp(unresolved) : unresolved;
  return CreateType({ [Kind]: "RegExp", type: "RegExp", source: expr.source, flags: expr.flags }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/rest/rest.mjs
function RestResolve(T) {
  return IsIntersect(T) ? T.allOf : IsUnion(T) ? T.anyOf : IsTuple(T) ? T.items ?? [] : [];
}
function Rest(T) {
  return RestResolve(T);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/return-type/return-type.mjs
function ReturnType(schema, options) {
  return IsFunction3(schema) ? CreateType(schema.returns, options) : Never(options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/transform/transform.mjs
class TransformDecodeBuilder {
  constructor(schema) {
    this.schema = schema;
  }
  Decode(decode) {
    return new TransformEncodeBuilder(this.schema, decode);
  }
}

class TransformEncodeBuilder {
  constructor(schema, decode) {
    this.schema = schema;
    this.decode = decode;
  }
  EncodeTransform(encode, schema) {
    const Encode = (value) => schema[TransformKind].Encode(encode(value));
    const Decode = (value) => this.decode(schema[TransformKind].Decode(value));
    const Codec = { Encode, Decode };
    return { ...schema, [TransformKind]: Codec };
  }
  EncodeSchema(encode, schema) {
    const Codec = { Decode: this.decode, Encode: encode };
    return { ...schema, [TransformKind]: Codec };
  }
  Encode(encode) {
    return IsTransform(this.schema) ? this.EncodeTransform(encode, this.schema) : this.EncodeSchema(encode, this.schema);
  }
}
function Transform(schema) {
  return new TransformDecodeBuilder(schema);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/void/void.mjs
function Void(options) {
  return CreateType({ [Kind]: "Void", type: "void" }, options);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/type/type.mjs
var exports_type3 = {};
__export(exports_type3, {
  Void: () => Void,
  Uppercase: () => Uppercase,
  Unsafe: () => Unsafe,
  Unknown: () => Unknown,
  Union: () => Union,
  Undefined: () => Undefined,
  Uncapitalize: () => Uncapitalize,
  Uint8Array: () => Uint8Array2,
  Tuple: () => Tuple,
  Transform: () => Transform,
  TemplateLiteral: () => TemplateLiteral,
  Symbol: () => Symbol2,
  String: () => String2,
  ReturnType: () => ReturnType,
  Rest: () => Rest,
  Required: () => Required,
  RegExp: () => RegExp2,
  Ref: () => Ref,
  Recursive: () => Recursive,
  Record: () => Record,
  ReadonlyOptional: () => ReadonlyOptional,
  Readonly: () => Readonly,
  Promise: () => Promise2,
  Pick: () => Pick,
  Partial: () => Partial,
  Parameters: () => Parameters,
  Optional: () => Optional,
  Omit: () => Omit,
  Object: () => Object2,
  Number: () => Number2,
  Null: () => Null,
  Not: () => Not2,
  Never: () => Never,
  Module: () => Module,
  Mapped: () => Mapped,
  Lowercase: () => Lowercase,
  Literal: () => Literal,
  KeyOf: () => KeyOf,
  Iterator: () => Iterator,
  Intersect: () => Intersect,
  Integer: () => Integer,
  Instantiate: () => Instantiate,
  InstanceType: () => InstanceType,
  Index: () => Index,
  Function: () => Function2,
  Extract: () => Extract,
  Extends: () => Extends,
  Exclude: () => Exclude,
  Enum: () => Enum,
  Date: () => Date2,
  ConstructorParameters: () => ConstructorParameters,
  Constructor: () => Constructor,
  Const: () => Const,
  Composite: () => Composite,
  Capitalize: () => Capitalize,
  Boolean: () => Boolean2,
  BigInt: () => BigInt2,
  Awaited: () => Awaited,
  AsyncIterator: () => AsyncIterator,
  Array: () => Array2,
  Argument: () => Argument,
  Any: () => Any
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/type/index.mjs
var Type = exports_type3;

// packages/wire/src/core/rule.ts
import { MIMEType } from "util";
if (!exports_format.Has("email")) {
  exports_format.Set("email", (value) => /^\S+@\S+\.\S+$/.test(value));
}
if (!exports_format.Has("uuid")) {
  exports_format.Set("uuid", (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}
if (!exports_format.Has("ipv4")) {
  exports_format.Set("ipv4", (value) => /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value));
}
if (!exports_format.Has("ipv6")) {
  exports_format.Set("ipv6", (value) => /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/.test(value));
}
function buildStringDeclaration(parts, defaultValue) {
  const options = {};
  if (defaultValue !== undefined)
    options.default = defaultValue;
  const patterns = [];
  for (const p of parts) {
    const [key, raw] = p.split(":", 2);
    const n = raw !== undefined ? Number(raw) : undefined;
    switch (key) {
      case "min":
        if (Number.isFinite(n))
          options.minLength = n;
        break;
      case "max":
        if (Number.isFinite(n))
          options.maxLength = n;
        break;
      case "size":
        if (Number.isFinite(n)) {
          options.minLength = n;
          options.maxLength = n;
        }
        break;
      case "email":
        options.format = "email";
        break;
      case "url":
        options.format = "uri";
        break;
      case "uuid":
        options.format = "uuid";
        break;
      case "ipv4":
        options.format = "ipv4";
        break;
      case "ipv6":
        options.format = "ipv6";
        break;
      case "alpha":
        patterns.push("^[A-Za-z]+$");
        break;
      case "alpha_num":
        patterns.push("^[A-Za-z0-9]+$");
        break;
      case "alpha_dash":
        patterns.push("^[A-Za-z0-9_-]+$");
        break;
      case "lowercase":
        patterns.push("^[a-z0-9_]*$");
        break;
      case "uppercase":
        patterns.push("^[A-Z0-9_]*$");
        break;
      case "slug":
        patterns.push("^[a-z0-9]+(?:-[a-z0-9]+)*$");
        break;
      case "regex":
        if (raw)
          patterns.push(raw);
        break;
    }
  }
  if (patterns.length)
    options.pattern = patterns[0];
  return Type.String(options);
}
function buildNumberDeclaration(parts, defaultValue) {
  const options = {};
  if (defaultValue !== undefined)
    options.default = defaultValue;
  for (const p of parts) {
    const [key, raw] = p.split(":", 2);
    const n = raw !== undefined ? Number(raw) : undefined;
    if (key === "min" && Number.isFinite(n))
      options.minimum = n;
    if (key === "max" && Number.isFinite(n))
      options.maximum = n;
  }
  return Type.Number(options);
}
function buildIntegerDeclaration(parts, defaultValue) {
  const options = {};
  if (defaultValue !== undefined)
    options.default = defaultValue;
  for (const p of parts) {
    const [key, raw] = p.split(":", 2);
    const n = raw !== undefined ? Number(raw) : undefined;
    if (key === "min" && Number.isFinite(n))
      options.minimum = n;
    if (key === "max" && Number.isFinite(n))
      options.maximum = n;
  }
  return Type.Integer(options);
}
function buildFileDeclaration() {
  const fileSchema = Type.Object({
    name: Type.String(),
    size: Type.Number(),
    type: Type.String(),
    lastModified: Type.Optional(Type.Number()),
    tempId: Type.Optional(Type.String()),
    content: Type.Optional(Type.String())
  });
  return Type.Array(fileSchema);
}
function rule(rules, defaultValue) {
  const parts = rules.split("|").map((p) => p.trim()).filter(Boolean);
  const isOptional = parts.includes("optional") || parts.includes("nullable");
  let schema;
  if (parts.some((p) => p === "file" || p.startsWith("file:"))) {
    schema = buildFileDeclaration();
  } else if (parts.includes("boolean") || parts.includes("bool")) {
    schema = Type.Boolean({ default: defaultValue });
  } else if (parts.includes("integer") || parts.includes("int")) {
    schema = buildIntegerDeclaration(parts, defaultValue);
  } else if (parts.includes("number") || parts.includes("numeric")) {
    schema = buildNumberDeclaration(parts, defaultValue);
  } else {
    schema = buildStringDeclaration(parts, defaultValue);
  }
  return isOptional ? Type.Optional(schema) : schema;
}

class Rule {
  schema;
  customMessage;
  constructor(schema, customMessage) {
    this.schema = schema;
    this.customMessage = customMessage;
  }
  static string(arg) {
    if (arg && typeof arg === "object") {
      const options = {};
      if (arg.min !== undefined)
        options.minLength = arg.min;
      if (arg.max !== undefined)
        options.maxLength = arg.max;
      if (arg.email)
        options.format = "email";
      return Type.String(options);
    }
    return new Rule(Type.String(), arg);
  }
  static number(arg) {
    if (arg && typeof arg === "object") {
      const options = {};
      if (arg.min !== undefined)
        options.minimum = arg.min;
      if (arg.max !== undefined)
        options.maximum = arg.max;
      return Type.Number(options);
    }
    return new Rule(Type.Number(), arg);
  }
  static integer(message) {
    return new Rule(Type.Integer(), message);
  }
  static boolean(message) {
    return new Rule(Type.Boolean(), message);
  }
  static optional(schema) {
    return Type.Optional(schema);
  }
  static in(values, message) {
    return new Rule(Type.Union(values.map((v) => Type.Literal(v))), message);
  }
  static file(message) {
    return new Rule(buildFileDeclaration(), message);
  }
  min(value, message) {
    const s = this.schema;
    const msg = message || this.customMessage;
    if (s.type === "string")
      return new Rule(Type.String({ ...s, minLength: value }), msg);
    if (s.type === "number")
      return new Rule(Type.Number({ ...s, minimum: value }), msg);
    if (s.type === "integer")
      return new Rule(Type.Integer({ ...s, minimum: value }), msg);
    if (s.type === "array")
      return new Rule(Type.Array(s.items, { ...s, minItems: value }), msg);
    return this;
  }
  max(value, message) {
    const s = this.schema;
    const msg = message || this.customMessage;
    if (s.type === "string")
      return new Rule(Type.String({ ...s, maxLength: value }), msg);
    if (s.type === "number")
      return new Rule(Type.Number({ ...s, maximum: value }), msg);
    if (s.type === "integer")
      return new Rule(Type.Integer({ ...s, maximum: value }), msg);
    if (s.type === "array")
      return new Rule(Type.Array(s.items, { ...s, maxItems: value }), msg);
    return this;
  }
  email(message) {
    return new Rule(Type.String({ ...this.schema, format: "email" }), message || this.customMessage);
  }
  getSchema() {
    return this.schema;
  }
  validate(value) {
    const valToValidate = normalizeFileValue(value);
    const compiled = TypeCompiler.Compile(this.schema);
    if (compiled.Check(valToValidate))
      return { success: true, errors: [] };
    if (this.customMessage)
      return { success: false, errors: [this.customMessage] };
    const first = [...compiled.Errors(valToValidate)][0];
    return { success: false, errors: [first?.message || "Validation failed"] };
  }
}
function normalizeFileValue(value) {
  if (value && typeof value === "object" && value.files && Array.isArray(value.files)) {
    return value.files;
  }
  return value;
}
function validateRule(value, rules, customMessage) {
  const parts = rules.split("|").map((p) => p.trim());
  const isRequired = parts.includes("required");
  if (isRequired && (value === undefined || value === null || value === "")) {
    return { success: false, error: customMessage || "The field is required." };
  }
  if (!isRequired && (value === undefined || value === null || value === "")) {
    return { success: true };
  }
  const valToValidate = normalizeFileValue(value);
  if (parts.some((p) => p === "file" || p.startsWith("file:"))) {
    const fileParts = Array.isArray(valToValidate) ? valToValidate : valToValidate ? [valToValidate] : [];
    for (const p of parts) {
      const [key, raw] = p.split(":", 2);
      if (key === "max" && raw && fileParts.length > parseInt(raw)) {
        return { success: false, error: customMessage || `You may not select more than ${raw} file(s).` };
      }
      if (key === "min" && raw && fileParts.length < parseInt(raw)) {
        return { success: false, error: customMessage || `Please select at least ${raw} file(s).` };
      }
    }
    const sizeRule = parts.find((p) => p.startsWith("size:"));
    const mimesRule = parts.find((p) => p.startsWith("mimes:"));
    const maxSize = sizeRule ? parseInt(sizeRule.split(":")[1] || "0") : Infinity;
    const allowedMimes = mimesRule ? (mimesRule.split(":")[1] || "").split(",").map((m) => m.trim().toLowerCase()).filter(Boolean) : [];
    for (const file of fileParts) {
      if (!file)
        continue;
      const typeString = String(file.type || "").toLowerCase();
      let fileMime = null;
      try {
        fileMime = new MIMEType(typeString);
      } catch {}
      if (allowedMimes.length > 0) {
        const fileName = String(file.name || "").toLowerCase();
        const extension = fileName.includes(".") ? fileName.split(".").pop() || "" : "";
        const matches = allowedMimes.some((m) => {
          if (m.includes("/")) {
            if (m.endsWith("/*")) {
              const prefix = m.split("/")[0] || "";
              if (fileMime && fileMime.type === prefix)
                return true;
              return typeString.startsWith(`${prefix}/`);
            }
            if (fileMime && fileMime.essence === m)
              return true;
            return typeString === m;
          }
          return extension === m;
        });
        if (!matches)
          return { success: false, error: customMessage || `The file type is not allowed for ${file.name || "file"}.` };
      }
      if (typeof file.size === "number" && file.size / 1024 > maxSize) {
        return { success: false, error: customMessage || `The file ${file.name || "file"} may not be greater than ${maxSize} kilobytes.` };
      }
    }
    return { success: true };
  }
  const schema = rule(rules);
  const compiled = TypeCompiler.Compile(schema);
  if (compiled.Check(valToValidate))
    return { success: true };
  if (customMessage)
    return { success: false, error: customMessage };
  const first = [...compiled.Errors(valToValidate)][0];
  return { success: false, error: first?.message || "Validation failed" };
}
var RuleEngine = {
  validate(value, ruleDef, _state) {
    if (typeof ruleDef === "string")
      return validateRule(value, ruleDef);
    if (ruleDef instanceof Rule) {
      const result = ruleDef.validate(value);
      return result.success ? { success: true } : { success: false, error: result.errors[0] };
    }
    const compiled = TypeCompiler.Compile(ruleDef);
    const valToValidate = normalizeFileValue(value);
    if (compiled.Check(valToValidate))
      return { success: true };
    const first = [...compiled.Errors(valToValidate)][0];
    return { success: false, error: first?.message || "Validation failed" };
  }
};

// packages/wire/src/core/file.ts
import { existsSync as existsSync2, mkdirSync, readFileSync as readFileSync2, writeFileSync as writeFileSync2, rmSync } from "fs";
import { join as join3, resolve as resolve3 } from "path";
import { randomUUID } from "crypto";

class FileManager {
  dir;
  constructor(dir) {
    this.dir = dir || resolve3(process.cwd(), "node_modules/.wire-tmp");
    if (!existsSync2(this.dir)) {
      mkdirSync(this.dir, { recursive: true });
    }
    this.cleanup();
  }
  async store(buffer, name, mime) {
    const id = randomUUID();
    const path = join3(this.dir, id);
    writeFileSync2(path, buffer);
    const meta = { id, name, mime, size: buffer.length, created: Date.now() };
    writeFileSync2(path + ".meta", JSON.stringify(meta));
    return { ...meta, path };
  }
  get(id) {
    const path = join3(this.dir, id);
    if (!existsSync2(path) || !existsSync2(path + ".meta"))
      return null;
    const meta = JSON.parse(readFileSync2(path + ".meta", "utf-8"));
    const file = readFileSync2(path);
    return { file, meta };
  }
  cleanup() {
    try {
      const now = Date.now();
      const files = __require("fs").readdirSync(this.dir);
      for (const f of files) {
        if (f.endsWith(".meta")) {
          const path = join3(this.dir, f);
          const meta = JSON.parse(readFileSync2(path, "utf-8"));
          if (now - meta.created > 3600000) {
            rmSync(join3(this.dir, meta.id));
            rmSync(path);
          }
        }
      }
    } catch (e) {}
  }
}

// packages/wire/src/core/upload.ts
var COMPLETED_UPLOAD = {
  progress: 100,
  percent: 100,
  loaded: 0,
  total: 0
};

class FileUpload {
  options;
  files = [];
  uploading = { ...COMPLETED_UPLOAD };
  constructor(options = {}) {
    this.options = options;
  }
  get file() {
    return this.files[0];
  }
  async populate(files, component, property) {
    if (!component)
      return;
    const kire2 = component.kire;
    const wireState = kire2?.$kire?.["~wire"];
    if (!wireState)
      return;
    if (!wireState.files) {
      wireState.files = new FileManager(wireState.options?.directoryTmp);
    }
    const manager = wireState.files;
    let inputFiles = Array.isArray(files) ? files : [files];
    inputFiles = inputFiles.filter(Boolean);
    if (this.options.quantity && inputFiles.length > this.options.quantity) {
      if (property)
        component.addError(property, `You may not upload more than ${this.options.quantity} file(s).`);
      inputFiles = inputFiles.slice(0, this.options.quantity);
    }
    const validFiles = [];
    for (const f of inputFiles) {
      let isValid = true;
      const mime = String(f?.type || f?.mimetype || "").toLowerCase();
      if (this.options.types?.length) {
        const allowed = this.options.types.some((t) => mime.includes(String(t).toLowerCase()));
        if (!allowed) {
          isValid = false;
          if (property)
            component.addError(property, `File type ${mime || "unknown"} is not allowed.`);
        }
      }
      if (this.options.maxSize && typeof f?.size === "number" && f.size / 1024 > this.options.maxSize) {
        isValid = false;
        if (property)
          component.addError(property, `File is too large (max ${this.options.maxSize}KB).`);
      }
      if (isValid)
        validFiles.push(f);
    }
    this.uploading = { ...COMPLETED_UPLOAD };
    this.files = await Promise.all(validFiles.map(async (f) => {
      let buffer = null;
      let mime = f.type || f.mimetype || "application/octet-stream";
      let name = f.filename || f.name || "upload.bin";
      if (typeof f.content === "string" && f.content.startsWith("data:")) {
        const matches = f.content.match(/^data:([A-Za-z0-9\-+/.]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mime = matches[1];
          buffer = Buffer.from(matches[2], "base64");
        }
      } else if (f.data && Buffer.isBuffer(f.data)) {
        buffer = f.data;
      } else if (typeof f.toBuffer === "function") {
        buffer = await f.toBuffer();
      }
      if (buffer) {
        const temp = await manager.store(buffer, name, mime);
        return {
          name,
          size: buffer.length,
          type: mime,
          lastModified: f.lastModified,
          tempId: temp.id,
          uploading: { ...COMPLETED_UPLOAD }
        };
      }
      return { ...f, uploading: { ...COMPLETED_UPLOAD } };
    }));
  }
  temporaryUrl(config) {
    const route = config?.route || "/_wire";
    if (this.file?.tempId)
      return `${route}/preview?id=${this.file.tempId}`;
    return "";
  }
  map(callback) {
    return this.files.map(callback);
  }
  toJSON() {
    return {
      _wire_type: "WireFile",
      options: this.options,
      files: this.files.map(({ buffer, content, data, ...rest }) => rest),
      uploading: this.uploading
    };
  }
}
var WireFile = FileUpload;

// packages/wire/src/core/broadcast.ts
function ensureRooms(wire) {
  if (!wire.broadcasts)
    wire.broadcasts = new Map;
  return wire.broadcasts;
}

class WireBroadcast {
  options;
  connections = 0;
  channel = "global";
  component;
  kire;
  boundUpdateHook = false;
  dirtyKeys = new Set;
  constructor(options = {}) {
    this.options = options;
    this.options.autodelete ??= true;
    if (this.options.name)
      this.channel = this.options.name;
  }
  hydrate(component, channel, applySharedState = true) {
    this.component = component;
    this.kire = component.kire;
    if (channel)
      this.channel = channel;
    const wire = this.kire?.$kire?.["~wire"];
    if (!wire)
      return;
    const rooms = ensureRooms(wire);
    let room = rooms.get(this.channel);
    if (!room) {
      room = {
        name: this.channel,
        state: new NullProtoObj,
        components: new Set,
        listeners: new Set,
        password: this.options.password
      };
      rooms.set(this.channel, room);
    }
    if (!room.password && this.options.password)
      room.password = this.options.password;
    if (this.options.maxconnections && room.listeners.size >= this.options.maxconnections) {
      throw new Error("Broadcast room is full");
    }
    room.components.add(component.__id);
    this.connections = room.listeners.size;
    if (applySharedState) {
      const shared = this.filterState(room.state);
      if (Object.keys(shared).length > 0) {
        component.fill(shared);
      }
    }
    if (!this.boundUpdateHook) {
      component.onUpdateState((updates) => {
        for (const key of Object.keys(updates || {})) {
          this.dirtyKeys.add(key);
        }
        this.propagate(updates);
      });
      this.boundUpdateHook = true;
    }
  }
  close() {
    if (!this.component || !this.kire)
      return;
    const wire = this.kire.$kire?.["~wire"];
    const rooms = wire?.broadcasts;
    const room = rooms?.get(this.channel);
    if (!room)
      return;
    room.components.delete(this.component.__id);
    this.connections = room.listeners.size;
    this.gcRoom(this.channel, room);
  }
  emit(event, data) {
    if (!this.kire)
      return;
    const wire = this.kire.$kire?.["~wire"];
    const rooms = wire?.broadcasts;
    const room = rooms?.get(this.channel);
    if (!room || room.listeners.size === 0) {
      this.gcRoom(this.channel, room);
      return;
    }
    const payload = { type: event, channel: this.channel, data, connections: room.listeners.size };
    const stale = [];
    for (const controller of room.listeners) {
      try {
        this.pushEvent(controller, event, payload);
      } catch {
        stale.push(controller);
      }
    }
    if (stale.length > 0) {
      stale.forEach((c) => room.listeners.delete(c));
      this.gcRoom(this.channel, room);
    }
  }
  update(component) {
    if (!this.kire || this.component?.__id !== component.__id) {
      this.hydrate(component, undefined, true);
    }
    if (!this.kire)
      return;
    const wire = this.kire.$kire?.["~wire"];
    const rooms = ensureRooms(wire);
    let room = rooms.get(this.channel);
    if (!room) {
      room = {
        name: this.channel,
        state: new NullProtoObj,
        components: new Set,
        listeners: new Set,
        password: this.options.password
      };
      rooms.set(this.channel, room);
    }
    if (!room.password && this.options.password)
      room.password = this.options.password;
    const current = this.filterState(component.getPublicProperties());
    if (Object.keys(current).length === 0)
      return;
    const roomCurrent = this.filterState(room.state);
    const roomHasState = Object.keys(roomCurrent).length > 0;
    const dirtyCurrent = this.filterState(this.pickKeys(current, this.dirtyKeys));
    if (roomHasState && Object.keys(dirtyCurrent).length === 0) {
      component.fill(roomCurrent);
      return;
    }
    const source = roomHasState ? dirtyCurrent : current;
    if (Object.keys(source).length === 0)
      return;
    const changed = new NullProtoObj;
    for (const [key, value] of Object.entries(source)) {
      if (JSON.stringify(room.state[key]) !== JSON.stringify(value)) {
        changed[key] = value;
      }
    }
    if (Object.keys(changed).length === 0)
      return;
    Object.assign(room.state, changed);
    this.emit("wire:broadcast:update", changed);
    for (const key of Object.keys(changed)) {
      this.dirtyKeys.delete(key);
    }
  }
  connectSSE(controller) {
    if (!this.kire)
      return;
    const wire = this.kire.$kire?.["~wire"];
    const rooms = ensureRooms(wire);
    let room = rooms.get(this.channel);
    if (!room) {
      room = {
        name: this.channel,
        state: new NullProtoObj,
        components: new Set,
        listeners: new Set,
        password: this.options.password
      };
      rooms.set(this.channel, room);
    }
    room.listeners.add(controller);
    this.connections = room.listeners.size;
    const snapshot = this.filterState(room.state);
    try {
      this.pushEvent(controller, "wire:broadcast:snapshot", {
        type: "wire:broadcast:snapshot",
        channel: this.channel,
        data: snapshot,
        connections: room.listeners.size
      });
    } catch {
      room.listeners.delete(controller);
      this.connections = room.listeners.size;
      this.gcRoom(this.channel, room);
    }
  }
  disconnectSSE(controller) {
    if (!this.kire)
      return;
    const wire = this.kire.$kire?.["~wire"];
    const rooms = wire?.broadcasts;
    const room = rooms?.get(this.channel);
    if (!room)
      return;
    room.listeners.delete(controller);
    this.connections = room.listeners.size;
    this.gcRoom(this.channel, room);
  }
  propagate(updates) {
    if (!this.kire)
      return;
    const wire = this.kire.$kire?.["~wire"];
    const rooms = ensureRooms(wire);
    let room = rooms.get(this.channel);
    if (!room) {
      room = {
        name: this.channel,
        state: new NullProtoObj,
        components: new Set,
        listeners: new Set,
        password: this.options.password
      };
      rooms.set(this.channel, room);
    }
    if (!room.password && this.options.password)
      room.password = this.options.password;
    const filtered = this.filterState(updates);
    if (Object.keys(filtered).length === 0)
      return;
    const changed = new NullProtoObj;
    for (const [key, value] of Object.entries(filtered)) {
      if (JSON.stringify(room.state[key]) !== JSON.stringify(value)) {
        changed[key] = value;
      }
    }
    if (Object.keys(changed).length === 0)
      return;
    Object.assign(room.state, changed);
    this.emit("wire:broadcast:update", changed);
  }
  filterState(state) {
    const result = new NullProtoObj;
    for (const [key, val] of Object.entries(state || {})) {
      if (this.options.excludes?.includes(key))
        continue;
      if (this.options.includes && !this.options.includes.includes(key))
        continue;
      result[key] = val;
    }
    return result;
  }
  gcRoom(name, room) {
    if (!this.options.autodelete || !this.kire || !room)
      return;
    if (room.listeners.size > 0)
      return;
    if (Object.keys(room.state || {}).length > 0)
      return;
    const wire = this.kire.$kire?.["~wire"];
    const rooms = wire?.broadcasts;
    rooms?.delete(name);
  }
  pushEvent(controller, event, payload) {
    controller.enqueue(`event: ${event}
`);
    controller.enqueue(`data: ${JSON.stringify(payload)}

`);
  }
  pickKeys(source, keys) {
    const out = new NullProtoObj;
    for (const key of keys) {
      if (key in source)
        out[key] = source[key];
    }
    return out;
  }
  verifyPassword(password) {
    if (!this.options.password)
      return true;
    return String(password || "") === String(this.options.password);
  }
  getChannel() {
    return this.channel;
  }
}

// packages/wire/src/core/component.ts
class Component {
  __id = Math.random().toString(36).slice(2);
  __name = "";
  __events = [];
  __streams = [];
  __redirect = null;
  __errors = {};
  __urlUpdate = undefined;
  __updateCallbacks = [];
  casts = {};
  listeners = {};
  queryString = [];
  kire;
  $globals = {};
  $props = {};
  constructor() {
    return new Proxy(this, {
      set: (target, prop, value, receiver) => {
        const oldVal = target[prop];
        const res = Reflect.set(target, prop, value, receiver);
        if (res && oldVal !== value && typeof prop === "string" && !prop.startsWith("__")) {
          for (const cb of this.__updateCallbacks) {
            cb({ [prop]: value });
          }
          this.updated(prop, value);
        }
        return res;
      }
    });
  }
  _setKire(kire2) {
    this.kire = kire2;
    this.$globals = kire2.$globals;
    this.$props = kire2.$props;
  }
  async mount(..._args) {}
  async hydrate() {}
  async updating(name, value) {}
  async updated(name, value) {}
  async rendering() {}
  async rendered() {}
  emit(name, ...params) {
    this.__events.push({ name, params });
  }
  stream(target, content, replace = false, method = "update") {
    this.__streams.push({ target, content, replace, method });
  }
  redirect(url) {
    this.__redirect = url;
  }
  rule(rules, message) {
    return { _is_rule_helper: true, rules, message };
  }
  validate(rules) {
    this.clearErrors();
    let isValid = true;
    const state = this.getPublicProperties();
    for (const [prop, validatorOrArray] of Object.entries(rules)) {
      const val = this[prop];
      const validators = Array.isArray(validatorOrArray) ? validatorOrArray : [validatorOrArray];
      for (const validator of validators) {
        if (typeof validator === "string") {
          const result = validateRule(val, validator);
          if (!result.success) {
            this.addError(prop, result.error || "Invalid");
            isValid = false;
            break;
          }
        } else if (validator instanceof Rule) {
          const result = validator.validate(val);
          if (!result.success) {
            this.addError(prop, result.errors[0] || "Invalid");
            isValid = false;
            break;
          }
        } else if (typeof validator === "object" && validator !== null) {
          if ("kind" in validator || "type" in validator) {
            const compiled = TypeCompiler.Compile(validator);
            const valToValidate = val && typeof val === "object" && Array.isArray(val.files) ? val.files : val;
            if (!compiled.Check(valToValidate)) {
              const error = [...compiled.Errors(valToValidate)][0];
              this.addError(prop, error?.message || "Invalid");
              isValid = false;
              break;
            }
          } else if ("_is_rule_helper" in validator && validator._is_rule_helper) {
            const helper = validator;
            const result = validateRule(val, helper.rules, helper.message);
            if (!result.success) {
              this.addError(prop, result.error || "Invalid");
              isValid = false;
              break;
            }
          } else {
            const result = RuleEngine.validate(val, validator, state);
            if (!result.success) {
              this.addError(prop, result.error || "Invalid");
              isValid = false;
              break;
            }
          }
        } else if (typeof validator === "function") {
          const result = validator(val, state);
          if (result === false || typeof result === "string") {
            this.addError(prop, typeof result === "string" ? result : "Invalid");
            isValid = false;
            break;
          }
        }
      }
    }
    return isValid;
  }
  addError(field, message) {
    this.__errors[field] = message;
  }
  clearErrors(field) {
    if (field)
      delete this.__errors[field];
    else
      this.__errors = {};
  }
  fill(state) {
    for (const [key, value] of Object.entries(state)) {
      if (key in this && !key.startsWith("__")) {
        if (this[key] instanceof FileUpload && value && typeof value === "object" && value._wire_type === "WireFile") {
          this[key].options = value.options || {};
          this[key].files = value.files || [];
          this[key].uploading = value.uploading || { progress: 100, percent: 100, loaded: 0, total: 0 };
        } else if (this.casts[key] && value && typeof value === "object" && !Array.isArray(value)) {
          const Target = this.casts[key];
          const instance = new Target;
          if (typeof instance.fill === "function")
            instance.fill(value);
          else
            Object.assign(instance, value);
          this[key] = instance;
        } else if (typeof this[key] === "string" && value && typeof value === "object") {
          this[key] = "";
        } else {
          this[key] = value;
        }
      }
    }
  }
  getPublicProperties() {
    const props = {};
    const keys = Object.getOwnPropertyNames(this);
    for (const key of keys) {
      if (key.startsWith("__") || key.startsWith("$") || key === "kire" || key === "casts" || key === "listeners" || key === "queryString" || typeof this[key] === "function")
        continue;
      if (this[key] instanceof WireBroadcast)
        continue;
      props[key] = this[key];
    }
    return props;
  }
  getDataForRender() {
    const props = this.getPublicProperties();
    let proto = Object.getPrototypeOf(this);
    while (proto && proto !== Component.prototype && proto !== Object.prototype) {
      for (const [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
        if (desc.get && !key.startsWith("__") && key !== "constructor") {
          try {
            props[key] = this[key];
          } catch {}
        }
      }
      proto = Object.getPrototypeOf(proto);
    }
    return props;
  }
  _getEffects() {
    return {
      events: this.__events,
      streams: this.__streams,
      redirect: this.__redirect,
      errors: this.__errors,
      listeners: this.listeners,
      url: this.__urlUpdate
    };
  }
  onUpdateState(callback) {
    this.__updateCallbacks.push(callback);
  }
  view(path, locals = {}) {
    if (!this.kire)
      throw new Error("Kire instance not available");
    return this.kire.view(path, { ...this.getDataForRender(), errors: this.__errors, ...locals });
  }
}

// packages/wire/src/core/checksum.ts
import { createHmac, timingSafeEqual } from "crypto";
function normalize(value, seen = new WeakSet) {
  if (value === null || typeof value !== "object")
    return value;
  if (Array.isArray(value))
    return value.map((v) => normalize(v, seen));
  if (typeof value.toJSON === "function") {
    try {
      return normalize(value.toJSON(), seen);
    } catch {}
  }
  if (seen.has(value))
    return;
  seen.add(value);
  const out = {};
  for (const key of Object.keys(value).sort()) {
    const v = value[key];
    if (typeof v === "undefined" || typeof v === "function" || typeof v === "symbol")
      continue;
    out[key] = normalize(v, seen);
  }
  seen.delete(value);
  return out;
}

class ChecksumManager {
  secret;
  constructor(secret) {
    this.secret = secret;
  }
  generate(state, wireKey = "", memo = {}) {
    const content = JSON.stringify({
      v: 2,
      state: normalize(state),
      memo: normalize(memo)
    });
    const hmacKey = this.secret + wireKey;
    return createHmac("sha256", hmacKey).update(content).digest("hex");
  }
  verify(checksum, state, wireKey = "", memo = {}) {
    const actualBuffer = Buffer.from(checksum);
    const candidates = [
      this.generate(state, wireKey, memo),
      this.generate(state, wireKey)
    ];
    for (const expected of candidates) {
      const expectedBuffer = Buffer.from(expected);
      if (expectedBuffer.length !== actualBuffer.length)
        continue;
      if (timingSafeEqual(expectedBuffer, actualBuffer))
        return true;
    }
    return false;
  }
}

// packages/wire/src/core/processor.ts
var FORBIDDEN_METHODS = new Set([
  "constructor",
  "mount",
  "hydrate",
  "updating",
  "updated",
  "rendering",
  "rendered",
  "render",
  "fill",
  "validate",
  "addError",
  "clearErrors",
  "emit",
  "stream",
  "redirect",
  "rule",
  "_setKire",
  "_getEffects",
  "getPublicProperties",
  "getDataForRender",
  "onUpdateState"
]);
function isCallableAction(instance, methodName) {
  if (!methodName || methodName === "$refresh")
    return true;
  if (methodName.startsWith("_"))
    return false;
  if (methodName.startsWith("$"))
    return false;
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(methodName))
    return false;
  if (FORBIDDEN_METHODS.has(methodName))
    return false;
  return typeof instance?.[methodName] === "function";
}
async function processRequest(kire2, payload) {
  const wire = kire2.$kire["~wire"];
  if (!wire)
    throw new Error("Wire system not initialized");
  const ComponentClass = wire.registry.get(payload.component);
  if (!ComponentClass)
    throw new Error(`Component "${payload.component}" not found.`);
  const wireKey = kire2.$wireKey || "";
  if (payload.state && payload.checksum) {
    if (!wire.checksum.verify(payload.checksum, payload.state, wireKey, { id: payload.id, component: payload.component })) {
      throw new Error("Security Violation: State checksum mismatch.");
    }
  }
  const instance = new ComponentClass;
  instance._setKire(kire2);
  instance.__id = payload.id;
  instance.__name = payload.component;
  if (payload.state)
    instance.fill(payload.state);
  await instance.hydrate();
  const broadcasts = Object.values(instance).filter((x) => x instanceof WireBroadcast);
  broadcasts.forEach((b) => b.hydrate(instance));
  if (payload.updates) {
    for (const [prop, val] of Object.entries(payload.updates)) {
      if (prop in instance && !prop.startsWith("__")) {
        const current = instance[prop];
        await instance.updating(prop, val);
        if (current instanceof FileUpload) {
          const files = val?._wire_type === "WireFile" ? val.files : Array.isArray(val) ? val : [val];
          instance.clearErrors(prop);
          await current.populate(files.filter(Boolean), instance, prop);
        } else {
          if (typeof current === "string" && val && typeof val === "object") {
            instance[prop] = "";
          } else {
            instance[prop] = val;
          }
          instance.clearErrors(prop);
        }
      }
    }
  }
  if (payload.method && payload.method !== "$refresh") {
    if (!isCallableAction(instance, payload.method)) {
      throw new Error(`Security Violation: Method "${payload.method}" is not callable.`);
    }
    const method = instance[payload.method];
    if (typeof method === "function") {
      await method.apply(instance, payload.params || []);
    }
  }
  await instance.rendering();
  let html = await instance.render();
  await instance.rendered();
  const finalState = instance.getPublicProperties();
  const newChecksum = wire.checksum.generate(finalState, wireKey, { id: instance.__id, component: instance.__name });
  const stateStr = JSON.stringify(finalState).replace(/"/g, "&quot;");
  const listenersStr = JSON.stringify(instance.listeners || {}).replace(/"/g, "&quot;");
  const wrappedHtml = `<div wire:id="${instance.__id}" wire:component="${instance.__name}" wire:state="${stateStr}" wire:checksum="${newChecksum}" wire:listeners="${listenersStr}">${html}</div>`;
  return {
    id: instance.__id,
    html: wrappedHtml,
    state: finalState,
    checksum: newChecksum,
    effects: instance._getEffects()
  };
}

// packages/wire/src/core/discovery.ts
import { existsSync as existsSync3, readdirSync as readdirSync2, statSync as statSync3 } from "fs";
import { join as join4, parse, resolve as resolve4 } from "path";
async function discoverComponents(kire2, pattern) {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  const root = process.cwd();
  for (const p of patterns) {
    let searchDir = resolve4(root, p.replace(/\*.*$/, ""));
    if (!existsSync3(searchDir))
      continue;
    const files = walk(searchDir);
    for (const file of files) {
      if ((file.endsWith(".js") || file.endsWith(".ts")) && !file.endsWith(".d.ts")) {
        try {
          const mod = await import(file);
          const Comp = mod.default || Object.values(mod).find((e) => typeof e === "function" && e.prototype instanceof Component);
          if (Comp) {
            const relPath = file.slice(searchDir.length + 1);
            const parsed = parse(relPath);
            const dirParts = parsed.dir ? parsed.dir.split(/[\/]/) : [];
            const name = [...dirParts, parsed.name].join(".").toLowerCase();
            kire2.wireRegister(name, Comp);
          }
        } catch (e) {
          console.error(`[Wire:Discover] Failed to load ${file}:`, e);
        }
      }
    }
  }
}
function walk(dir) {
  let results = [];
  try {
    const list = readdirSync2(dir);
    for (const file of list) {
      const path = join4(dir, file);
      const stat = statSync3(path);
      if (stat && stat.isDirectory())
        results = results.concat(walk(path));
      else
        results.push(path);
    }
  } catch (e) {}
  return results;
}

// packages/wire/src/core/assets.ts
import { existsSync as existsSync4, readFileSync as readFileSync3 } from "fs";
import { dirname, resolve as resolve5 } from "path";
import { fileURLToPath } from "url";
async function getAssetContent(filename) {
  const __dirname2 = dirname(fileURLToPath(import.meta.url));
  const pathsToTry = [
    resolve5(__dirname2, "../../dist/client", filename),
    resolve5(__dirname2, "../web", filename),
    resolve5(process.cwd(), "packages/wire/dist/client", filename),
    resolve5(process.cwd(), "dist/client", filename),
    resolve5(process.cwd(), "node_modules/@kirejs/wire/dist/client", filename)
  ];
  for (const p of pathsToTry) {
    if (existsSync4(p)) {
      try {
        const content = readFileSync3(p);
        const contentType = filename.endsWith(".js") ? "application/javascript" : "text/css";
        return { content, contentType };
      } catch (e) {}
    }
  }
  return null;
}

// packages/wire/src/adapters/http-sse.ts
var FORBIDDEN_METHODS2 = new Set([
  "constructor",
  "mount",
  "hydrate",
  "updating",
  "updated",
  "rendering",
  "rendered",
  "render",
  "fill",
  "validate",
  "addError",
  "clearErrors",
  "emit",
  "stream",
  "redirect",
  "rule",
  "_setKire",
  "_getEffects",
  "getPublicProperties",
  "getDataForRender",
  "onUpdateState"
]);
function isCallableAction2(instance, methodName) {
  if (!methodName || methodName === "$refresh")
    return true;
  if (methodName.startsWith("_"))
    return false;
  if (methodName.startsWith("$"))
    return false;
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(methodName))
    return false;
  if (FORBIDDEN_METHODS2.has(methodName))
    return false;
  return typeof instance?.[methodName] === "function";
}
async function processWireAction(kire2, payload) {
  const wire = kire2.$kire["~wire"];
  if (!wire)
    throw new Error("Wire system not initialized");
  const ComponentClass = wire.registry.get(payload.component);
  if (!ComponentClass) {
    throw new Error(`Component "${payload.component}" not found.`);
  }
  const wireKey = kire2.$wireKey || "";
  if (payload.state && payload.checksum) {
    if (!wire.checksum.verify(payload.checksum, payload.state, wireKey, { id: payload.id, component: payload.component })) {
      throw new Error("Invalid state checksum.");
    }
  }
  const instance = new ComponentClass;
  instance._setKire(kire2);
  instance.__id = payload.id;
  instance.__name = payload.component;
  if (payload.state)
    instance.fill(payload.state);
  await instance.hydrate();
  const broadcasts = Object.values(instance).filter((x) => x instanceof WireBroadcast);
  broadcasts.forEach((b) => b.hydrate(instance));
  if (payload.updates) {
    for (const [prop, val] of Object.entries(payload.updates)) {
      if (prop in instance && !prop.startsWith("__")) {
        const current = instance[prop];
        await instance.updating(prop, val);
        if (current instanceof FileUpload) {
          const files = val?._wire_type === "WireFile" ? val.files : Array.isArray(val) ? val : [val];
          instance.clearErrors(prop);
          await current.populate(files.filter(Boolean), instance, prop);
        } else {
          instance[prop] = val;
          instance.clearErrors(prop);
        }
      }
    }
  }
  if (payload.method && payload.method !== "$refresh") {
    if (!isCallableAction2(instance, payload.method)) {
      throw new Error(`Security Violation: Method "${payload.method}" is not callable.`);
    }
    const method = instance[payload.method];
    if (typeof method === "function") {
      await method.apply(instance, payload.params || []);
    }
  }
  await instance.rendering();
  const html = await instance.render();
  await instance.rendered();
  const state = instance.getPublicProperties();
  const effects = instance._getEffects();
  const newChecksum = wire.checksum.generate(state, wireKey, { id: instance.__id, component: instance.__name });
  const listenersStr = JSON.stringify(instance.listeners || {}).replace(/"/g, "&quot;");
  const stateStr = JSON.stringify(state).replace(/"/g, "&quot;");
  const wrappedHtml = `<div wire:id="${instance.__id}" wire:component="${instance.__name}" wire:state="${stateStr}" wire:checksum="${newChecksum}" wire:listeners="${listenersStr}">${html}</div>`;
  return {
    id: instance.__id,
    html: wrappedHtml,
    state,
    checksum: newChecksum,
    effects
  };
}
// packages/wire/src/traits/pagination.ts
function WithPagination(Base) {
  return class WithPagination2 extends Base {
    page = 1;
    perPage = 10;
    constructor(...args) {
      super(...args);
      if (!this.queryString)
        this.queryString = [];
      if (!this.queryString.includes("page"))
        this.queryString.push("page");
    }
    nextPage() {
      this.page++;
    }
    previousPage() {
      if (this.page > 1)
        this.page--;
    }
    gotoPage(page) {
      this.page = page;
    }
    resetPage() {
      this.page = 1;
    }
    paginate(items) {
      const start = (this.page - 1) * this.perPage;
      const end = start + this.perPage;
      return {
        data: items.slice(start, end),
        total: items.length,
        currentPage: this.page,
        perPage: this.perPage,
        lastPage: Math.ceil(items.length / this.perPage),
        hasMore: end < items.length,
        from: start + 1,
        to: Math.min(end, items.length)
      };
    }
  };
}

// packages/wire/src/page-component.ts
class BasePageComponent extends Component {
  render() {
    return "";
  }
}
var PageComponent = WithPagination(BasePageComponent);
var WirePageComponent = PageComponent;

// packages/wire/src/index.ts
function resolveWireComponent(input) {
  if (typeof input === "function" && input.prototype instanceof Component) {
    return input;
  }
  if (input && typeof input === "object") {
    const mod = input;
    if (typeof mod.default === "function" && mod.default.prototype instanceof Component) {
      return mod.default;
    }
    for (const value of Object.values(mod)) {
      if (typeof value === "function" && value.prototype instanceof Component) {
        return value;
      }
    }
  }
  return null;
}
var wirePlugin = kirePlugin({
  route: "/_wire"
}, (kire2, options) => {
  const secret = options.secret || randomUUID2();
  if (!kire2.$kire["~wire"]) {
    kire2.$kire["~wire"] = {
      registry: new Map,
      checksum: new ChecksumManager(secret),
      files: undefined,
      broadcasts: undefined,
      options: { ...options, secret }
    };
  }
  const wire = kire2.$kire["~wire"];
  const renderWireComponentCode = (nameExpr, paramsExpr) => `{
        const $name = ${nameExpr};
        const $params = ${paramsExpr};
        const $wireState = this.$kire["~wire"];
        const $ComponentClass = $wireState.registry.get($name);
        
        if (!$ComponentClass) {
            $kire_response += '<!-- Wire: Component "' + $name + '" not found -->';
        } else {
            const $instance = new $ComponentClass();
            $instance._setKire(this);
            $instance.__name = $name;

            await $instance.mount($params);
            $instance.fill($params);

            const $html = await $instance.render();
            const $state = $instance.getPublicProperties();
            const $id = $instance.__id;
            const $wireKey = this.$wireKey || "";
            const $checksum = $wireState.checksum.generate($state, $wireKey, { id: $id, component: $name });
            const $listeners = $instance.listeners || {};
            
            const $stateStr = JSON.stringify($state).replace(/"/g, '&quot;');
            const $listenersStr = JSON.stringify($listeners).replace(/"/g, '&quot;');
            
            $kire_response += '<div wire:id="' + $id + '" wire:component="' + $name + '" wire:state="' + $stateStr + '" wire:checksum="' + $checksum + '" wire:listeners="' + $listenersStr + '">';
            $kire_response += $html || '';
            $kire_response += '</div>';
        }
    }`;
  kire2.directive({
    name: "kirewire",
    children: false,
    onCall: (api) => {
      const route = wire.options.route || "/_wire";
      const suffix = api.kire.$production ? "" : `?v=${Date.now()}`;
      api.append(`<script type="module" src="${route}/wire.js${suffix}" defer></script>`);
    }
  });
  kire2.directive({
    name: "wire",
    children: false,
    onCall: (api) => {
      const nameExpr = api.getArgument(0) || api.getAttribute("name");
      const paramsExpr = api.getArgument(1) || api.getAttribute("params") || "{}";
      if (!nameExpr) {
        api.append(`<!-- Wire: Missing component name in @wire(...) -->`);
        return;
      }
      api.markAsync();
      api.write(renderWireComponentCode(nameExpr, paramsExpr));
    }
  });
  kire2.directive({
    name: "live",
    children: false,
    onCall: (api) => kire2.getDirective("wire")?.onCall(api)
  });
  kire2.element({
    name: /^wire:/,
    onCall: (api) => {
      const tagName = api.node.tagName;
      const componentName = tagName.slice(5);
      const attrs = api.node.attributes || {};
      const propsStr = Object.keys(attrs).map((k) => `'${k}': ${api.getAttribute(k)}`).join(",");
      api.markAsync();
      api.write(renderWireComponentCode(JSON.stringify(componentName), `{ ${propsStr} }`));
    }
  });
  const setup = (instance) => {
    instance.wireRegister = async (nameOrPattern, component) => {
      if (typeof component === "undefined") {
        await discoverComponents(instance, nameOrPattern);
        return;
      }
      const resolved = resolveWireComponent(component);
      if (!resolved) {
        throw new Error(`Wire component "${nameOrPattern}" must be a Component class or module export.`);
      }
      wire.registry.set(nameOrPattern, resolved);
    };
    instance.wireKey = (key) => {
      instance.$wireKey = key;
      return instance;
    };
    Object.defineProperty(instance, "$wire", {
      get: () => ({
        ...wire.options,
        discover: (pattern) => discoverComponents(instance, pattern)
      }),
      configurable: true
    });
    instance.wireRequest = async (req) => {
      const url = new URL(req.url, "http://localhost");
      const route = wire.options.route || "/_wire";
      if (url.pathname.startsWith(route) && (url.pathname.endsWith(".js") || url.pathname.endsWith(".css"))) {
        const filename = url.pathname.split("/").pop();
        const asset = await getAssetContent(filename);
        if (asset) {
          const cacheControl = instance.$production ? "public, max-age=604800, immutable" : "no-store";
          return {
            status: 200,
            headers: {
              "Content-Type": asset.contentType,
              "Cache-Control": cacheControl
            },
            result: asset.content
          };
        }
      }
      if (url.pathname === `${route}/preview`) {
        const id = req.query?.id;
        const files = wire.files;
        const file = files ? files.get(id) : null;
        if (file) {
          return { status: 200, headers: { "Content-Type": file.meta.mime }, result: file.file };
        }
        return { status: 404, result: "File not found" };
      }
      if (url.pathname === `${route}/broadcast` || url.pathname === `${route}/events` || url.pathname === `${route}/broadcast/stream`) {
        const componentName = String(req.query?.component || "");
        if (!componentName) {
          return { status: 400, result: "Missing component query param" };
        }
        const ComponentClass = wire.registry.get(componentName);
        if (!ComponentClass) {
          return { status: 404, result: "Component not found" };
        }
        const room = String(req.query?.channel || "global");
        const password = req.query?.password != null ? String(req.query.password) : undefined;
        const instanceComp = new ComponentClass;
        instanceComp._setKire(instance);
        instanceComp.__name = componentName;
        instanceComp.__id = String(req.query?.id || `sse_${Math.random().toString(36).slice(2)}`);
        await instanceComp.mount(req.query || {});
        await instanceComp.hydrate();
        const broadcasters = Object.values(instanceComp).filter((x) => x instanceof WireBroadcast);
        const selected = broadcasters.find((b) => b.options?.name === room) || broadcasters[0];
        if (!selected) {
          return { status: 404, result: "No WireBroadcast found in component" };
        }
        if (!selected.verifyPassword(password)) {
          return { status: 403, result: "Invalid broadcast password" };
        }
        selected.hydrate(instanceComp, room);
        let currentController = null;
        let heartbeat = null;
        const stream = new ReadableStream({
          start(controller) {
            currentController = controller;
            try {
              controller.enqueue(`retry: 3000
`);
              selected.connectSSE(controller);
              controller.enqueue(`event: wire:broadcast:connected
`);
              controller.enqueue(`data: ${JSON.stringify({
                type: "wire:broadcast:connected",
                channel: selected.getChannel(),
                component: componentName,
                connections: selected.connections
              })}

`);
            } catch {}
            heartbeat = setInterval(() => {
              try {
                controller.enqueue(`: keep-alive

`);
              } catch {
                if (currentController)
                  selected.disconnectSSE(currentController);
                currentController = null;
                if (heartbeat)
                  clearInterval(heartbeat);
                heartbeat = null;
              }
            }, 15000);
          },
          cancel() {
            if (currentController)
              selected.disconnectSSE(currentController);
            currentController = null;
            if (heartbeat)
              clearInterval(heartbeat);
            heartbeat = null;
          }
        });
        return {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no"
          },
          result: stream
        };
      }
      const body = req.body || {};
      if (body.components || body.component) {
        try {
          if (body.component) {
            const res = await processRequest(instance, body);
            return {
              status: 200,
              headers: { "Content-Type": "application/json" },
              result: JSON.stringify(res)
            };
          }
          const payloads = body.components || [body];
          const results = [];
          const latestByComponent = new Map;
          for (const payload of payloads) {
            try {
              const key = String(payload.id || "");
              const last = latestByComponent.get(key);
              const effectivePayload = {
                ...payload,
                state: last?.state ?? payload.state,
                checksum: last?.checksum ?? payload.checksum
              };
              const res = await processRequest(instance, effectivePayload);
              if (res.state && res.checksum) {
                latestByComponent.set(key, { state: res.state, checksum: res.checksum });
              }
              results.push(res);
            } catch (e) {
              results.push({ id: payload.id, error: e.message });
            }
          }
          return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            result: JSON.stringify({ results })
          };
        } catch (e) {
          return {
            status: 500,
            headers: { "Content-Type": "application/json" },
            result: JSON.stringify({ error: e.message })
          };
        }
      }
      return { status: 404, result: "Not found" };
    };
  };
  setup(kire2);
  kire2.onFork(setup);
});
var src_default = wirePlugin;
export {
  wirePlugin,
  validateRule,
  rule,
  processWireAction,
  processRequest,
  src_default as default,
  WirePageComponent,
  WireFile,
  WireBroadcast,
  RuleEngine,
  Rule,
  PageComponent,
  FileUpload,
  Component
};
