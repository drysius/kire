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
                // Helper to wrap file with progress state
                const wrapFile = (file: File) => {
                    // Create a reactive proxy if Alpine is available to ensure UI updates
                    const wrapper = {
                        _is_upload_wrapper: true,
                        rawFile: file,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        lastModified: file.lastModified,
                        uploading: {
                            progress: 0,
                            loaded: 0,
                            total: file.size,
                            percent: 0 // Alias for convenience
                        }
                    };
                    
                    const Alpine = (window as any).Alpine;
                    return Alpine ? Alpine.reactive(wrapper) : wrapper;
                };

				val = input.multiple 
                    ? Array.from(input.files).map(wrapFile) 
                    : wrapFile(input.files[0]);
			}

            // Immediately set the property on the component to trigger Alpine UI updates
            // (optimistic UI for "file selected")
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