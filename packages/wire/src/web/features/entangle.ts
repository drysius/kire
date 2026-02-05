
export function generateEntangleFunction(component: any, Alpine: any) {
    return (name: string, live: boolean = false) => {
        const isLive = live;
        
        // Initial check
        if (component.data[name] === undefined) {
            console.error(`KireWire Entangle Error: Property ['${name}'] cannot be found on component: ['${component.name}']`);
            return;
        }

        return Alpine.interceptor((initialValue: any, getter: any, setter: any) => {
            // Use Alpine's native entangle if available (it handles the loop prevention logic best)
            if (Alpine.entangle) {
                const release = Alpine.entangle(
                    {
                        // Outer scope (KireWire Component)
                        get() {
                            return component.data[name];
                        },
                        set(value: any) {
                            component.data[name] = value;
                            if (isLive) {
                                component.update({ [name]: value });
                            } else {
                                component.deferUpdate({ [name]: value });
                            }
                        }
                    },
                    {
                        // Inner scope (Alpine Data)
                        get() {
                            return getter();
                        },
                        set(value: any) {
                            setter(value);
                        }
                    }
                );

                // Cleanup when the element is removed
                return () => {
                    release();
                };
            }

            // Fallback if Alpine.entangle isn't exposed (unlikely in v3)
            // But just in case, we keep a simplified robust version
            let externalUpdate = false;

            const handler = (e: any) => {
                // Ensure the event targets this component
                if (e.detail && name in e.detail) {
                    const newValue = e.detail[name];
                    if (JSON.stringify(newValue) !== JSON.stringify(getter())) {
                        externalUpdate = true;
                        setter(newValue);
                        externalUpdate = false;
                    }
                }
            };
            
            // Listen for component-specific updates
            window.addEventListener(`wire:update:${component.id}`, handler);

            Alpine.effect(() => {
                const alpineValue = getter();
                if (externalUpdate) return;

                if (JSON.stringify(alpineValue) !== JSON.stringify(component.data[name])) {
                    if (isLive) {
                        component.update({ [name]: alpineValue });
                    } else {
                        component.deferUpdate({ [name]: alpineValue });
                    }
                }
            });

            return () => {
                window.removeEventListener(`wire:update:${component.id}`, handler);
            };

        }, (obj: any) => {
            Object.defineProperty(obj, 'live', {
                get() {
                    live = true;
                    return obj;
                }
            });
        })(component.data[name]); // Pass initial value
    };
}
