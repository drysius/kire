import { Component, WireBroadcast } from "@kirejs/wire";

export default class Http extends Component {
	public counter = 0;
	public shared = new WireBroadcast({
		name: "shared-counter",
		autodelete: true,
		includes: ["counter"],
	});

	async mount() {
		this.shared.hydrate(this);
	}

	increment() {
		this.counter++;
	}

	render() {
		this.shared.update(this);
		return this.view("components.http");
	}
}