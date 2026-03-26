import { Component, Variable, Wire } from "../lib/wire";
@Wire({ name: "heavy" })
export default class Heavy extends Component {
	@Variable("boolean")
	public loaded = false;
	@Variable("array")
	public data: string[] = [];

	async load() {
		if (this.loaded) return;
		// Simulate heavy work
		await new Promise((r) => setTimeout(r, 2000));
		this.data = [
			"Result A",
			"Result B",
			"Result C",
			"Loaded asynchronously after first paint",
		];
		this.loaded = true;
	}

	render() {
		return this.view("components.heavy");
	}
}
