import { WireComponent } from "@kirejs/wire";

export default class Sender extends WireComponent {
	public text = "Hello World";

	async send() {
		// Emit 'hello' event with the text
		this.emit("hello", this.text);
        this.text = "";
	}

	render() {
		return `
        <div style="border: 1px solid #ccc; padding: 10px;">
            <h3>Sender</h3>
            <input wire:model="text" type="text" value="${this.text}" placeholder="Type a message..." />
            <button wire:click="send">Send Event</button>
        </div>
        `;
	}
}
