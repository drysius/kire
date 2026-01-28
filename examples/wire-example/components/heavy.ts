import { WireComponent } from "@kirejs/wire";

export default class Heavy extends WireComponent {
	public data: string[] = [];

	async mount(params: any) {
		// Simulate heavy work
		await new Promise((r) => setTimeout(r, 2000));
		this.data = [
			"Result A",
			"Result B",
			"Result C",
			"Params: " + JSON.stringify(params),
		];
	}
	
	render() {
		return this.view("components.heavy");
	}
}
