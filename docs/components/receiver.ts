import { Component, Variable, Wire } from "../lib/wire";
@Wire({ name: "receiver" })
export default class Receiver extends Component {
	@Variable("string")
	public message = "Waiting...";

	@Variable("any")
	public listeners = {
		hello: "updateMessage",
	};

	public updateMessage(text: string) {
		this.message = `Received: ${text} at ${new Date().toLocaleTimeString()}`;
	}

	async render() {
		return this.view("components.receiver");
	}
}
