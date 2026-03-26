(() => {
	const STORAGE_KEY = "theme";
	const PLAYGROUND_STORAGE_PREFIX = "kire-browser-playground";
	const PLAYGROUND_RUNTIME_URL = "/assets/kire-browser.js";
	const MONACO_LOADER_URL =
		"https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.22.3/min/vs/loader.min.js";
	const MONACO_BASE_URL =
		"https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.22.3/min/vs";
	const PLAYGROUND_PRESETS = {
		starter: {
			mode: "view",
			viewPath: "views.playground",
			template: `@layout("layouts.app", { title })
  @slot("content")
    <h1>{{ title }}</h1>
    <p>Welcome {{ user.name }}.</p>

    <x-ui/badge label="{{ user.role }}"></x-ui/badge>

    <ul>
      @for(tag of user.tags)
        <li>{{ tag }}</li>
      @empty
        <li>No tags yet.</li>
      @end
    </ul>
  @end
@end`,
			locals: `{
  "title": "kire/browser playground",
  "user": {
    "name": "Daniel",
    "role": "Admin",
    "tags": ["templates", "browser", "components"]
  }
}`,
			files: `{
  "/layouts/app.kire": "<section class=\\"shell\\"><header class=\\"hero\\"><small>Virtual layout</small><h2>{{ title }}</h2></header><main>@yield(\\"content\\")</main></section>",
  "/components/ui/badge.kire": "<span class=\\"badge\\">{{ label }}</span>"
}`,
		},
	};
	let kireBrowserModulePromise = null;
	let monacoLoaderPromise = null;
	const playgroundEditors = new WeakMap();

	const getCurrentTheme = () =>
		document.documentElement.getAttribute("data-theme") === "dark"
			? "dark"
			: "light";

	const syncThemeUI = () => {
		const active = getCurrentTheme();
		document.querySelectorAll("input.theme-controller").forEach((input) => {
			input.checked = input.value === active;
		});
		const label = document.getElementById("theme-label");
		if (label) label.textContent = active;
	};

	const applyTheme = (theme) => {
		const next = theme === "dark" ? "dark" : "light";
		document.documentElement.setAttribute("data-theme", next);
		localStorage.setItem(STORAGE_KEY, next);
		syncThemeUI();
		syncMonacoTheme();
	};

	const initializeTheme = () => {
		const savedTheme = localStorage.getItem(STORAGE_KEY);
		if (savedTheme === "dark" || savedTheme === "light") {
			document.documentElement.setAttribute("data-theme", savedTheme);
		} else {
			const defaultTheme = window.matchMedia("(prefers-color-scheme: dark)")
				.matches
				? "dark"
				: "light";
			document.documentElement.setAttribute("data-theme", defaultTheme);
			localStorage.setItem(STORAGE_KEY, defaultTheme);
		}
		syncThemeUI();
	};

	const getHljs = () => {
		const candidate = window.hljs;
		if (!candidate || typeof candidate.highlight !== "function") return null;
		return candidate;
	};

	const normalizeHighlightLanguage = (language) => {
		const lang = String(language || "")
			.trim()
			.toLowerCase();
		if (!lang) return "";
		if (lang === "js" || lang === "jsx") return "javascript";
		if (lang === "ts" || lang === "tsx") return "typescript";
		if (lang === "html" || lang === "svg") return "xml";
		if (lang === "sh" || lang === "shell") return "bash";
		if (lang === "text" || lang === "plain") return "plaintext";
		return lang;
	};

	const normalizeCodeLang = (code) => {
		const className = String(code.className || "");
		const match = className.match(/language-([^\s]+)/);
		if (!match?.[1]) return "";
		const raw = String(match[1]).toLowerCase().trim();
		return raw.startsWith(".") ? raw.slice(1) : raw;
	};

	const annotateCodeLang = (code, lang) => {
		const pre = code.closest("pre");
		if (!pre) return;
		if (!pre.hasAttribute("data-code-lang")) {
			pre.setAttribute("data-code-lang", lang || "text");
		}
	};

	const highlightCodeBlock = (code, force = false) => {
		if (!(code instanceof HTMLElement)) return;

		const lang = normalizeCodeLang(code);
		annotateCodeLang(code, lang || "text");

		const rawText = code.textContent || "";
		const hljs = getHljs();
		const normalized = normalizeHighlightLanguage(lang);

		if (!force && code.classList.contains("hljs") && rawText.trim()) return;

		code.textContent = rawText;
		code.classList.remove("hljs");

		if (hljs) {
			const resolvedLang =
				(lang && hljs.getLanguage(lang) && lang) ||
				(normalized && hljs.getLanguage(normalized) && normalized) ||
				"";

			if (
				resolvedLang &&
				!code.classList.contains(`language-${resolvedLang}`)
			) {
				code.classList.add(`language-${resolvedLang}`);
			}

			try {
				hljs.highlightElement(code);
			} catch {}
		}
	};

	const highlightDocsCodeBlocks = () => {
		const candidates = document.querySelectorAll(".docs-surface pre code");
		for (let i = 0; i < candidates.length; i++) {
			highlightCodeBlock(candidates[i]);
		}
	};

	const getMonacoTheme = () =>
		getCurrentTheme() === "dark" ? "vs-dark" : "vs";

	const getPlaygroundEditorBucket = (root) => {
		let bucket = playgroundEditors.get(root);
		if (!bucket) {
			bucket = Object.create(null);
			playgroundEditors.set(root, bucket);
		}
		return bucket;
	};

	const getPlaygroundEditor = (root, role) => {
		const bucket = playgroundEditors.get(root);
		return bucket ? bucket[role] : undefined;
	};

	const setPlaygroundEditor = (root, role, editor) => {
		const bucket = getPlaygroundEditorBucket(root);
		bucket[role] = editor;
	};

	const loadExternalScript = (url) =>
		new Promise((resolve, reject) => {
			const existing = document.querySelector(`script[src="${url}"]`);
			if (existing) {
				if (existing.getAttribute("data-loaded") === "1") {
					resolve();
					return;
				}
				existing.addEventListener("load", () => resolve(), { once: true });
				existing.addEventListener(
					"error",
					() => reject(new Error(`Failed to load ${url}`)),
					{ once: true },
				);
				return;
			}

			const script = document.createElement("script");
			script.src = url;
			script.async = true;
			script.addEventListener(
				"load",
				() => {
					script.setAttribute("data-loaded", "1");
					resolve();
				},
				{ once: true },
			);
			script.addEventListener(
				"error",
				() => {
					reject(new Error(`Failed to load ${url}`));
				},
				{ once: true },
			);
			document.head.appendChild(script);
		});

	const loadMonaco = async () => {
		if (window.monaco?.editor) return window.monaco;

		if (!monacoLoaderPromise) {
			monacoLoaderPromise = (async () => {
				await loadExternalScript(MONACO_LOADER_URL);

				if (typeof window.require !== "function") {
					throw new Error("Monaco AMD loader is unavailable.");
				}

				window.require.config({
					paths: {
						vs: MONACO_BASE_URL,
					},
				});

				window.MonacoEnvironment = {
					getWorkerUrl() {
						const workerSource = `
self.MonacoEnvironment = { baseUrl: ${JSON.stringify(`${MONACO_BASE_URL}/`)} };
importScripts(${JSON.stringify(`${MONACO_BASE_URL}/base/worker/workerMain.js`)});
`;
						return `data:text/javascript;charset=utf-8,${encodeURIComponent(workerSource)}`;
					},
				};

				await new Promise((resolve, reject) => {
					window.require(["vs/editor/editor.main"], resolve, reject);
				});

				return window.monaco;
			})();
		}

		return await monacoLoaderPromise;
	};

	const layoutPlaygroundEditors = (root) => {
		const bucket = playgroundEditors.get(root);
		if (!bucket) return;
		for (const editor of Object.values(bucket)) {
			if (editor && typeof editor.layout === "function") editor.layout();
		}
	};

	const syncMonacoTheme = () => {
		if (window.monaco?.editor) {
			window.monaco.editor.setTheme(getMonacoTheme());
		}
		document
			.querySelectorAll("[data-kire-browser-playground]")
			.forEach((root) => {
				if (root instanceof HTMLElement) layoutPlaygroundEditors(root);
			});
	};

	const editorLanguageForRole = (role) => {
		if (role === "template") return "kire";
		if (role === "locals" || role === "files") return "json";
		return "plaintext";
	};

	const setupMonacoEditor = async (root, role, onChange) => {
		const textarea = root.querySelector(`[data-role='${role}']`);
		if (!(textarea instanceof HTMLTextAreaElement)) return;
		if (getPlaygroundEditor(root, role)) return;

		const monaco = await loadMonaco();
		if (!monaco?.editor) return;

		const host = document.createElement("div");
		host.className = "kire-browser-playground__editor";
		host.setAttribute("data-editor-role", role);
		textarea.insertAdjacentElement("afterend", host);

		const editor = monaco.editor.create(host, {
			value: textarea.value || "",
			language: editorLanguageForRole(role),
			theme: getMonacoTheme(),
			automaticLayout: true,
			minimap: { enabled: false },
			fontFamily: "JetBrains Mono, monospace",
			fontSize: 13,
			lineHeight: 22,
			roundedSelection: false,
			scrollBeyondLastLine: false,
			padding: { top: 12, bottom: 12 },
			wordWrap: role === "template" ? "on" : "off",
		});

		textarea.classList.add("kire-browser-playground__textarea--hidden");
		setPlaygroundEditor(root, role, editor);

		editor.onDidChangeModelContent(() => {
			const value = editor.getValue();
			if (textarea.value !== value) textarea.value = value;
			onChange();
		});
	};

	const setupPlaygroundEditors = async (root, onChange) => {
		try {
			await Promise.all([
				setupMonacoEditor(root, "template", onChange),
				setupMonacoEditor(root, "locals", onChange),
				setupMonacoEditor(root, "files", onChange),
			]);
			layoutPlaygroundEditors(root);
		} catch (error) {
			console.warn("[Kire docs] Monaco failed to load:", error);
		}
	};

	const getPlaygroundPreset = (name) => {
		return PLAYGROUND_PRESETS[name] || PLAYGROUND_PRESETS.starter;
	};

	const parseJsonInput = (value, label) => {
		try {
			const parsed = JSON.parse(value || "{}");
			if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
				throw new Error(`${label} must be a JSON object.`);
			}
			return parsed;
		} catch (error) {
			const reason = error?.message
				? error.message
				: String(error || "Invalid JSON");
			throw new Error(`${label}: ${reason}`);
		}
	};

	const setPlaygroundStatus = (root, message, state) => {
		const status = root.querySelector("[data-role='status']");
		if (!(status instanceof HTMLElement)) return;
		status.textContent = message || "";
		status.setAttribute("data-state", state || "");
	};

	const updatePlaygroundModeUi = (root, mode) => {
		const buttons = root.querySelectorAll("[data-action='mode']");
		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i];
			if (!(button instanceof HTMLButtonElement)) continue;
			button.setAttribute(
				"aria-pressed",
				button.dataset.mode === mode ? "true" : "false",
			);
		}
	};

	const playgroundStorageKey = (root) => {
		const preset = root.getAttribute("data-preset") || "starter";
		return `${PLAYGROUND_STORAGE_PREFIX}:${preset}`;
	};

	const readPlaygroundState = (root) => {
		const template = root.querySelector("[data-role='template']");
		const locals = root.querySelector("[data-role='locals']");
		const files = root.querySelector("[data-role='files']");
		const viewPath = root.querySelector("[data-role='view-path']");
		const autorun = root.querySelector("[data-role='autorun']");

		return {
			mode: root.getAttribute("data-mode") || "view",
			template: template instanceof HTMLTextAreaElement ? template.value : "",
			locals: locals instanceof HTMLTextAreaElement ? locals.value : "{}",
			files: files instanceof HTMLTextAreaElement ? files.value : "{}",
			viewPath:
				viewPath instanceof HTMLInputElement
					? viewPath.value
					: "views.playground",
			autorun: autorun instanceof HTMLInputElement ? autorun.checked : true,
		};
	};

	const writePlaygroundState = (root, state) => {
		const template = root.querySelector("[data-role='template']");
		const locals = root.querySelector("[data-role='locals']");
		const files = root.querySelector("[data-role='files']");
		const viewPath = root.querySelector("[data-role='view-path']");
		const autorun = root.querySelector("[data-role='autorun']");
		const next = state || {};

		if (template instanceof HTMLTextAreaElement)
			template.value = next.template || "";
		if (locals instanceof HTMLTextAreaElement)
			locals.value = next.locals || "{}";
		if (files instanceof HTMLTextAreaElement) files.value = next.files || "{}";
		if (viewPath instanceof HTMLInputElement)
			viewPath.value = next.viewPath || "views.playground";
		if (autorun instanceof HTMLInputElement)
			autorun.checked = next.autorun !== false;

		const templateEditor = getPlaygroundEditor(root, "template");
		const localsEditor = getPlaygroundEditor(root, "locals");
		const filesEditor = getPlaygroundEditor(root, "files");
		if (templateEditor && templateEditor.getValue() !== (next.template || "")) {
			templateEditor.setValue(next.template || "");
		}
		if (localsEditor && localsEditor.getValue() !== (next.locals || "{}")) {
			localsEditor.setValue(next.locals || "{}");
		}
		if (filesEditor && filesEditor.getValue() !== (next.files || "{}")) {
			filesEditor.setValue(next.files || "{}");
		}

		const mode = next.mode || "view";
		root.setAttribute("data-mode", mode);
		updatePlaygroundModeUi(root, mode);
	};

	const persistPlaygroundState = (root) => {
		try {
			localStorage.setItem(
				playgroundStorageKey(root),
				JSON.stringify(readPlaygroundState(root)),
			);
		} catch {}
	};

	const restorePlaygroundState = (root) => {
		const presetName = root.getAttribute("data-preset") || "starter";
		const preset = getPlaygroundPreset(presetName);
		let stored = null;

		try {
			const raw = localStorage.getItem(playgroundStorageKey(root));
			stored = raw ? JSON.parse(raw) : null;
		} catch {}

		writePlaygroundState(root, Object.assign({}, preset, stored || {}));
		setPlaygroundStatus(
			root,
			"Ready. Edit the template and run kire/browser in-place.",
			"",
		);
	};

	const buildPreviewDocument = (html) => {
		return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root { color-scheme: light; }
    body {
      margin: 0;
      padding: 20px;
      font: 14px/1.6 "Space Grotesk", system-ui, sans-serif;
      color: #14213d;
      background:
        radial-gradient(circle at 0% 0%, rgba(109, 40, 217, 0.08), transparent 38%),
        linear-gradient(180deg, #ffffff 0%, #f7f8fc 100%);
    }
    .shell {
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 20px 70px rgba(15, 23, 42, 0.08);
      overflow: hidden;
    }
    .hero {
      padding: 20px 22px;
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(59, 130, 246, 0.08));
    }
    .hero h2 { margin: 6px 0 0; }
    .shell main { padding: 20px 22px; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      padding: 6px 12px;
      background: #1d4ed8;
      color: white;
      font-weight: 600;
      margin-bottom: 14px;
    }
    pre, code { font-family: "JetBrains Mono", monospace; }
  </style>
</head>
<body>${html}</body>
</html>`;
	};

	const writePlaygroundOutput = (root, html) => {
		const preview = root.querySelector("[data-role='preview']");
		const output = root.querySelector("[data-role='output']");

		if (preview instanceof HTMLIFrameElement) {
			preview.srcdoc = buildPreviewDocument(html);
		}

		if (output instanceof HTMLElement) {
			output.textContent = html;
			output.className = "language-html";
			highlightCodeBlock(output, true);
		}
	};

	const loadKireBrowserModule = async () => {
		if (!kireBrowserModulePromise) {
			kireBrowserModulePromise = import(PLAYGROUND_RUNTIME_URL);
		}
		return await kireBrowserModulePromise;
	};

	const createBrowserEngine = async (root) => {
		const { Kire } = await loadKireBrowserModule();
		const state = readPlaygroundState(root);
		const files = parseJsonInput(state.files, "Virtual files JSON");
		files["/views/playground.kire"] = state.template;

		const kire = new Kire({
			root: "/",
			files,
			silent: false,
			production: false,
		});

		kire.namespace("views", "/views");
		kire.namespace("layouts", "/layouts");
		kire.namespace("components", "/components");
		kire.namespace("pages", "/pages");

		return {
			kire,
			mode: state.mode || "view",
			viewPath: state.viewPath || "views.playground",
			locals: parseJsonInput(state.locals, "Locals JSON"),
		};
	};

	const runBrowserPlayground = async (root, requestedMode) => {
		const mode = requestedMode || root.getAttribute("data-mode") || "view";
		root.setAttribute("data-mode", mode);
		updatePlaygroundModeUi(root, mode);
		persistPlaygroundState(root);

		setPlaygroundStatus(root, "Compiling with kire/browser...", "");

		try {
			const runtime = await createBrowserEngine(root);
			const html =
				mode === "render"
					? await runtime.kire.render(
							readPlaygroundState(root).template,
							runtime.locals,
							undefined,
							"browser-playground-inline.kire",
						)
					: await runtime.kire.view(runtime.viewPath, runtime.locals);

			writePlaygroundOutput(root, String(html || ""));
			setPlaygroundStatus(
				root,
				mode === "render"
					? "Rendered with kire.render() using the inline template."
					: `Rendered with kire.view("${runtime.viewPath}") using virtual files.`,
				"ok",
			);
		} catch (error) {
			const message = error?.message
				? error.message
				: String(error || "Unknown error");
			writePlaygroundOutput(
				root,
				`<!-- Kire browser playground error -->\n${message}`,
			);
			setPlaygroundStatus(root, message, "error");
		}
	};

	const setupBrowserPlayground = (root) => {
		if (!(root instanceof HTMLElement)) return;
		if (root.getAttribute("data-kire-playground-init") === "1") return;
		root.setAttribute("data-kire-playground-init", "1");

		restorePlaygroundState(root);

		const inputs = root.querySelectorAll(
			"[data-role='template'], [data-role='locals'], [data-role='files'], [data-role='view-path'], [data-role='autorun']",
		);
		const debouncedRender = (() => {
			let timeoutId = 0;
			return () => {
				clearTimeout(timeoutId);
				timeoutId = window.setTimeout(() => {
					const autorun = root.querySelector("[data-role='autorun']");
					persistPlaygroundState(root);
					if (autorun instanceof HTMLInputElement && autorun.checked) {
						void runBrowserPlayground(root);
					}
				}, 220);
			};
		})();

		for (let i = 0; i < inputs.length; i++) {
			const input = inputs[i];
			input.addEventListener("input", debouncedRender);
			input.addEventListener("change", debouncedRender);
		}

		const modeButtons = root.querySelectorAll("[data-action='mode']");
		for (let i = 0; i < modeButtons.length; i++) {
			const button = modeButtons[i];
			if (!(button instanceof HTMLButtonElement)) continue;
			button.addEventListener("click", () => {
				const mode = button.dataset.mode || "view";
				void runBrowserPlayground(root, mode);
			});
		}

		const reset = root.querySelector("[data-action='reset']");
		if (reset instanceof HTMLButtonElement) {
			reset.addEventListener("click", () => {
				writePlaygroundState(
					root,
					Object.assign(
						{},
						getPlaygroundPreset(root.getAttribute("data-preset") || "starter"),
					),
				);
				persistPlaygroundState(root);
				void runBrowserPlayground(root);
			});
		}

		void setupPlaygroundEditors(root, debouncedRender);
		void runBrowserPlayground(root);
	};

	const setupBrowserPlaygrounds = () => {
		const playgrounds = document.querySelectorAll(
			"[data-kire-browser-playground]",
		);
		for (let i = 0; i < playgrounds.length; i++) {
			setupBrowserPlayground(playgrounds[i]);
		}
	};

	const runDocsEnhancements = () => {
		highlightDocsCodeBlocks();
		setupBrowserPlaygrounds();
		syncThemeUI();
		syncMonacoTheme();
	};

	window.KireDocs = {
		highlightCodeBlock,
		highlightCodeBlocks: highlightDocsCodeBlocks,
	};

	document.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		const toggle = target.closest("#toggle-theme");
		if (!toggle) return;
		const current = getCurrentTheme();
		applyTheme(current === "dark" ? "light" : "dark");
	});

	document.addEventListener("DOMContentLoaded", () => {
		initializeTheme();
		runDocsEnhancements();
	});
	document.addEventListener("kirewire:navigated", runDocsEnhancements);
	window.addEventListener("pageshow", runDocsEnhancements);
	window.addEventListener("resize", syncMonacoTheme);
})();
