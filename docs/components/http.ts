import { Component, Variable, Wire, WireBroadcast } from "../lib/wire";
@Wire({ name: "http" })
export default class Http extends Component {
	@Variable("number")
	public counter = 0;
	@Variable("any")
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
