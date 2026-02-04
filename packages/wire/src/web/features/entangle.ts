export function generateEntangleFunction(component: any, Alpine: any) {
	return (name: string, live: boolean = false) => {
		const initialValue = component.data[name];

		return Alpine.interceptor(
			(initial: any, getter: any, setter: any) => {
				let externalUpdate = false;

				// 1. Wire -> Alpine (Event Listener - "Old Logic")
				const handler = (e: any) => {
					if (name in e.detail) {
						const newValue = e.detail[name];
						if (JSON.stringify(newValue) !== JSON.stringify(getter())) {
							externalUpdate = true;
							setter(newValue);
							externalUpdate = false;
						}
					}
				};
				window.addEventListener(`wire:update:${component.id}`, handler);

				// 2. Alpine -> Wire (Reactive)
				Alpine.effect(() => {
					const alpineValue = getter();

					if (externalUpdate) return; // Skip if triggered by Wire update

					if (JSON.stringify(alpineValue) !== JSON.stringify(component.data[name])) {
						if (live) {
							component.update({ [name]: alpineValue });
						} else {
							component.deferUpdate({ [name]: alpineValue });
						}
					}
				});

				// Cleanup
				return () => {
					window.removeEventListener(`wire:update:${component.id}`, handler);
				};
			},
			(obj: any) => {
				// Live modifier support: $wire.entangle('prop').live
				Object.defineProperty(obj, "live", {
					get() {
						live = true;
						return obj;
					},
				});
			},
		)(initialValue);
	};
}

function cloneIfObject(value: any) {
    return typeof value === 'object' && value !== null
        ? JSON.parse(JSON.stringify(value))
        : value;
}