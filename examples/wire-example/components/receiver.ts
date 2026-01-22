import { WireComponent } from "@kirejs/wire";

export default class Receiver extends WireComponent {
	public message = "Waiting...";

	// Listen for 'hello' event and call 'updateMessage'
	public listeners = {
		"hello": "updateMessage"
	};

	public updateMessage(text: string) {
		this.message = `Received: ${text} at ${new Date().toLocaleTimeString()}`;
	}

	async render() {
		return this.view('components.receiver');
	}
}
