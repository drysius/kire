import { WireComponent } from "@kirejs/wire";

// Simple in-memory store for demo purposes
const db = {
	messages: [{ user: "System", text: "Welcome to the chat!" }] as Array<{
		user: string;
		text: string;
		time: number;
	}>,
};

export default class Chat extends WireComponent {
	public input = "";
	public username = "Guest";

	// Poll every 1s to get new messages
	// Note: wire:poll usage needs to be in the template

	get messages() {
		return db.messages;
	}

	public sendMessage() {
		if (!this.input.trim()) return;

		db.messages.push({
			user: this.username,
			text: this.input,
			time: Date.now(),
		});

		this.input = "";

		// Keep only last 50 messages
		if (db.messages.length > 50) db.messages.shift();
	}

	render() {
		return this.view("components.chat");
	}
}
