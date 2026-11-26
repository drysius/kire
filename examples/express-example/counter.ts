// A minimal Kirewire reactive component. In your app this imports from
// "@kirejs/wire"; here it uses the workspace source.
import { Component, LiveComponent, prop } from "../../packages/wire/src/index";

@Component("counter")
export class Counter extends LiveComponent {
	@prop count = 0;

	increment() {
		this.count++;
	}
	decrement() {
		this.count--;
	}

	render() {
		return (
			`<div style="font: 16px system-ui">` +
			`<button wire:click="decrement">-</button> ` +
			`<strong>${this.count}</strong> ` +
			`<button wire:click="increment">+</button>` +
			`</div>`
		);
	}
}
