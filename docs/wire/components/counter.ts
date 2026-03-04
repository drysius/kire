import { Component } from "@kirejs/wire";

export default class Counter extends Component {
	public count = 0;
	public interval: NodeJS.Timeout
	async increment() {
		this.count++;
	}

	async decrement() {
		this.count--;
	}

	async reset() {
		this.count = 0;
	}

	async mount() {
		this.interval = setInterval(() => {
			this.count++;
			this.emit("countUpdated", this.count);
		}, 1000);
	}

	async unmount() {
		clearInterval(this.interval);
	}

	async render() {
		return this.view("components.counter");
	}
}