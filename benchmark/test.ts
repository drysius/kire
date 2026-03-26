import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Kire } from "../core/src/index.ts";

const templates = {
	kire: `
<div class="container">
    <h1>{{ title }}</h1>
    <ul>
        @for(user of users)
            <li class="{{ user.active ? 'active' : '' }}">
                {{ user.name }} ({{ user.email }})
                @if(user.isAdmin)
                    <span class="badge">Admin</span>
                @endif
            </li>
        @endfor
    </ul>
</div>`.trim(),
	kire_components: `
<div class="container">
    <h1>{{ title }}</h1>
    <ul>
        @for(user of users)
            <x-user-row :user="user" />
        @endfor
    </ul>
</div>`.trim(),
	componentUserRow: `
<li class="{{ user.active ? 'active' : '' }}">
    {{ user.name }} ({{ user.email }})
    @if(user.isAdmin)
        <span class="badge">Admin</span>
    @endif
</li>`.trim(),
};

const data = {
	title: "Benchmark Test",
	users: Array.from({ length: 10 }, (_, i) => ({
		name: `User ${i}`,
		email: `user${i}@example.com`,
		active: i % 2 === 0,
		isAdmin: i % 10 === 0,
	})),
};

const kire = new Kire({
	production: true,
	async: false,
	silent: true,
});

kire.namespace("components", "components");
kire.$files[kire.resolvePath("components.user-row")] =
	templates.componentUserRow;

const compiledFlat = kire.compile(templates.kire, "__inspect_kire_flat__.kire");
const compiledComponents = kire.compile(
	templates.kire_components,
	"__inspect_kire_components__.kire",
);
const compiledRow = kire.getOrCompile("components.user-row");

if (!compiledFlat.fn || !compiledComponents.fn) {
	throw new Error("Compile did not return executable fn.");
}

const outDir = join(process.cwd(), "benchmark", "results", "inspect");
mkdirSync(outDir, { recursive: true });

const renderedFlat = kire.run(compiledFlat.fn, data);
const renderedComponents = kire.run(compiledComponents.fn, data);

writeFileSync(
	join(outDir, "flat.main.code.js"),
	String(compiledFlat.code || ""),
	"utf8",
);
writeFileSync(join(outDir, "flat.main.fn.js"), String(compiledFlat.fn), "utf8");
writeFileSync(
	join(outDir, "components.main.code.js"),
	String(compiledComponents.code || ""),
	"utf8",
);
writeFileSync(
	join(outDir, "components.main.fn.js"),
	String(compiledComponents.fn),
	"utf8",
);
writeFileSync(
	join(outDir, "components.row.code.js"),
	String(compiledRow.meta?.code || ""),
	"utf8",
);
writeFileSync(
	join(outDir, "components.row.fn.js"),
	String(compiledRow),
	"utf8",
);
writeFileSync(join(outDir, "flat.render.html"), String(renderedFlat), "utf8");
writeFileSync(
	join(outDir, "components.render.html"),
	String(renderedComponents),
	"utf8",
);

const summary = {
	flatCodeLength: Number(compiledFlat.code?.length || 0),
	componentsCodeLength: Number(compiledComponents.code?.length || 0),
	rowCodeLength: Number(compiledRow.meta?.code?.length || 0),
	flatFnType: typeof compiledFlat.fn,
	componentsFnType: typeof compiledComponents.fn,
	rowFnType: typeof compiledRow,
};

writeFileSync(
	join(outDir, "summary.json"),
	JSON.stringify(summary, null, 2),
	"utf8",
);

console.log("compiled.fn (components):", compiledComponents.fn.toString());
console.log("saved artifacts in:", outDir);
console.log(summary);
