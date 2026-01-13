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
		return `
        <div style="border: 1px solid #ccc; padding: 10px; margin-top: 10px;">
            <h3>Receiver</h3>
            <p>${this.message}</p>
        </div>
        `;
	}
}
