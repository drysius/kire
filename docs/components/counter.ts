import { Component, Variable, Wire } from "../lib/wire";
@Wire({ name: "counter" })
export default class Counter extends Component {
	@Variable("number")
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
