import { Component } from "@kirejs/wire";

export default class Counter extends Component {
	public count = 0;

	async increment() {
		this.count++;
	}

	async decrement() {
		this.count--;
	}

	async reset() {
		this.count = 0;
	}

	async render() {
		return this.view("components.counter");
	}
}
