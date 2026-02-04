import { directive } from "../core/registry";
import { getValueFromElement } from "../core/value";

directive("model", (el, dir, component) => {
	const prop = dir.value;
	const isFile = el instanceof HTMLInputElement && el.type === "file";
	const isDefer = dir.modifiers.includes("defer");
    // Livewire 3 style: default is NOT live (updates on change/blur). Use .live for input events.
    const isLive = dir.modifiers.includes("live");
	
    const Alpine = (window as any).Alpine;

    if (isFile) {
        el.addEventListener('change', async () => {
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
                const wrapper = {
                    _wire_type: 'WireFile',
                    files: files,
                    uploading: { progress: 0, percent: 0, loaded: 0, total: files.reduce((acc, f) => acc + f.size, 0) }
                };

                val = Alpine ? Alpine.reactive(wrapper) : wrapper;
			}

            if (val && component.data) {
                component.data[prop] = val;
            }

			if (isDefer) {
				component.deferUpdate({ [prop]: val });
			} else {
				component.update({ [prop]: val });
			}
        });
        return;
    }

    if (Alpine) {
        let debounce = 150;
        const debounceMod = dir.modifiers.find((m: string) => m.startsWith("debounce"));
        if (debounceMod) {
            const parts = dir.name.split(".");
            const next = parts[parts.indexOf("debounce") + 1];
            if (next && next.endsWith("ms")) debounce = parseInt(next);
        }

        let timeout: any;

        // Use x-model logic via Alpine.bind
        // This ensures the input value is always synced with component.data[prop]
        Alpine.bind(el, {
            'x-model'() {
                return {
                    get() {
                        return component.data[prop];
                    },
                    set(value: any) {
                        component.data[prop] = value;

                        if (isDefer) {
                            component.deferUpdate({ [prop]: value });
                        } else if (isLive) {
                            clearTimeout(timeout);
                            timeout = setTimeout(() => {
                                component.update({ [prop]: value });
                            }, debounce);
                        } else {
                            // Default: update on change (handled by x-model automatically usually, 
                            // but we trigger a component update to sync with server)
                            // We use a small delay to ensure Alpine finished updating the data
                            clearTimeout(timeout);
                            timeout = setTimeout(() => {
                                component.update({ [prop]: value });
                            }, 0);
                        }
                    }
                }
            }
        });
    } else {
        // Fallback for non-Alpine environments
        const eventType = isLive ? 'input' : 'change';
        el.addEventListener(eventType, () => {
            const val = getValueFromElement(el as HTMLElement);
            component.data[prop] = val;
            if (!isDefer) component.update({ [prop]: val });
        });
    }
});
