import { Component, LiveComponent, prop } from "@kirejs/wire";

@Component("demo-counter")
export class Counter extends LiveComponent {
	@prop count = 0;
	@prop step = 1;

	increment() { this.count += this.step; }
	decrement() { this.count -= this.step; }
	reset() { this.count = 0; }

	render() { return this.view("components.counter"); }
}
