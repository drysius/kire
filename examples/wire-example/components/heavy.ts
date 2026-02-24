import { Component } from "@kirejs/wire";

export default class Heavy extends Component {
	public loaded = false;
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
