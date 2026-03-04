import { Component } from "@kirejs/wire";

export default class Receiver extends Component {
	public message = "Waiting...";

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