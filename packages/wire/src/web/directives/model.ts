import { directive } from "../core/registry";
import { getValueFromElement } from "../core/value";

directive("model", (el, dir, component) => {
	const prop = dir.value;
	const isFile = el instanceof HTMLInputElement && el.type === "file";
	const isDefer = dir.modifiers.includes("defer");
	const eventType =
		dir.modifiers.includes("lazy") || el.tagName === "SELECT" || isFile
			? "change"
			: "input";

	let debounce = 150;
	const debounceMod = dir.modifiers.find((m: string) =>
		m.startsWith("debounce"),
	);
	if (debounceMod) {
		const parts = dir.name.split(".");
		const next = parts[parts.indexOf("debounce") + 1];
		if (next && next.endsWith("ms")) debounce = parseInt(next);
	}
	if (eventType === "change") debounce = 0;

	let timeout: any;
	el.addEventListener(eventType, async () => {
		if (isFile) {
			const input = el as HTMLInputElement;
			let val: any = null;

			if (input.files && input.files.length > 0) {
                const wrapFile = (file: File) => {
                    return {
                        _is_upload_wrapper: true,
                        rawFile: file,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        lastModified: file.lastModified,
                        uploading: { progress: 0, percent: 0, loaded: 0, total: file.size }
                    };
                };

                const files = Array.from(input.files).map(wrapFile);
                
                // Consistency with server: value is an object with 'files' and 'uploading'
                const wrapper = {
                    _wire_type: 'WireFile',
                    files: files,
                    uploading: { progress: 0, percent: 0, loaded: 0, total: files.reduce((acc, f) => acc + f.size, 0) }
                };

                const Alpine = (window as any).Alpine;
                val = Alpine ? Alpine.reactive(wrapper) : wrapper;
			}

            if (val) {
                if (component.data) {
                    component.data[prop] = val;
                }
            }

			if (isDefer) {
				component.deferUpdate({ [prop]: val });
			} else {
				component.update({ [prop]: val });
			}
			return;
		}

		const val = getValueFromElement(el);

		if (isDefer) {
			component.deferUpdate({ [prop]: val });
			return;
		}

		clearTimeout(timeout);
		timeout = setTimeout(() => {
			component.update({ [prop]: val });
		}, debounce);
	});
});
