/*
Language: Kire
Requires: xml.js, javascript.js
Author: Drysius
Description: Kire templates with HTML, directives and interpolations
Website: https://github.com/drysius/kire
Category: template
*/

(() => {
  const registerKireLanguage = (hljs) => {
    if (!hljs || typeof hljs.registerLanguage !== "function") return;
    if (typeof hljs.getLanguage === "function" && hljs.getLanguage("kire")) return;

    hljs.registerLanguage("kire", (hljsInstance) => ({
      name: "Kire",
      aliases: ["html.kire", "kire-html"],
      subLanguage: "xml",
      contains: [
        hljsInstance.COMMENT(/\{\{--/, /--\}\}/, {
          relevance: 10,
        }),
        {
          scope: "template-variable",
          begin: /@\{\{/,
          end: /\}\}/,
          relevance: 8,
        },
        {
          begin: /\{\{\{/,
          beginScope: "template-variable",
          end: /\}\}\}/,
          endScope: "template-variable",
          subLanguage: "javascript",
          relevance: 10,
        },
        {
          begin: /\{\{/,
          beginScope: "template-variable",
          end: /\}\}/,
          endScope: "template-variable",
          subLanguage: "javascript",
          relevance: 10,
        },
        {
          begin: /(@[A-Za-z_][\w:-]*)(\s*\()/,
          beginScope: {
            1: "template-tag",
            2: "punctuation",
          },
          end: /\)/,
          endScope: "punctuation",
          subLanguage: "javascript",
          relevance: 10,
        },
        {
          scope: "template-tag",
          match: /@[A-Za-z_][\w:-]*/,
          relevance: 8,
        },
      ],
    }));
  };

  const boot = () => registerKireLanguage(window.hljs);

  if (typeof window !== "undefined") {
    boot();
    window.addEventListener("load", boot, { once: true });
  }
})();
